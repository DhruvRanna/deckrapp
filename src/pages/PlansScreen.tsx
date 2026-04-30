import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, Lock, Smartphone } from "lucide-react";
import { useApp, PLANS } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  isNative,
  initRevenueCat,
  getOfferingPackages,
  purchasePackage,
  restorePurchases,
  type RCPackageInfo,
} from "@/lib/revenuecat";

const PlansScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, authUser, refreshData } = useApp();
  const currentPlan = user?.plan.name || "FREE";
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [packages, setPackages] = useState<RCPackageInfo[]>([]);
  const [pkgError, setPkgError] = useState<string | null>(null);

  const native = isNative();

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    (async () => {
      try {
        await initRevenueCat(authUser?.id);
        const pkgs = await getOfferingPackages();
        if (!cancelled) setPackages(pkgs);
      } catch (e: any) {
        if (!cancelled) setPkgError(e?.message || "Failed to load offerings");
      }
    })();
    return () => { cancelled = true; };
  }, [native, authUser?.id]);

  const findPackage = (plan: "CREATOR" | "PRO", period: "monthly" | "yearly") =>
    packages.find(p => p.plan === plan && p.period === period);

  const creatorMonthly = findPackage("CREATOR", "monthly");
  const creatorYearly = findPackage("CREATOR", "yearly");
  const proMonthly = findPackage("PRO", "monthly");
  const proYearly = findPackage("PRO", "yearly");

  const creatorPriceLabel = isYearly
    ? creatorYearly?.priceString || "$3.99/yr"
    : creatorMonthly?.priceString || "$5/mo";
  const proPriceLabel = isYearly
    ? proYearly?.priceString || "$14.99/yr"
    : proMonthly?.priceString || "$19/mo";

  const handleUpgrade = async (plan: "CREATOR" | "PRO") => {
    if (!authUser || !user) return;

    if (!native) {
      toast.error("In-app purchases are only available on the Android app.");
      return;
    }

    const pkg = isYearly ? findPackage(plan, "yearly") : findPackage(plan, "monthly");
    if (!pkg) {
      toast.error("This plan is not available right now. Please try again later.");
      return;
    }

    setIsLoading(plan);
    try {
      const result = await purchasePackage(pkg.raw);
      if (result.cancelled) {
        toast("Purchase cancelled");
        return;
      }
      if (!result.success || !result.plan || result.plan === "FREE") {
        toast.error(result.error || "Purchase did not complete.");
        return;
      }

      // Sync entitlement to Supabase profile.plan
      const { error } = await supabase
        .from("profiles")
        .update({ plan: result.plan })
        .eq("user_id", authUser.id);
      if (error) {
        console.warn("[plans] failed to update profile plan:", error);
      }
      await refreshData();
      toast.success(`${result.plan} plan activated!`);
    } catch (e: any) {
      toast.error(e?.message || "Purchase failed");
    } finally {
      setIsLoading(null);
    }
  };

  const handleRestore = async () => {
    if (!native || !authUser) return;
    setIsLoading("restore");
    try {
      const result = await restorePurchases();
      if (!result.success) {
        toast.error(result.error || "Nothing to restore");
        return;
      }
      const plan = result.plan || "FREE";
      await supabase.from("profiles").update({ plan }).eq("user_id", authUser.id);
      await refreshData();
      if (plan === "FREE") toast("No active subscription found");
      else toast.success(`${plan} plan restored!`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="flex items-center gap-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-condensed text-2xl">PLANS</h1>
      </div>
      <p className="mt-1 px-4 text-sm text-muted-foreground">Choose your plan</p>

      {!native && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
          <Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>In-app purchases are only available on the Android app. Install DECKR from Google Play to subscribe.</span>
        </div>
      )}

      {native && pkgError && (
        <div className="mx-4 mt-3 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pkgError}
        </div>
      )}

      {/* Monthly/Yearly Toggle */}
      <div className="mx-4 mt-4 flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={`relative h-8 w-14 rounded-full transition-all ${isYearly ? "bg-save" : "bg-muted-foreground/30"}`}
        >
          <div className={`absolute top-1 h-6 w-6 rounded-full bg-background shadow-md transition-transform ${isYearly ? "translate-x-7" : "translate-x-1"}`} />
        </button>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-semibold ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>Yearly</span>
          {isYearly && <span className="rounded-full bg-save/10 px-2 py-0.5 text-[10px] font-semibold text-save">Save 20%</span>}
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {/* FREE */}
        <div className={`rounded-2xl border-2 p-5 ${currentPlan === "FREE" ? "border-save" : "border-border"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-condensed text-xl">FREE</h3>
            {currentPlan === "FREE" && <span className="flex items-center gap-1 text-xs font-semibold text-save"><Check className="h-4 w-4" /> Current</span>}
          </div>
          <p className="mt-2"><span className="text-4xl font-black">$0</span> <span className="text-sm text-muted-foreground">/forever</span></p>
          <ul className="mt-4 space-y-2">
            {PLANS.FREE.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-save" /> {f}</li>
            ))}
          </ul>
        </div>

        {/* CREATOR */}
        <div className="rounded-2xl bg-foreground p-5 text-background">
          <span className="rounded-full bg-background px-3 py-0.5 text-[10px] font-semibold text-foreground">MOST POPULAR</span>
          <h3 className="mt-3 font-condensed text-xl">CREATOR</h3>
          <p className="mt-2"><span className="text-4xl font-black">{creatorPriceLabel}</span> <span className="text-sm text-background/60">{isYearly ? "billed yearly" : "per month"}</span></p>
          <ul className="mt-4 space-y-2">
            {PLANS.CREATOR.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /> {f}</li>
            ))}
          </ul>
          {currentPlan !== "CREATOR" && (
            <button
              onClick={() => handleUpgrade("CREATOR")}
              disabled={!!isLoading || !native}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-background py-3.5 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              {isLoading === "CREATOR" ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              ) : (
                <><CreditCard className="h-4 w-4" /> Get Creator — {creatorPriceLabel}</>
              )}
            </button>
          )}
          {currentPlan === "CREATOR" && <p className="mt-4 text-center text-sm font-semibold text-save">✓ Current Plan</p>}
        </div>

        {/* PRO */}
        <div className="rounded-2xl bg-muted p-5">
          <h3 className="font-condensed text-xl">PRO</h3>
          <p className="mt-2"><span className="text-4xl font-black">{proPriceLabel}</span> <span className="text-sm text-muted-foreground">{isYearly ? "billed yearly" : "per month"}</span></p>
          <ul className="mt-4 space-y-2">
            {PLANS.PRO.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-save" /> {f}</li>
            ))}
          </ul>
          {currentPlan !== "PRO" && (
            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={!!isLoading || !native}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-50"
            >
              {isLoading === "PRO" ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : (
                <><CreditCard className="h-4 w-4" /> Get Pro — {proPriceLabel}</>
              )}
            </button>
          )}
          {currentPlan === "PRO" && <p className="mt-4 text-center text-sm font-semibold text-save">✓ Current Plan</p>}
        </div>

        {native && (
          <button
            onClick={handleRestore}
            disabled={!!isLoading}
            className="mt-2 w-full rounded-xl border border-border py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {isLoading === "restore" ? "Restoring..." : "Restore purchases"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Subscriptions are billed by Google Play · Cancel anytime
      </div>
    </div>
  );
};

export default PlansScreen;
