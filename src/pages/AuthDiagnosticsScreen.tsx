import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleUserRound, LogOut, Mail, ShieldCheck } from "lucide-react";
import AuthStatusPanel from "@/components/auth/AuthStatusPanel";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { getAuthEnvironmentLabel, isPreviewAuthEnvironment } from "@/lib/authEnv";
import type { AuthAction, AuthActionResult, AuthLogEntry } from "@/lib/authTypes";

const createLogEntry = (result: AuthActionResult): AuthLogEntry => ({
  id: `${result.action}-${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
  ...result,
});

const AuthDiagnosticsScreen: React.FC = () => {
  const { authUser, user, login, signup, requestPasswordReset, resendVerification, logout } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [entries, setEntries] = useState<AuthLogEntry[]>([]);
  const [loadingAction, setLoadingAction] = useState<AuthAction | null>(null);
  const retryRef = useRef<null | (() => Promise<void>)>(null);

  const appendResult = (result: AuthActionResult) => {
    setEntries((prev) => [createLogEntry(result), ...prev].slice(0, 10));
  };

  const runAction = async (action: AuthAction) => {
    const email = form.email.trim();
    const password = form.password;
    const name = form.name.trim();

    setLoadingAction(action);
    try {
      let result: AuthActionResult;

      if (action === "signup") {
        result = await signup(name, email, password);
        retryRef.current = () => runAction("signup");
      } else if (action === "login") {
        result = await login(email, password);
        retryRef.current = () => runAction("login");
      } else if (action === "forgot-password") {
        result = await requestPasswordReset(email);
        retryRef.current = () => runAction("forgot-password");
      } else {
        result = await resendVerification(email);
        retryRef.current = () => runAction("resend-verification");
      }

      appendResult(result);
    } finally {
      setLoadingAction(null);
    }
  };

  const sessionSummary = useMemo(() => {
    if (!authUser) return "Guest session";
    return `${authUser.email ?? "Authenticated user"}${user?.plan?.name ? ` · ${user.plan.name}` : ""}`;
  }, [authUser, user]);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {getAuthEnvironmentLabel()}
          </span>
        </div>

        <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-card-soft">
          <h1 className="font-condensed text-4xl tracking-tight text-foreground">AUTH CHECK</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create account, login, resend verification, and reset password end-to-end from one place.
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <CircleUserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{sessionSummary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isPreviewAuthEnvironment()
                    ? "Preview uses backend relay mode so auth requests can bypass preview fetch failures."
                    : "Published app uses direct authentication requests."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              autoComplete="name"
              className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
              autoComplete="email"
              className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button type="button" onClick={() => runAction("signup")} disabled={!!loadingAction}>
              <ShieldCheck className="h-4 w-4" />
              {loadingAction === "signup" ? "Creating..." : "Create account"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => runAction("login")} disabled={!!loadingAction}>
              {loadingAction === "login" ? "Logging in..." : "Login"}
            </Button>
            <Button type="button" variant="outline" onClick={() => runAction("forgot-password")} disabled={!!loadingAction}>
              <Mail className="h-4 w-4" />
              {loadingAction === "forgot-password" ? "Sending..." : "Forgot password"}
            </Button>
            <Button type="button" variant="outline" onClick={() => runAction("resend-verification")} disabled={!!loadingAction}>
              {loadingAction === "resend-verification" ? "Resending..." : "Resend verify"}
            </Button>
          </div>

          <div className="mt-3 flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setEntries([])} disabled={entries.length === 0}>
              Clear logs
            </Button>
            <Button type="button" variant="ghost" onClick={() => logout()} disabled={!authUser}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </section>

        <AuthStatusPanel
          title="Auth diagnostics log"
          entries={entries}
          emptyLabel="Run an auth action to inspect the final result here."
          onRetry={retryRef.current ? () => retryRef.current?.() ?? Promise.resolve() : undefined}
          onClear={() => setEntries([])}
          isRetrying={!!loadingAction}
        />
      </div>
    </div>
  );
};

export default AuthDiagnosticsScreen;
