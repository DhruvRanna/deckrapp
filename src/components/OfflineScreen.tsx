import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

const OfflineScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOnline(true);
      }
      setChecking(false);
    }, 1500);
  };

  if (isOnline) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <h1 className="text-2xl font-condensed tracking-tight text-foreground/40">DECKR</h1>
      <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-bold">No Internet Connection</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Please check your connection and try again.
      </p>
      <button
        onClick={handleRetry}
        disabled={checking}
        className="mt-6 flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {checking ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Checking...
          </>
        ) : (
          "Retry"
        )}
      </button>
    </div>
  );
};

export default OfflineScreen;
