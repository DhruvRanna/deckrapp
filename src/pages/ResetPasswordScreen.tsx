import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if we have a recovery session
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
      }
    });
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-save-light">
            <CheckCircle className="h-10 w-10 text-save" />
          </div>
          <h2 className="mt-6 font-condensed text-2xl">PASSWORD UPDATED</h2>
          <p className="mt-3 text-sm text-muted-foreground">Your password has been reset successfully.</p>
          <button onClick={() => navigate("/swipe")} className="mt-6 w-full rounded-xl bg-foreground py-4 text-sm font-semibold text-background">
            Continue to App →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <h2 className="font-condensed text-3xl">SET NEW PASSWORD</h2>
        <p className="mt-2 text-sm text-muted-foreground">Enter your new password below.</p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3.5">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="New password (min 6 chars)" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}</button>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3.5">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Confirm new password" type={showPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReset()} />
          </div>
        </div>

        <button onClick={handleReset} disabled={loading || password.length < 6 || password !== confirmPassword} className={`mt-6 w-full rounded-xl py-4 text-sm font-semibold transition-all ${password.length >= 6 && password === confirmPassword ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
          {loading ? "Updating..." : "Update Password →"}
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
