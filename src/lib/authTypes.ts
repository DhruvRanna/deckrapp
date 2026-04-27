export type AuthAction = "signup" | "login" | "forgot-password" | "resend-verification";
export type AuthTransport = "client" | "proxy";

export interface AuthActionResult {
  ok: boolean;
  action: AuthAction;
  email: string;
  message: string;
  transport: AuthTransport;
  durationMs: number;
  timestamp: string;
  emailRequested?: boolean;
  verificationRequired?: boolean;
  sessionEstablished?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface AuthLogEntry extends AuthActionResult {
  id: string;
}
