import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import deckrLogo from "@/assets/deckr-logo.png";

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && hasCompletedOnboarding) {
      navigate("/swipe", { replace: true });
    } else if (isAuthenticated) {
      navigate("/onboarding/niche", { replace: true });
    } else {
      navigate("/welcome", { replace: true });
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <img src={deckrLogo} alt="DECKR" className="w-24 h-24" />
        <div className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    </div>
  );
};

export default SplashScreen;
