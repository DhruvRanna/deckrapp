import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action = "signup" | "login" | "forgot_password" | "resend_verification";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getMessage = (error: { message?: string } | null | undefined, fallback: string) => error?.message || fallback;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_PUBLISHABLE_KEY =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return json({ ok: false, message: "Auth relay is not configured." }, 500);
    }

    const { action, email, password, name, redirectTo } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const safeRedirectTo =
      typeof redirectTo === "string" && redirectTo.length > 0
        ? redirectTo
        : `${req.headers.get("origin") || "https://deckrapp.lovable.app"}/auth`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const startedAt = Date.now();

    const success = (payload: Record<string, unknown>) =>
      json({ ok: true, transport: "proxy", durationMs: Date.now() - startedAt, ...payload });

    const failure = (currentAction: Action, message: string, extra: Record<string, unknown> = {}) =>
      json({
        ok: false,
        transport: "proxy",
        action: currentAction,
        email: normalizedEmail,
        message,
        durationMs: Date.now() - startedAt,
        ...extra,
      });

    switch (action as Action) {
      case "signup": {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: String(password || ""),
          options: {
            data: { display_name: String(name || "").trim() },
            emailRedirectTo: safeRedirectTo,
          },
        });

        if (error) {
          return failure("signup", getMessage(error, "Could not create account."), {
            errorCode: error.name,
            errorMessage: error.message,
          });
        }

        return success({
          action: "signup",
          email: normalizedEmail,
          message: data.session
            ? "Account created and session started."
            : "Verification email requested successfully.",
          verificationRequired: !data.session,
          emailRequested: !data.session,
          sessionEstablished: !!data.session,
          session: data.session,
        });
      }

      case "login": {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: String(password || ""),
        });

        if (error) {
          const raw = getMessage(error, "Login failed.");
          return failure("login", raw, {
            errorCode: error.name,
            errorMessage: raw,
            verificationRequired: /email not confirmed/i.test(raw),
          });
        }

        return success({
          action: "login",
          email: normalizedEmail,
          message: "Login successful.",
          sessionEstablished: !!data.session,
          session: data.session,
        });
      }

      case "forgot_password": {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: safeRedirectTo,
        });

        if (error) {
          return failure("forgot_password", getMessage(error, "Could not send reset email."), {
            errorCode: error.name,
            errorMessage: error.message,
          });
        }

        return success({
          action: "forgot_password",
          email: normalizedEmail,
          message: "Password reset email requested successfully.",
          emailRequested: true,
        });
      }

      case "resend_verification": {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
          options: {
            emailRedirectTo: safeRedirectTo,
          },
        });

        if (error) {
          return failure("resend_verification", getMessage(error, "Could not resend verification email."), {
            errorCode: error.name,
            errorMessage: error.message,
          });
        }

        return success({
          action: "resend_verification",
          email: normalizedEmail,
          message: "Verification email requested successfully.",
          emailRequested: true,
          verificationRequired: true,
        });
      }

      default:
        return json({ ok: false, message: "Unsupported auth action." }, 400);
    }
  } catch (error) {
    console.error("auth-proxy error", error);
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected auth relay error.",
      },
      500,
    );
  }
});
