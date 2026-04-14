import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { ChevronRight, Bell, Calendar, Tag, CreditCard, HelpCircle, Info, Mail, FileText, Shield, LogOut, Lock, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const NICHES = ["Finance", "Fitness", "Tech", "Fashion", "Food", "Travel", "Motivation", "Gaming", "Beauty", "Business", "Parenting", "Education", "Comedy", "Lifestyle", "Crypto", "Health"];
const FREQUENCIES = [
  { label: "Daily", sub: "7 days/week" },
  { label: "3-4x per week", sub: "Most creators" },
  { label: "1-2x per week", sub: "Consistent pace" },
  { label: "Just starting", sub: "Building a habit" },
];

const ProfileScreen: React.FC = () => {
  const { user, logout, updateNiches, updatePostingFrequency, updateNotifications } = useApp();
  const navigate = useNavigate();
  const [showNicheModal, setShowNicheModal] = useState(false);
  const [showFreqModal, setShowFreqModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const stats = [
    { val: user.savedIdeas.length, label: "Saved" },
    { val: user.scripts.length, label: "Scripts" },
    { val: user.streak, label: "Streak 🔥" },
    { val: user.plan.swipesPerDay === Infinity ? "∞" : Math.max(0, user.plan.swipesPerDay - user.swipesToday), label: "Swipes" },
  ];

  const planBadge = user.plan.name === "CREATOR" ? "bg-save text-background" : user.plan.name === "PRO" ? "bg-script text-background" : "bg-muted text-muted-foreground";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="flex flex-col items-center px-4 pt-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground bg-muted text-2xl font-bold">
            {user.name[0]?.toUpperCase()}
          </div>
          <h2 className="mt-3 text-lg font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className={`mt-1 rounded-full px-3 py-0.5 text-[10px] font-semibold ${planBadge}`}>{user.plan.name}</span>
        </div>

        {user.plan.name === "FREE" && (
          <button onClick={() => navigate("/plans")} className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-foreground p-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-background">Unlock Full Access</p>
              <p className="text-xs text-background/60">Creator Plan from $5/mo</p>
            </div>
            <span className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold shrink-0">Upgrade →</span>
          </button>
        )}

        <div className="mx-4 mt-4 flex items-center justify-around rounded-2xl bg-muted p-4">
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className="h-8 w-px bg-border" />}
              <div className="text-center">
                <p className="text-lg font-bold">{s.val}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="mx-4 mt-4 rounded-2xl border border-border bg-background">
          <button onClick={() => navigate("/settings/niches")} className="flex w-full items-center gap-3 px-4 py-3.5">
            <Tag className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium">My Niches</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.niches.join(", ") || "None"}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          <button onClick={() => navigate("/settings/schedule")} className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium">Posting Schedule</p>
              <p className="text-[10px] text-muted-foreground">{user.postingFrequency || "Not set"}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          <button onClick={() => navigate("/settings/notifications")} className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5">
            <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-[10px] text-muted-foreground">{user.notificationsEnabled ? "On" : "Off"}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {[
            { icon: CreditCard, title: "Manage Subscription", sub: `${user.plan.name} Plan`, path: "/plans" },
            { icon: HelpCircle, title: "Help & FAQ", sub: "Get answers fast", path: "/help" },
            { icon: Info, title: "About DECKR", sub: "Version 1.0", path: "/about" },
            { icon: Mail, title: "Contact Us", sub: "Support & feedback", path: "/contact" },
            { icon: FileText, title: "Terms & Conditions", sub: "", path: "/terms" },
            { icon: Shield, title: "Privacy Policy", sub: "", path: "/privacy" },
          ].map((item) => (
            <button key={item.title} onClick={() => navigate(item.path)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5">
              <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}

          <button onClick={() => setShowLogoutConfirm(true)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5">
            <LogOut className="h-5 w-5 text-skip shrink-0" />
            <p className="text-sm font-medium text-skip">Sign Out</p>
          </button>
        </div>

        <p className="mt-4 pb-4 text-center text-[10px] text-muted-foreground">DECKR v1.0 · Made for Creators</p>
      </div>

      {/* Sign Out Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setShowLogoutConfirm(false)}>
          <div className="mx-6 w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">Sign Out?</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center">Are you sure you want to sign out?</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 rounded-xl bg-skip py-3 text-sm font-semibold text-background">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ProfileScreen;
