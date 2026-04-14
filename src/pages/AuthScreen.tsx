import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, isLoading: authLoading, login, signup } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(hasCompletedOnboarding ? "/swipe" : "/onboarding/niche", { replace: true });
    }
  }, [isAuthenticated, hasCompletedOnboarding, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        return;
      }
      if (result.redirected) return;
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

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

  const updateField = (field: "name" | "email" | "password", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-condensed text-5xl tracking-tight">DECKR</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your AI-powered content idea engine</p>

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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Continue with Email" : "Create Account with Email"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-5 space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {loading ? "Please wait..." : "Continue with Google"}
          </button>
        </div>

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
