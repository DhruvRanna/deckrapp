import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import deckrLogo from "@/assets/deckr-logo.png";

const OfflineScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (isOnline) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={deckrLogo} alt="DECKR" width={80} height={80} className="opacity-40" />
      <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-bold">No Internet Connection</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Please check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background"
      >
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
};

export default OfflineScreen;
