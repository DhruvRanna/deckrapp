// Fetches real, engaging media (videos/images + thumbnails) from social platforms
// via RapidAPI scrapers. Used to enrich swipe-feed cards with platform-native visuals
// so users get inspiration that *looks* like real viral content for their niche.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type MediaItem = {
  platform: string;            // e.g. "TIKTOK", "INSTAGRAM", "YOUTUBE SHORTS", "LINKEDIN", "X"
  title: string;               // post caption/title
  mediaUrl: string;            // image or video URL (best available)
  mediaType: "image" | "video";
  thumbnailUrl: string;        // poster/cover used in the card
  sourceUrl: string;           // public link to original post
  author?: string;             // creator handle/name
  stats?: { likes?: number; views?: number; comments?: number };
};

const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY") || "";

// Light in-memory cache (1h) — RapidAPI requests are rate-limited and slow.
const cache = new Map<string, { ts: number; items: MediaItem[] }>();
const TTL_MS = 60 * 60 * 1000;

function cacheGet(key: string): MediaItem[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > TTL_MS) { cache.delete(key); return null; }
  return hit.items;
}
function cacheSet(key: string, items: MediaItem[]) {
  cache.set(key, { ts: Date.now(), items });
}

async function rapidGet(host: string, path: string, timeoutMs = 7000): Promise<any | null> {
  if (!RAPIDAPI_KEY) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://${host}${path}`, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": host,
        "Content-Type": "application/json",
      },
      signal: ctrl.signal,
    });
    if (!r.ok) {
      console.warn(`[rapidGet] ${host}${path} -> ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (e) {
    console.warn(`[rapidGet] ${host}${path} failed:`, (e as Error).message);
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ---------- Per-platform fetchers ----------

async function fetchTikTok(keyword: string, count: number): Promise<MediaItem[]> {
  const data = await rapidGet(
    "tiktok-scraper7.p.rapidapi.com",
    `/feed/search?keywords=${encodeURIComponent(keyword)}&count=${count}&cursor=0&region=US&publish_time=0&sort_type=0`
  );
  const list = data?.data?.videos || data?.data || [];
  return (Array.isArray(list) ? list : []).slice(0, count).map((v: any): MediaItem => ({
    platform: "TIKTOK",
    title: v.title || v.desc || "TikTok video",
    mediaUrl: v.play || v.wmplay || v.cover || "",
    mediaType: "video",
    thumbnailUrl: v.cover || v.origin_cover || v.ai_dynamic_cover || "",
    sourceUrl: v.share_url || (v.author?.unique_id && v.video_id ? `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}` : ""),
    author: v.author?.nickname || v.author?.unique_id,
    stats: { likes: v.digg_count, views: v.play_count, comments: v.comment_count },
  })).filter((m) => m.thumbnailUrl);
}

async function fetchYouTubeShorts(keyword: string, count: number): Promise<MediaItem[]> {
  // Use search endpoint — works for any keyword/niche.
  const data = await rapidGet(
    "youtube-all-data-scraper1.p.rapidapi.com",
    `/search?query=${encodeURIComponent(keyword + " shorts")}&type=video`
  );
  const list = data?.data || data?.results || data?.videos || [];
  return (Array.isArray(list) ? list : []).slice(0, count).map((v: any): MediaItem => {
    const id = v.videoId || v.id || v.video_id;
    const thumb = v.thumbnails?.[v.thumbnails.length - 1]?.url || v.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
    return {
      platform: "YOUTUBE SHORTS",
      title: v.title || "YouTube Short",
      mediaUrl: id ? `https://www.youtube.com/shorts/${id}` : "",
      mediaType: "video",
      thumbnailUrl: thumb,
      sourceUrl: id ? `https://www.youtube.com/shorts/${id}` : "",
      author: v.channel?.name || v.author,
      stats: { views: typeof v.viewCount === "number" ? v.viewCount : undefined },
    };
  }).filter((m) => m.thumbnailUrl);
}

async function fetchInstagram(keyword: string, count: number): Promise<MediaItem[]> {
  // Instagram Scraper hashtag posts endpoint
  const tag = keyword.replace(/\s+/g, "").toLowerCase();
  const data = await rapidGet(
    "instagram-scraper21.p.rapidapi.com",
    `/api/v1/hashtag/posts?hashtag=${encodeURIComponent(tag)}&count=${count}`
  );
  const list = data?.data?.items || data?.items || data?.data || [];
  return (Array.isArray(list) ? list : []).slice(0, count).map((p: any): MediaItem => {
    const isVideo = !!(p.video_url || p.is_video || p.video_versions);
    const thumb = p.thumbnail_url || p.display_url || p.image_versions2?.candidates?.[0]?.url || p.cover_frame_url || "";
    return {
      platform: "INSTAGRAM",
      title: p.caption?.text || p.caption || "Instagram post",
      mediaUrl: p.video_url || p.video_versions?.[0]?.url || thumb,
      mediaType: isVideo ? "video" : "image",
      thumbnailUrl: thumb,
      sourceUrl: p.code ? `https://www.instagram.com/p/${p.code}/` : (p.permalink || ""),
      author: p.user?.username || p.owner?.username,
      stats: { likes: p.like_count, comments: p.comment_count, views: p.play_count },
    };
  }).filter((m) => m.thumbnailUrl);
}

async function fetchLinkedIn(keyword: string, count: number): Promise<MediaItem[]> {
  const data = await rapidGet(
    "realtime-linkdin-data-scraper.p.rapidapi.com",
    `/postSearch.php?searchTerm=${encodeURIComponent(keyword)}`
  );
  const list = data?.posts || data?.data || data?.results || [];
  return (Array.isArray(list) ? list : []).slice(0, count).map((p: any): MediaItem => {
    const thumb = p.image || p.thumbnail || p.media?.[0]?.url || p.author?.image || "";
    return {
      platform: "LINKEDIN",
      title: p.text || p.title || "LinkedIn post",
      mediaUrl: thumb,
      mediaType: "image",
      thumbnailUrl: thumb,
      sourceUrl: p.url || p.postUrl || "",
      author: p.author?.name || p.authorName,
      stats: { likes: p.likes || p.reactions, comments: p.comments },
    };
  }).filter((m) => m.thumbnailUrl);
}

// ---------- Public handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { platform = "", niche = "", count = 6 } = await req.json().catch(() => ({}));
    const p = String(platform).toLowerCase();
    const key = `${p}|${niche.toLowerCase()}|${count}`;

    const cached = cacheGet(key);
    if (cached) {
      return new Response(JSON.stringify({ items: cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let items: MediaItem[] = [];
    const kw = niche || "viral";

    if (p.includes("tiktok")) {
      items = await fetchTikTok(kw, count);
    } else if (p.includes("youtube")) {
      items = await fetchYouTubeShorts(kw, count);
    } else if (p.includes("instagram") || p.includes("reel")) {
      items = await fetchInstagram(kw, count);
    } else if (p.includes("linkedin")) {
      items = await fetchLinkedIn(kw, count);
    } else if (p.includes("twitter") || p === "x") {
      // Twitter scraper requires async task flow — skip for now (return empty so card renders without media).
      items = [];
    } else {
      // Default: try YouTube as the safest catch-all.
      items = await fetchYouTubeShorts(kw, count);
    }

    if (items.length > 0) cacheSet(key, items);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-trending-media error:", e);
    return new Response(JSON.stringify({ items: [], error: e instanceof Error ? e.message : "Unknown" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
