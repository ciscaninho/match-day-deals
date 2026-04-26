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
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/marketing/AboutPage";
import PricingPage from "./pages/marketing/PricingPage";
import FAQPage from "./pages/marketing/FAQPage";
import PrivacyPage from "./pages/marketing/PrivacyPage";
import TermsPage from "./pages/marketing/TermsPage";
import { AIAssistantWidget } from "./components/AIAssistantWidget";
import { RequireAdmin } from "./components/RequireAdmin";

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
            <Routes>
              {/* ========== PUBLIC MARKETING WEBSITE ========== */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/legal/privacy" element={<PrivacyPage />} />
              <Route path="/legal/terms" element={<TermsPage />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* ========== FULL APPLICATION ========== */}
              <Route path="/app" element={<HomePage />} />
              <Route path="/app/matches" element={<MatchesPage />} />
              <Route path="/app/matches/:id" element={<MatchDetailPage />} />
              {/* legacy match detail path */}
              <Route path="/app/match/:id" element={<MatchDetailPage />} />
              <Route path="/app/calendar" element={<CalendarPage />} />
              <Route path="/app/notifications" element={<NotificationsPage />} />
              <Route path="/app/favorites" element={<NotificationsPage />} />
              <Route path="/app/daily-game" element={<QuizPage />} />
              <Route path="/app/rewards" element={<QuizPage />} />
              <Route path="/app/polls" element={<PollsPage />} />
              <Route path="/app/profile" element={<ProfilePage />} />
              <Route path="/app/premium" element={<PremiumPage />} />
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
          </BrowserRouter>
        </UserProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
