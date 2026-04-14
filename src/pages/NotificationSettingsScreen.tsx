import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

const NotificationSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateNotifications } = useApp();
  const [on, setOn] = useState(user?.notificationsEnabled ?? true);

  const handleSave = async () => {
    await updateNotifications(on);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-condensed text-xl">NOTIFICATIONS</h1>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between rounded-2xl bg-muted px-5 py-4">
          <span className="font-semibold">Push Notifications</span>
          <button onClick={() => setOn(!on)} className={`h-7 w-12 rounded-full transition-all ${on ? "bg-save" : "bg-muted-foreground/30"}`}>
            <div className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Get notified about new content ideas and streak reminders.</p>
      </div>

      <div className="px-4 mt-6">
        <button onClick={handleSave} className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
          Save
        </button>
      </div>
    </div>
  );
};

export default NotificationSettingsScreen;
