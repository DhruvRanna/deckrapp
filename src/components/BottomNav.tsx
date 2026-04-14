import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Layers, Calendar, FileText, User } from "lucide-react";

const tabs = [
  { path: "/swipe", label: "Swipe", icon: Layers },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/scripts", label: "Scripts", icon: FileText },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="shrink-0 z-50 border-t border-foreground/10 bg-foreground safe-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {tabs.map(t => {
          const active = location.pathname.startsWith(t.path);
          return (
            <NavLink key={t.path} to={t.path} className="flex flex-col items-center gap-0.5 px-4 py-1">
              <t.icon className={`h-5 w-5 ${active ? "text-background" : "text-background/40"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-background" : "text-background/40"}`}>{t.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
