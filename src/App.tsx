import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LandingPage from "./pages/LandingPage";
import Maintenance from "./pages/Maintenance";
import WebsiteHomePage from "./pages/website/WebsiteHomePage";
import WebsiteMatchesPage from "./pages/website/WebsiteMatchesPage";
import WebsiteMatchDetailPage from "./pages/website/WebsiteMatchDetailPage";
import WebsiteLeaguesPage, { WebsiteLeaguePage } from "./pages/website/WebsiteLeaguesPage";
import AppLandingPage from "./pages/website/AppLandingPage";
import StadiumsPage from "./pages/website/StadiumsPage";
import ClubsPage from "./pages/website/ClubsPage";
import ClubDetailPage from "./pages/website/ClubDetailPage";
import SuggestStadiumPage from "./pages/website/SuggestStadiumPage";
import StadiumDetailPage from "./pages/website/StadiumDetailPage";
import DestinationsPage from "./pages/website/DestinationsPage";
import WorldCup2026Page from "./pages/website/WorldCup2026Page";
import AccountProfilePage from "./pages/website/AccountProfilePage";
import FavoritesPage from "./pages/website/FavoritesPage";
import AccountAlertsPage from "./pages/website/AccountAlertsPage";
import PassportPage from "./pages/website/PassportPage";
import SettingsPage from "./pages/website/SettingsPage";
import StadiumMapReviewPage from "./pages/admin/StadiumMapReviewPage";
import StadiumMediaSyncPage from "./pages/admin/StadiumMediaSyncPage";
import AdminShell from "./pages/admin/AdminShell";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminClubsPage from "./pages/admin/AdminClubsPage";
import AdminStadiumsPage from "./pages/admin/AdminStadiumsPage";
import AdminMatchesPage from "./pages/admin/AdminMatchesPage";
import AdminMatchReviewPage from "./pages/admin/AdminMatchReviewPage";
import AdminLeaguesPage from "./pages/admin/AdminLeaguesPage";
import AdminTicketingPage from "./pages/admin/AdminTicketingPage";
import AdminTicketingLeaguesPage from "./pages/admin/AdminTicketingLeaguesPage";
import AdminAssistantPage from "./pages/admin/AdminAssistantPage";
import AdminSuggestionsPage from "./pages/admin/AdminSuggestionsPage";
import AdminLegacyPage from "./pages/admin/AdminLegacyPage";
import AdminWorldMapPage from "./pages/admin/AdminWorldMapPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";
import AdminWorldCup2026Page from "./pages/admin/AdminWorldCup2026Page";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/marketing/AboutPage";
import PricingPage from "./pages/marketing/PricingPage";
import FAQPage from "./pages/marketing/FAQPage";
import PrivacyPage from "./pages/marketing/PrivacyPage";
import TermsPage from "./pages/marketing/TermsPage";
import RefundPage from "./pages/marketing/RefundPage";
import ContactPage from "./pages/marketing/ContactPage";
import CookiesPage from "./pages/marketing/CookiesPage";
import AffiliateDisclosurePage from "./pages/marketing/AffiliateDisclosurePage";
import EditorialPolicyPage from "./pages/marketing/EditorialPolicyPage";
import TicketPolicyPage from "./pages/marketing/TicketPolicyPage";
import { GuidesIndexPage, GuideDetailPage } from "./pages/marketing/GuidesPage";
import { AIAssistantWidget } from "./components/AIAssistantWidget";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireAuth } from "./components/auth/RequireAuth";
import { AuthGateProvider } from "./components/auth/AuthGate";
import { PremiumGateProvider } from "./components/premium/PremiumGate";
import { TrackPriceSheetProvider } from "./components/track/TrackPriceSheet";
import ScrollToTop from "./components/ScrollToTop";

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
            <ScrollToTop />
            <AuthGateProvider>
            <PremiumGateProvider>
            <TrackPriceSheetProvider>
            <Routes>
              {/* ========== PUBLIC SEO WEBSITE ========== */}
              <Route path="/" element={<WebsiteHomePage />} />
              <Route path="/site" element={<WebsiteHomePage />} />
              <Route path="/matches" element={<WebsiteMatchesPage />} />
              <Route path="/matches/:id" element={<WebsiteMatchDetailPage />} />
              <Route path="/leagues" element={<WebsiteLeaguesPage />} />
              <Route path="/leagues/:slug" element={<WebsiteLeaguePage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/clubs/:slug" element={<ClubDetailPage />} />
              <Route path="/world-cup-2026" element={<WorldCup2026Page />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/destinations/:slug" element={<StadiumDetailPage />} />
              <Route path="/stadiums" element={<StadiumsPage />} />
              <Route path="/stadium-directory" element={<StadiumsPage />} />
              <Route path="/stadiums/suggest" element={<SuggestStadiumPage />} />
              <Route path="/stadiums/:slug" element={<StadiumDetailPage />} />
              <Route path="/app" element={<AppLandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/legal/privacy" element={<PrivacyPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/legal/terms" element={<TermsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/legal/refund" element={<RefundPage />} />
              <Route path="/refund-policy" element={<RefundPage />} />
              <Route path="/how-it-works" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/affiliate-disclosure" element={<AffiliateDisclosurePage />} />
              <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
              <Route path="/ticket-policy" element={<TicketPolicyPage />} />
              <Route path="/guides" element={<GuidesIndexPage />} />
              <Route path="/guides/:slug" element={<GuideDetailPage />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

              {/* ========== ACCOUNT (public-style pages, login required) ========== */}
              <Route path="/profile" element={<RequireAuth><AccountProfilePage /></RequireAuth>} />
              <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
              <Route path="/alerts" element={<RequireAuth><AccountAlertsPage /></RequireAuth>} />
              <Route path="/passport" element={<RequireAuth><PassportPage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

              {/* ========== ADMIN (Football Operations Center) ========== */}
              <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="clubs" element={<AdminClubsPage />} />
                <Route path="stadiums" element={<AdminStadiumsPage />} />
                <Route path="matches" element={<AdminMatchesPage />} />
                <Route path="match-review" element={<AdminMatchReviewPage />} />
                <Route path="leagues" element={<AdminLeaguesPage />} />
                <Route path="ticketing" element={<AdminTicketingPage />} />
                <Route path="ticketing/leagues" element={<AdminTicketingLeaguesPage />} />
                <Route path="suggestions" element={<AdminSuggestionsPage />} />
                <Route path="assistant" element={<AdminAssistantPage />} />
                <Route path="map" element={<AdminWorldMapPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
                <Route path="world-cup-2026" element={<AdminWorldCup2026Page />} />
                <Route path="legacy" element={<AdminLegacyPage />} />
              </Route>
              <Route path="/admin/media" element={<RequireAdmin><StadiumMediaSyncPage /></RequireAdmin>} />
              <Route path="/admin/map-review" element={<RequireAdmin><StadiumMapReviewPage /></RequireAdmin>} />
              <Route path="/admin/stadium-map-review" element={<StadiumMapReviewPage />} />
              <Route path="/admin/stadium-media-sync" element={<StadiumMediaSyncPage />} />

              {/* ========== LEGACY /app/* REDIRECTS ========== */}
              <Route path="/app/home" element={<Navigate to="/" replace />} />
              <Route path="/app/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/app/favorites" element={<Navigate to="/favorites" replace />} />
              <Route path="/app/alerts" element={<Navigate to="/alerts" replace />} />
              <Route path="/app/notifications" element={<Navigate to="/alerts" replace />} />
              <Route path="/app/calendar" element={<Navigate to="/matches" replace />} />
              <Route path="/app/matches" element={<Navigate to="/matches" replace />} />
              <Route path="/app/matches/:id" element={<NavigateMatch />} />
              <Route path="/app/match/:id" element={<NavigateMatch />} />
              <Route path="/app/premium" element={<Navigate to="/pricing" replace />} />
              <Route path="/app/upsell" element={<Navigate to="/pricing" replace />} />
              <Route path="/app/daily-game" element={<Navigate to="/" replace />} />
              <Route path="/app/rewards" element={<Navigate to="/" replace />} />
              <Route path="/app/polls" element={<Navigate to="/" replace />} />
              <Route path="/app/admin" element={<Navigate to="/admin" replace />} />
              <Route path="/app/admin/stadium-map-review" element={<Navigate to="/admin/stadium-map-review" replace />} />
              <Route path="/app/admin/stadium-media-sync" element={<Navigate to="/admin/stadium-media-sync" replace />} />

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

// Small helper to redirect /app/matches/:id and /app/match/:id while preserving the id.
import { useParams } from "react-router-dom";
function NavigateMatch() {
  const { id } = useParams();
  return <Navigate to={`/matches/${id}`} replace />;
}

export default App;
