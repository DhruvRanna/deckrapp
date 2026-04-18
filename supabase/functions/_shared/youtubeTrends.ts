// Fetch live YouTube trending titles for a niche.
// Uses YouTube Data API v3 search endpoint (cheap on quota: ~100 units per call).
// Results cached in-memory per niche for 1 hour to minimize quota usage.

type CacheEntry = { titles: string[]; expires: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getYouTubeTrendingTitles(niche: string, maxResults = 10): Promise<string[]> {
  const key = niche.toLowerCase().trim();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return cached.titles;

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return [];

  try {
    // Search for trending videos in this niche from the past week, ordered by view count
    const publishedAfter = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", niche);
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("publishedAfter", publishedAfter);
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("key", apiKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      console.warn(`[youtube] API error ${resp.status}:`, (await resp.text()).slice(0, 200));
      return [];
    }
    const data = await resp.json();
    const titles: string[] = (data?.items || [])
      .map((it: any) => it?.snippet?.title)
      .filter((t: any) => typeof t === "string" && t.length > 0);

    cache.set(key, { titles, expires: now + TTL_MS });
    console.log(`[youtube] Fetched ${titles.length} trending titles for "${niche}"`);
    return titles;
  } catch (e) {
    console.error("[youtube] fetch failed:", e);
    return [];
  }
}
