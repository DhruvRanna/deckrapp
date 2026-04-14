import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

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
        <img src="/icon-512.png" alt="DECKR" className="w-28 h-28" />
      </div>
    </div>
  );
};

export default SplashScreen;