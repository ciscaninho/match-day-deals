import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import Maintenance from "./pages/Maintenance";
import WebsiteHomePage from "./pages/website/WebsiteHomePage";
import WebsiteMatchesPage from "./pages/website/WebsiteMatchesPage";
import WebsiteMatchDetailPage from "./pages/website/WebsiteMatchDetailPage";
import WebsiteLeaguesPage, { WebsiteLeaguePage } from "./pages/website/WebsiteLeaguesPage";
import AppLandingPage from "./pages/website/AppLandingPage";
import MatchesPage from "./pages/MatchesPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import CalendarPage from "./pages/CalendarPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import PremiumPage from "./pages/PremiumPage";
import PollsPage from "./pages/PollsPage";
import QuizPage from "./pages/QuizPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import AlertsPage from "./pages/AlertsPage";
import PremiumUpsellPage from "./pages/PremiumUpsellPage";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/marketing/AboutPage";
import PricingPage from "./pages/marketing/PricingPage";
import FAQPage from "./pages/marketing/FAQPage";
import PrivacyPage from "./pages/marketing/PrivacyPage";
import TermsPage from "./pages/marketing/TermsPage";
import RefundPage from "./pages/marketing/RefundPage";
import { AIAssistantWidget } from "./components/AIAssistantWidget";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireAuth } from "./components/auth/RequireAuth";
import { AuthGateProvider } from "./components/auth/AuthGate";
import { PremiumGateProvider } from "./components/premium/PremiumGate";
import { TrackPriceSheetProvider } from "./components/track/TrackPriceSheet";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <UserProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthGateProvider>
            <PremiumGateProvider>
            <TrackPriceSheetProvider>
            <Routes>
              {/* ========== PUBLIC SEO WEBSITE (no login) ========== */}
              <Route path="/" element={<WebsiteHomePage />} />
              <Route path="/matches" element={<WebsiteMatchesPage />} />
              <Route path="/matches/:id" element={<WebsiteMatchDetailPage />} />
              <Route path="/leagues" element={<WebsiteLeaguesPage />} />
              <Route path="/leagues/:slug" element={<WebsiteLeaguePage />} />
              <Route path="/app" element={<AppLandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/legal/privacy" element={<PrivacyPage />} />
              <Route path="/legal/terms" element={<TermsPage />} />
              <Route path="/legal/refund" element={<RefundPage />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

              {/* ========== FULL APPLICATION (logged-in companion) ========== */}
              <Route path="/app/home" element={<RequireAuth><HomePage /></RequireAuth>} />
              <Route path="/app/matches" element={<RequireAuth><MatchesPage /></RequireAuth>} />
              <Route path="/app/matches/:id" element={<RequireAuth><MatchDetailPage /></RequireAuth>} />
              {/* legacy match detail path */}
              <Route path="/app/match/:id" element={<RequireAuth><MatchDetailPage /></RequireAuth>} />
              <Route path="/app/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
              <Route path="/app/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
              <Route path="/app/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
              <Route path="/app/upsell" element={<RequireAuth><PremiumUpsellPage /></RequireAuth>} />
              <Route path="/app/favorites" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
              <Route path="/app/daily-game" element={<RequireAuth><QuizPage /></RequireAuth>} />
              <Route path="/app/rewards" element={<RequireAuth><QuizPage /></RequireAuth>} />
              <Route path="/app/polls" element={<RequireAuth><PollsPage /></RequireAuth>} />
              <Route path="/app/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/app/premium" element={<RequireAuth><PremiumPage /></RequireAuth>} />
              <Route
                path="/app/admin"
                element={
                  <RequireAdmin>
                    <AdminPage />
                  </RequireAdmin>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIAssistantWidget />
            </TrackPriceSheetProvider>
            </PremiumGateProvider>
            </AuthGateProvider>
          </BrowserRouter>
        </UserProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
