import { AlertCircle, CheckCircle2, Clock3, Mail, RefreshCcw, ShieldCheck, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthLogEntry } from "@/lib/authTypes";

interface AuthStatusPanelProps {
  entries: AuthLogEntry[];
  title?: string;
  emptyLabel?: string;
  onRetry?: () => void;
  onClear?: () => void;
  isRetrying?: boolean;
}

const actionLabel: Record<AuthLogEntry["action"], string> = {
  signup: "Create account",
  login: "Login",
  "forgot-password": "Forgot password",
  "resend-verification": "Resend verification",
};

const detailIcon = (entry: AuthLogEntry) => {
  if (entry.ok) return <CheckCircle2 className="h-4 w-4 text-save" />;
  if (entry.errorMessage?.toLowerCase().includes("fetch") || entry.errorMessage?.toLowerCase().includes("network")) {
    return <WifiOff className="h-4 w-4 text-destructive" />;
  }
  return <AlertCircle className="h-4 w-4 text-destructive" />;
};

export default function AuthStatusPanel({
  entries,
  title = "Auth status",
  emptyLabel = "No auth activity yet.",
  onRetry,
  onClear,
  isRetrying = false,
}: AuthStatusPanelProps) {
  const latest = entries[0];

  return (
    <section className="rounded-3xl border border-border bg-card/80 p-4 shadow-card-soft backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {latest
              ? `${latest.ok ? "Latest result" : "Latest failure"}: ${latest.message}`
              : emptyLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onRetry && latest ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
              <RefreshCcw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
              Retry
            </Button>
          ) : null}
          {onClear && entries.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-5 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.id}
              className={cn(
                "rounded-2xl border px-4 py-3",
                entry.ok ? "border-save/30 bg-save-light/60" : "border-destructive/20 bg-background"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{detailIcon(entry)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-semibold text-foreground">{actionLabel[entry.action]}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {entry.transport === "proxy" ? "Backend relay" : "Direct"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {entry.durationMs}ms
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-foreground">{entry.message}</p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{entry.email}</span>
                    {entry.emailRequested ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        Email requested
                      </span>
                    ) : null}
                    {entry.verificationRequired ? <span>Verification required</span> : null}
                    {entry.sessionEstablished ? <span>Session ready</span> : null}
                  </div>

                  {entry.errorMessage ? (
                    <p className="mt-2 break-words text-xs text-muted-foreground">{entry.errorMessage}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
