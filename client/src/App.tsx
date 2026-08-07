import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { BrowseFundsPage } from "./pages/BrowseFundsPage";
import { FundDetailPage } from "./pages/FundDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DonorDashboardPage } from "./pages/DonorDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DonateSuccessPage } from "./pages/DonateSuccessPage";
import { DonateCancelledPage } from "./pages/DonateCancelledPage";
import { OAuthCompletePage } from "./pages/OAuthCompletePage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/funds" element={<BrowseFundsPage />} />
          <Route path="/funds/:slug" element={<FundDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/donate/success" element={<DonateSuccessPage />} />
          <Route path="/donate/cancelled" element={<DonateCancelledPage />} />
          <Route path="/oauth/complete" element={<OAuthCompletePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="DONOR">
                <DonorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
