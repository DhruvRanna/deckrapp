import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupaUser, Session } from "@supabase/supabase-js";
import { isPreviewAuthEnvironment } from "@/lib/authEnv";
import type { AuthAction, AuthActionResult } from "@/lib/authTypes";

const AUTH_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`;
const AUTH_API_VERSION = "2024-01-01";
const AUTH_REQUEST_TIMEOUT_MS = 3200;

interface UserPlan {
  id: string;
  name: "FREE" | "CREATOR" | "PRO";
  price: number;
  swipesPerDay: number;
  scriptsPerMonth: number;
  nichesAllowed: number;
  features: string[];
}

const PLANS: Record<string, UserPlan> = {
  FREE: { id: "free", name: "FREE", price: 0, swipesPerDay: 10, scriptsPerMonth: 3, nichesAllowed: 1, features: ["10 swipes per day", "3 scripts per month", "1 content niche", "Basic calendar"] },
  CREATOR: { id: "creator", name: "CREATOR", price: 5, swipesPerDay: 50, scriptsPerMonth: 15, nichesAllowed: 3, features: ["50 swipes per day", "15 scripts per month", "Up to 3 niches", "Full calendar + export", "Priority support"] },
  PRO: { id: "pro", name: "PRO", price: 19, swipesPerDay: Infinity, scriptsPerMonth: Infinity, nichesAllowed: Infinity, features: ["Unlimited swipes", "Unlimited scripts", "Unlimited niches", "Priority AI generation", "Full calendar + export", "Early access features"] },
};

export interface ContentIdea {
  id: string;
  platform: string;
  title: string;
  hook: string;
  insight: string;
  tags: string[];
  duration: string;
  competition: string;
  viralScore: number;
  color: string;
  scheduledDate?: string;
  trending?: boolean;
}

export interface GeneratedScript {
  id: string;
  ideaId?: string;
  title: string;
  platform: string;
  hookText: string;
  bodyText: string;
  ctaText: string;
  deliveryTip: string;
  createdAt: string;
}

interface UserProfile {
  name: string;
  email: string;
  plan: UserPlan;
  niches: string[];
  platforms: string[];
  postingFrequency: string;
  savedIdeas: ContentIdea[];
  scripts: GeneratedScript[];
  swipesToday: number;
  scriptsThisMonth: number;
  streak: number;
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  authUser: SupaUser | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  resendVerification: (email: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  completeOnboarding: (niches: string[], platforms: string[], frequency: string) => Promise<void>;
  saveIdea: (idea: ContentIdea) => Promise<void>;
  deleteIdea: (ideaId: string) => Promise<void>;
  deleteScript: (scriptId: string) => Promise<void>;
  scheduleIdea: (ideaId: string, date: string) => Promise<void>;
  upgradePlan: (planName: "FREE" | "CREATOR" | "PRO") => Promise<void>;
  updateNiches: (niches: string[]) => Promise<void>;
  updatePostingFrequency: (freq: string) => Promise<void>;
  updateNotifications: (enabled: boolean) => Promise<void>;
  updatePlatforms: (platforms: string[]) => Promise<void>;
  incrementSwipe: () => boolean;
  canSwipe: () => boolean;
  canGenerateScript: () => boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export { PLANS };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<SupaUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<UserProfile | null>(null);

  useEffect(() => { userRef.current = user; }, [user]);

  const buildResult = useCallback((params: {
    ok: boolean;
    action: AuthAction;
    email: string;
    message: string;
    transport: "client" | "proxy";
    startedAt: number;
    emailRequested?: boolean;
    verificationRequired?: boolean;
    sessionEstablished?: boolean;
    errorCode?: string;
    errorMessage?: string;
  }): AuthActionResult => ({
    ok: params.ok,
    action: params.action,
    email: params.email,
    message: params.message,
    transport: params.transport,
    durationMs: Date.now() - params.startedAt,
    timestamp: new Date().toISOString(),
    emailRequested: params.emailRequested,
    verificationRequired: params.verificationRequired,
    sessionEstablished: params.sessionEstablished,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
  }), []);

  const parseError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    return {
      message,
      code: error && typeof error === "object" && "name" in error ? String((error as { name?: string }).name || "") : undefined,
    };
  };

  const isTransportFailure = (error: unknown) => {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return (
      message.includes("failed to fetch") ||
      message.includes("failed to send a request") ||
      message.includes("edge function") ||
      message.includes("network") ||
      message.includes("timed out") ||
      message.includes("timeout") ||
      message.includes("functionsfetcherror")
    );
  };

  const withRetry = async <T,>(fn: () => Promise<T>, attempts = 3, delayMs = 600): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (e: any) {
        lastErr = e;
        const msg = (e?.message || "").toLowerCase();
        const transient = msg.includes("failed to fetch") || msg.includes("network") || e?.status === 0;
        if (!transient || i === attempts - 1) throw e;
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
    throw lastErr;
  };

  const authHeaders = useCallback(() => ({
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json;charset=UTF-8",
    "x-client-info": "deckr-direct-auth/1.0",
    "x-supabase-api-version": AUTH_API_VERSION,
  }), []);

  const parseDirectAuthError = async (response: Response) => {
    try {
      const data = await response.json();
      const message =
        (typeof data?.msg === "string" && data.msg) ||
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error_description === "string" && data.error_description) ||
        (typeof data?.error === "string" && data.error) ||
        `Auth request failed (${response.status})`;

      return {
        message,
        code:
          (typeof data?.code === "string" && data.code) ||
          (typeof data?.error_code === "string" && data.error_code) ||
          response.statusText || undefined,
      };
    } catch {
      const text = await response.text().catch(() => "");
      return {
        message: text || `Auth request failed (${response.status})`,
        code: response.statusText || undefined,
      };
    }
  };

  const directAuthRequest = useCallback(async <T,>(path: string, body: Record<string, unknown>) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${AUTH_BASE_URL}${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const parsed = await parseDirectAuthError(response);
        const error = new Error(parsed.message);
        if (parsed.code) error.name = parsed.code;
        throw error;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Auth request timed out.");
      }

      const parsed = parseError(error, "Auth request failed.");
      throw Object.assign(new Error(parsed.message), parsed.code ? { name: parsed.code } : {});
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [authHeaders]);

  const directForgotPassword = useCallback(async (email: string) => {
    await directAuthRequest(`/recover?redirect_to=${encodeURIComponent(`${window.location.origin}/reset-password`)}`, {
      email,
      code_challenge: null,
      code_challenge_method: null,
      gotrue_meta_security: {},
    });
  }, [directAuthRequest]);

  const directResendVerification = useCallback(async (email: string) => {
    await directAuthRequest(`/resend?redirect_to=${encodeURIComponent(window.location.origin)}`, {
      email,
      type: "signup",
      gotrue_meta_security: {},
    });
  }, [directAuthRequest]);

  const applySession = useCallback(async (session: Session | null | undefined) => {
    if (!session) return;
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error) throw error;
  }, []);

  const directLogin = async (email: string, password: string) => {
    const data = await directAuthRequest<{
      access_token: string;
      refresh_token: string;
      token_type?: string;
      expires_in: number;
      expires_at?: number;
      user: SupaUser;
    }>("/token?grant_type=password", {
      email,
      password,
      gotrue_meta_security: {},
    });

    const session: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: "bearer",
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      user: data.user,
    };

    await applySession(session);
    await syncAuthenticatedUser(session);
    return session;
  };

  const directSignup = async (name: string, email: string, password: string) => {
    const data = await directAuthRequest<{
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      expires_at?: number;
      user: SupaUser;
    }>("/signup", {
      email,
      password,
      data: { display_name: name },
      gotrue_meta_security: {},
      code_challenge: null,
      code_challenge_method: null,
    });

    const hasSession = !!data.access_token && !!data.refresh_token;
    if (!hasSession) {
      return { session: null, user: data.user };
    }

    const session: Session = {
      access_token: data.access_token!,
      refresh_token: data.refresh_token!,
      token_type: "bearer",
      expires_in: data.expires_in || 3600,
      expires_at: data.expires_at,
      user: data.user,
    };

    await applySession(session);
    await syncAuthenticatedUser(session);
    return { session, user: data.user };
  };

  const callAuthProxy = useCallback(async (action: "signup" | "login" | "forgot_password" | "resend_verification", payload: Record<string, unknown>) => {
    const { data, error } = await new Promise<Awaited<ReturnType<typeof supabase.functions.invoke>>>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => reject(new Error("Auth relay timed out.")), 4500);

      supabase.functions.invoke("auth-proxy", {
        body: {
          action,
          redirectTo: `${window.location.origin}/reset-password`,
          ...payload,
        },
      })
        .then((result) => {
          window.clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((invokeError) => {
          window.clearTimeout(timeoutId);
          reject(invokeError);
        });
    });

    if (error) throw error;
    return {
      ...(data as Omit<AuthActionResult, "action"> & { session?: Session | null }),
      action:
        action === "forgot_password"
          ? "forgot-password"
          : action === "resend_verification"
            ? "resend-verification"
            : action,
    } as AuthActionResult & { session?: Session | null };
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      let { data: profile, error: pErr } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      if (pErr) { console.warn("[loadProfile] fetch failed:", pErr.message); return null; }
      if (!profile) {
        const { data: { user: authData } } = await supabase.auth.getUser();
        const email = authData?.email || "";
        const name = authData?.user_metadata?.display_name || email.split("@")[0] || "";
        const { data: newProfile, error: insErr } = await supabase.from("profiles").insert({
          user_id: uid, display_name: name, email, notifications_enabled: true,
        }).select().single();
        if (insErr) { console.warn("[loadProfile] profile create failed:", insErr.message); return null; }
        profile = newProfile;
        if (!profile) return null;
      }

      const { data: ideas } = await supabase.from("saved_ideas").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      const { data: scripts } = await supabase.from("scripts").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      const plan = PLANS[profile.plan] || PLANS.FREE;
      const today = new Date().toISOString().split("T")[0];
      let swipesToday = profile.swipes_today;
      if (profile.last_swipe_date !== today) {
        swipesToday = 0;
        await supabase.from("profiles").update({ swipes_today: 0, last_swipe_date: today }).eq("user_id", uid);
      }
      const localSwipes = userRef.current?.swipesToday || 0;
      if (localSwipes > swipesToday && profile.last_swipe_date === today) swipesToday = localSwipes;

      const userProfile: UserProfile = {
        name: profile.display_name,
        email: profile.email,
        plan,
        niches: profile.niches || [],
        platforms: profile.platforms || [],
        postingFrequency: profile.posting_frequency || "",
        savedIdeas: (ideas || []).map((i: any) => ({
          id: i.id, platform: i.platform, title: i.title, hook: i.hook, insight: i.insight,
          tags: i.tags || [], duration: i.duration, competition: i.competition,
          viralScore: i.viral_score, color: i.color, scheduledDate: i.scheduled_date,
        })),
        scripts: (scripts || []).map((s: any) => ({
          id: s.id, ideaId: s.idea_id, title: s.title, platform: s.platform,
          hookText: s.hook_text, bodyText: s.body_text, ctaText: s.cta_text,
          deliveryTip: s.delivery_tip, createdAt: s.created_at,
        })),
        swipesToday,
        scriptsThisMonth: profile.scripts_this_month,
        streak: profile.streak,
        notificationsEnabled: profile.notifications_enabled,
        onboardingCompleted: profile.onboarding_completed,
      };

      setUser(userProfile);
      if (typeof window !== "undefined") window.__notificationsEnabled = userProfile.notificationsEnabled !== false;
      return userProfile;
    } catch (err) {
      console.error("[loadProfile] unexpected error:", err);
      return null;
    }
  }, []);

  const syncAuthenticatedUser = useCallback(async (session: Session | null | undefined) => {
    if (!session?.user) return;
    setIsLoading(true);
    setAuthUser(session.user);
    try {
      await loadProfile(session.user.id);
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    let cancelled = false;
    const failsafe = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 2500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoading(true);
        setAuthUser(session.user);
        setTimeout(() => {
          loadProfile(session.user.id)
            .catch(e => console.warn("[auth] loadProfile error:", e))
            .finally(() => setIsLoading(false));
        }, 0);
      } else {
        setAuthUser(null);
        setUser(null);
        if (typeof window !== "undefined") window.__notificationsEnabled = true;
        setIsLoading(false);
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (session?.user) {
          setIsLoading(true);
          setAuthUser(session.user);
          loadProfile(session.user.id)
            .catch(e => console.warn("[init] loadProfile error:", e))
            .finally(() => { if (!cancelled) setIsLoading(false); });
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn("[init] getSession failed:", err?.message || err);
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const startedAt = Date.now();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isPreviewAuthEnvironment()) {
        try {
          const proxyResult = await callAuthProxy("login", { email: normalizedEmail, password });
          if (proxyResult.session) {
            await applySession(proxyResult.session);
            await syncAuthenticatedUser(proxyResult.session);
          }
          return proxyResult;
        } catch (proxyError) {
          if (!isTransportFailure(proxyError)) throw proxyError;
        }
      }

      const { data, error } = await withRetry(() => supabase.auth.signInWithPassword({ email: normalizedEmail, password }));
      if (error) throw error;
      if (data.session) await syncAuthenticatedUser(data.session);
      return buildResult({
        ok: true,
        action: "login",
        email: normalizedEmail,
        message: "Login successful.",
        transport: "client",
        startedAt,
        sessionEstablished: !!data.session,
      });
    } catch (error) {
      const parsed = parseError(error, "Login failed.");
      return buildResult({
        ok: false,
        action: "login",
        email: normalizedEmail,
        message: parsed.message,
        transport: isPreviewAuthEnvironment() ? "proxy" : "client",
        startedAt,
        verificationRequired: /email not confirmed/i.test(parsed.message),
        errorCode: parsed.code,
        errorMessage: parsed.message,
      });
    }
  }, [applySession, buildResult, callAuthProxy, syncAuthenticatedUser]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const startedAt = Date.now();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isPreviewAuthEnvironment()) {
        try {
          const proxyResult = await callAuthProxy("signup", { email: normalizedEmail, password, name });
          if (proxyResult.session) {
            await applySession(proxyResult.session);
            await syncAuthenticatedUser(proxyResult.session);
          }
          return proxyResult;
        } catch (proxyError) {
          if (!isTransportFailure(proxyError)) throw proxyError;
        }
      }

      const { data, error } = await withRetry(() => supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
      }));
      if (error) throw error;
      return buildResult({
        ok: true,
        action: "signup",
        email: normalizedEmail,
        message: data.session ? "Account created and session started." : "Verification email requested successfully.",
        transport: "client",
        startedAt,
        emailRequested: !data.session,
        verificationRequired: !data.session,
        sessionEstablished: !!data.session,
      });
    } catch (error) {
      const parsed = parseError(error, "Signup failed.");
      return buildResult({
        ok: false,
        action: "signup",
        email: normalizedEmail,
        message: parsed.message,
        transport: isPreviewAuthEnvironment() ? "proxy" : "client",
        startedAt,
        errorCode: parsed.code,
        errorMessage: parsed.message,
      });
    }
  }, [applySession, buildResult, callAuthProxy, syncAuthenticatedUser]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const startedAt = Date.now();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isPreviewAuthEnvironment()) {
        return await callAuthProxy("forgot_password", { email: normalizedEmail });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return buildResult({
        ok: true,
        action: "forgot-password",
        email: normalizedEmail,
        message: "Password reset email requested successfully.",
        transport: "client",
        startedAt,
        emailRequested: true,
      });
    } catch (error) {
      const parsed = parseError(error, "Failed to send reset email.");
      return buildResult({
        ok: false,
        action: "forgot-password",
        email: normalizedEmail,
        message: parsed.message,
        transport: isPreviewAuthEnvironment() ? "proxy" : "client",
        startedAt,
        errorCode: parsed.code,
        errorMessage: parsed.message,
      });
    }
  }, [buildResult, callAuthProxy]);

  const resendVerification = useCallback(async (email: string) => {
    const startedAt = Date.now();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isPreviewAuthEnvironment()) {
        return await callAuthProxy("resend_verification", { email: normalizedEmail });
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      return buildResult({
        ok: true,
        action: "resend-verification",
        email: normalizedEmail,
        message: "Verification email requested successfully.",
        transport: "client",
        startedAt,
        emailRequested: true,
        verificationRequired: true,
      });
    } catch (error) {
      const parsed = parseError(error, "Failed to resend verification email.");
      return buildResult({
        ok: false,
        action: "resend-verification",
        email: normalizedEmail,
        message: parsed.message,
        transport: isPreviewAuthEnvironment() ? "proxy" : "client",
        startedAt,
        errorCode: parsed.code,
        errorMessage: parsed.message,
      });
    }
  }, [buildResult, callAuthProxy]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const completeOnboarding = useCallback(async (niches: string[], platforms: string[], frequency: string) => {
    if (!authUser) return;
    await supabase.from("profiles").update({ niches, platforms, posting_frequency: frequency, onboarding_completed: true }).eq("user_id", authUser.id);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const saveIdea = useCallback(async (idea: ContentIdea) => {
    if (!authUser) return;
    const { error } = await supabase.from("saved_ideas").insert({
      user_id: authUser.id, platform: idea.platform, title: idea.title, hook: idea.hook,
      insight: idea.insight, tags: idea.tags, duration: idea.duration, competition: idea.competition,
      viral_score: idea.viralScore, color: idea.color,
    });
    if (error) { toast.error("Failed to save idea"); return; }
    await loadProfile(authUser.id);
    toast.success("Idea saved!");
  }, [authUser, loadProfile]);

  const deleteIdea = useCallback(async (ideaId: string) => {
    if (!authUser) return;
    await supabase.from("saved_ideas").delete().eq("id", ideaId);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const deleteScript = useCallback(async (scriptId: string) => {
    if (!authUser) return;
    await supabase.from("scripts").delete().eq("id", scriptId);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const scheduleIdea = useCallback(async (ideaId: string, date: string) => {
    if (!authUser) return;
    await supabase.from("saved_ideas").update({ scheduled_date: date }).eq("id", ideaId);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const upgradePlan = useCallback(async (planName: "FREE" | "CREATOR" | "PRO") => {
    if (!authUser) return;
    await supabase.from("profiles").update({ plan: planName }).eq("user_id", authUser.id);
    await loadProfile(authUser.id);
    toast.success(`${planName} plan activated!`);
  }, [authUser, loadProfile]);

  const updateNiches = useCallback(async (niches: string[]) => {
    if (!authUser) return;
    await supabase.from("profiles").update({ niches }).eq("user_id", authUser.id);
    await loadProfile(authUser.id);
    toast.success("Niches updated!");
  }, [authUser, loadProfile]);

  const updatePostingFrequency = useCallback(async (freq: string) => {
    if (!authUser) return;
    await supabase.from("profiles").update({ posting_frequency: freq }).eq("user_id", authUser.id);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const updateNotifications = useCallback(async (enabled: boolean) => {
    if (!authUser) return;
    if (typeof window !== "undefined") window.__notificationsEnabled = enabled;
    await supabase.from("profiles").update({ notifications_enabled: enabled }).eq("user_id", authUser.id);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const updatePlatforms = useCallback(async (platforms: string[]) => {
    if (!authUser) return;
    await supabase.from("profiles").update({ platforms }).eq("user_id", authUser.id);
    await loadProfile(authUser.id);
    toast.success("Platforms updated!");
  }, [authUser, loadProfile]);

  const incrementSwipe = useCallback((): boolean => {
    if (!user || !authUser) return false;
    if (user.plan.swipesPerDay !== Infinity && user.swipesToday >= user.plan.swipesPerDay) return false;
    const newCount = user.swipesToday + 1;
    setUser(prev => prev ? { ...prev, swipesToday: newCount } : null);
    supabase.from("profiles").update({ swipes_today: newCount, last_swipe_date: new Date().toISOString().split("T")[0] }).eq("user_id", authUser.id).then();
    return true;
  }, [user, authUser]);

  const canSwipe = useCallback(() => {
    if (!user) return false;
    return user.plan.swipesPerDay === Infinity || user.swipesToday < user.plan.swipesPerDay;
  }, [user]);

  const canGenerateScript = useCallback(() => {
    if (!user) return false;
    return user.plan.scriptsPerMonth === Infinity || user.scriptsThisMonth < user.plan.scriptsPerMonth;
  }, [user]);

  const refreshData = useCallback(async () => {
    if (authUser) await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  return (
    <AppContext.Provider value={{
      user, authUser, isAuthenticated: !!authUser, hasCompletedOnboarding: user?.onboardingCompleted || false,
      isLoading, login, signup, requestPasswordReset, resendVerification, logout, completeOnboarding,
      saveIdea, deleteIdea, deleteScript, scheduleIdea, upgradePlan, updateNiches,
      updatePostingFrequency, updateNotifications, updatePlatforms, incrementSwipe,
      canSwipe, canGenerateScript, refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};
