import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as rawToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Global notification gate — flipped by AppContext based on user.notificationsEnabled.
// Default OFF so new sessions don't show toasts until the user opts in.
declare global {
  interface Window {
    __notificationsEnabled?: boolean;
  }
}
if (typeof window !== "undefined" && window.__notificationsEnabled === undefined) {
  window.__notificationsEnabled = false;
}

const isOn = () =>
  typeof window === "undefined" ? true : window.__notificationsEnabled !== false;

// Patch sonner's toast object so every existing `import { toast } from "sonner"`
// call site is automatically gated — no refactor needed across the codebase.
const patched = new Set<string>();
const gate = (fn: any) => (...args: any[]) => (isOn() ? fn(...args) : undefined);
const patchToast = () => {
  if (patched.has("root")) return;
  const t = rawToast as any;
  ["success", "error", "info", "warning", "message", "loading", "custom"].forEach((k) => {
    if (typeof t[k] === "function") {
      const orig = t[k].bind(t);
      t[k] = (...args: any[]) => (isOn() ? orig(...args) : undefined);
    }
  });
  patched.add("root");
};
patchToast();

// Callable form: toast("...") — wrap by exporting a gated function that
// preserves the patched method properties above.
const toast: typeof rawToast = ((...args: Parameters<typeof rawToast>) =>
  isOn() ? (rawToast as any)(...args) : undefined) as any;
Object.assign(toast, rawToast);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
