import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import OfflineScreen from "@/components/OfflineScreen";
import SplashScreen from "@/pages/SplashScreen";
import WelcomeScreen from "@/pages/WelcomeScreen";
import TutorialScreen from "@/pages/TutorialScreen";
import { ScriptsIntroScreen, CalendarIntroScreen } from "@/pages/IntroScreens";
import AuthScreen from "@/pages/AuthScreen";
import AuthDiagnosticsScreen from "@/pages/AuthDiagnosticsScreen";
import ResetPasswordScreen from "@/pages/ResetPasswordScreen";
import OnboardingScreen from "@/pages/OnboardingScreen";
import SwipeScreen from "@/pages/SwipeScreen";
import CalendarScreen from "@/pages/CalendarScreen";
import ScriptsScreen from "@/pages/ScriptsScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import PlansScreen from "@/pages/PlansScreen";
import NicheSettingsScreen from "@/pages/NicheSettingsScreen";
import ScheduleSettingsScreen from "@/pages/ScheduleSettingsScreen";
import NotificationSettingsScreen from "@/pages/NotificationSettingsScreen";
import PlatformSettingsScreen from "@/pages/PlatformSettingsScreen";
import { PrivacyPolicy, TermsConditions, AboutScreen, ContactScreen, HelpScreen } from "@/pages/SettingsPages";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useApp();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!backdrop-blur-xl !bg-white/70 !border !border-white/30 !shadow-[0_8px_32px_rgba(0,0,0,0.08)] !rounded-2xl !text-black",
          style: {
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
            color: "#000000",
          },
        }}
      />
      <AppProvider>
        <OfflineScreen>
        <BrowserRouter>
          <div className="mx-auto max-w-md min-h-screen">
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route path="/onboarding/scripts-intro" element={<ScriptsIntroScreen />} />
              <Route path="/onboarding/calendar-intro" element={<CalendarIntroScreen />} />
              <Route path="/tutorial" element={<TutorialScreen />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/auth/diagnostics" element={<AuthDiagnosticsScreen />} />
              <Route path="/reset-password" element={<ResetPasswordScreen />} />
              <Route path="/onboarding/niche" element={<OnboardingScreen step="niche" />} />
              <Route path="/onboarding/platform" element={<OnboardingScreen step="platform" />} />
              <Route path="/onboarding/frequency" element={<OnboardingScreen step="frequency" />} />
              <Route path="/swipe" element={<ProtectedRoute><SwipeScreen /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarScreen /></ProtectedRoute>} />
              <Route path="/scripts" element={<ProtectedRoute><ScriptsScreen /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><PlansScreen /></ProtectedRoute>} />
              <Route path="/settings/niches" element={<ProtectedRoute><NicheSettingsScreen /></ProtectedRoute>} />
              <Route path="/settings/schedule" element={<ProtectedRoute><ScheduleSettingsScreen /></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsScreen /></ProtectedRoute>} />
              <Route path="/settings/platforms" element={<ProtectedRoute><PlatformSettingsScreen /></ProtectedRoute>} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/about" element={<AboutScreen />} />
              <Route path="/contact" element={<ContactScreen />} />
              <Route path="/help" element={<HelpScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
        </OfflineScreen>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
