import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useThemeStore, useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ── Lazy-loaded Pages ───────────────────────────────────────────
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const PropertiesPage = lazy(() => import("@/pages/PropertiesPage"));
const PropertyDetailPage = lazy(() => import("@/pages/PropertyDetailPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const LoanCalculatorPage = lazy(() => import("@/pages/LoanCalculatorPage"));
const PropertyComparePage = lazy(() => import("@/pages/PropertyComparePage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const BuyerDashboard = lazy(() => import("@/pages/BuyerDashboard"));
const SellerDashboard = lazy(() => import("@/pages/SellerDashboard"));
const BuilderDashboard = lazy(() => import("@/pages/BuilderDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

// ── Loading Fallback ────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--text-tertiary)]">Loading PropVerse AI...</p>
      </div>
    </div>
  );
}

// ── Scroll to Top on Route Change ───────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ── Layout Wrapper (Navbar + Footer) ────────────────────────────
function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

// ── Auth Layout (No Navbar/Footer) ──────────────────────────────
function AuthLayout({ children }) {
  return <>{children}</>;
}

// ── App Root ────────────────────────────────────────────────────
export default function App() {
  const { initTheme } = useThemeStore();
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    initTheme();
    restoreSession();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        restoreSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initTheme, restoreSession]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />

          {/* Main App Routes */}
          <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
          <Route path="/properties" element={<MainLayout><PropertiesPage /></MainLayout>} />
          <Route path="/properties/:id" element={<MainLayout><PropertyDetailPage /></MainLayout>} />
          <Route path="/search" element={<MainLayout><SearchPage /></MainLayout>} />
          <Route path="/calculator" element={<MainLayout><LoanCalculatorPage /></MainLayout>} />
          <Route path="/compare" element={<MainLayout><PropertyComparePage /></MainLayout>} />
          <Route path="/chat" element={<MainLayout><ChatPage /></MainLayout>} />
          <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />

          {/* Role Dashboards */}
          <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
          <Route path="/dashboard/buyer" element={<MainLayout><BuyerDashboard /></MainLayout>} />
          <Route path="/dashboard/seller" element={<MainLayout><SellerDashboard /></MainLayout>} />
          <Route path="/dashboard/builder" element={<MainLayout><BuilderDashboard /></MainLayout>} />
          <Route path="/dashboard/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />

          {/* 404 */}
          <Route path="*" element={
            <MainLayout>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
                  <p className="text-[var(--text-secondary)] mb-6">Page not found</p>
                  <a href="/" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    Go Home
                  </a>
                </div>
              </div>
            </MainLayout>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
