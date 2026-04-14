import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, isLoading: authLoading } = useApp();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(hasCompletedOnboarding ? "/swipe" : "/onboarding/niche", { replace: true });
    }
  }, [isAuthenticated, hasCompletedOnboarding, authLoading, navigate]);

  const { login, signup } = useApp();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (mode === "signup" && !name) {
      toast.error("Enter your name");
      return;
    }
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Logged in successfully");
      } else {
        await signup(name, email, password);
        toast.success("Account created. Check your email to verify your account.");
        setMode("login");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : mode === "login" ? "Login failed" : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const email = form.email.trim();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Password reset link sent! Check your email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: "name" | "email" | "password", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-condensed text-5xl tracking-tight">DECKR</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your AI-powered content idea engine</p>

        {mode !== "forgot" ? (
          <>
            <div className="mt-8 flex rounded-2xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${mode === "login" ? "bg-background text-foreground shadow-card-soft" : "text-muted-foreground"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${mode === "signup" ? "bg-background text-foreground shadow-card-soft" : "text-muted-foreground"}`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="mt-5 space-y-3 text-left">
              {mode === "signup" && (
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
                />
              )}
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
              />
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setResetSent(false); }}
                  className="text-xs text-muted-foreground underline"
                >
                  Forgot password?
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Please wait..." : mode === "login" ? "Continue with Email" : "Create Account"}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-8">
            {resetSent ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-muted p-6">
                  <p className="text-sm font-semibold">Check your email</p>
                  <p className="mt-2 text-xs text-muted-foreground">We've sent a password reset link to <strong>{form.email}</strong></p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3 text-left">
                <p className="text-center text-sm text-muted-foreground">Enter your email and we'll send you a reset link</p>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-center text-xs text-muted-foreground underline"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline text-foreground">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="underline text-foreground">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
