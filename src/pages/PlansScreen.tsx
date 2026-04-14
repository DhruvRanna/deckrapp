import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, Lock } from "lucide-react";
import { useApp, PLANS } from "@/context/AppContext";

const PlansScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, upgradePlan } = useApp();
  const currentPlan = user?.plan.name || "FREE";
  const [isYearly, setIsYearly] = useState(false);

  const creatorPrice = isYearly ? 3.99 : 5;
  const proPrice = isYearly ? 14.99 : 19;
  const creatorLabel = isYearly ? `$${creatorPrice}/mo (billed yearly)` : `$${creatorPrice}/month`;
  const proLabel = isYearly ? `$${proPrice}/mo (billed yearly)` : `$${proPrice}/month`;

  const handleUpgrade = (plan: "FREE" | "CREATOR" | "PRO") => {
    upgradePlan(plan);
    navigate("/profile");
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
          <p className="mt-2"><span className="text-4xl font-black">${creatorPrice}</span> <span className="text-sm text-background/60">{isYearly ? "/mo billed yearly" : "/per month"}</span></p>
          <ul className="mt-4 space-y-2">
            {PLANS.CREATOR.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /> {f}</li>
            ))}
          </ul>
          {currentPlan !== "CREATOR" && (
            <button onClick={() => handleUpgrade("CREATOR")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-background py-3.5 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4" /> Get Creator — ${creatorPrice}/mo
            </button>
          )}
          {currentPlan === "CREATOR" && <p className="mt-4 text-center text-sm font-semibold text-save">✓ Current Plan</p>}
        </div>

        {/* PRO */}
        <div className="rounded-2xl bg-muted p-5">
          <h3 className="font-condensed text-xl">PRO</h3>
          <p className="mt-2"><span className="text-4xl font-black">${proPrice}</span> <span className="text-sm text-muted-foreground">{isYearly ? "/mo billed yearly" : "/per month"}</span></p>
          <ul className="mt-4 space-y-2">
            {PLANS.PRO.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-save" /> {f}</li>
            ))}
          </ul>
          {currentPlan !== "PRO" && (
            <button onClick={() => handleUpgrade("PRO")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background">
              <CreditCard className="h-4 w-4" /> Get Pro — ${proPrice}/mo
            </button>
          )}
          {currentPlan === "PRO" && <p className="mt-4 text-center text-sm font-semibold text-save">✓ Current Plan</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Payments secured · Cancel anytime
      </div>
    </div>
  );
};

export default PlansScreen;
