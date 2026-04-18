import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupaUser } from "@supabase/supabase-js";

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
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
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

  // Keep ref in sync with state
  useEffect(() => { userRef.current = user; }, [user]);

  const loadProfile = useCallback(async (uid: string) => {
    let { data: profile } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
    if (!profile) {
      // Auto-create profile if missing
      const { data: { user: authData } } = await supabase.auth.getUser();
      const email = authData?.email || "";
      const name = authData?.user_metadata?.display_name || email.split("@")[0] || "";
      const { data: newProfile } = await supabase.from("profiles").insert({
        user_id: uid, display_name: name, email,
      }).select().single();
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
    // Preserve local swipe count if it's higher (DB update may be in-flight)
    const localSwipes = userRef.current?.swipesToday || 0;
    if (localSwipes > swipesToday && profile.last_swipe_date === today) {
      swipesToday = localSwipes;
    }

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
    return userProfile;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoading(true);
        setAuthUser(session.user);
        setTimeout(() => loadProfile(session.user.id).finally(() => setIsLoading(false)), 0);
      } else {
        setAuthUser(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoading(true);
        setAuthUser(session.user);
        loadProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const completeOnboarding = useCallback(async (niches: string[], platforms: string[], frequency: string) => {
    if (!authUser) return;
    await supabase.from("profiles").update({
      niches, platforms, posting_frequency: frequency, onboarding_completed: true,
    }).eq("user_id", authUser.id);
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
      isLoading, login, signup, logout, completeOnboarding, saveIdea, deleteIdea, deleteScript,
      scheduleIdea, upgradePlan, updateNiches, updatePostingFrequency, updateNotifications, updatePlatforms,
      incrementSwipe, canSwipe, canGenerateScript, refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};
