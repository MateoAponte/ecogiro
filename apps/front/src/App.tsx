import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ReportsProvider } from '@/contexts/ReportsContext';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import SchedulePage from './pages/SchedulePage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import RewardsPage from './pages/RewardsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import CampaignsPage from './pages/CampaignsPage';
import FAQPage from './pages/FAQPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CollectionHistoryPage from './pages/CollectionHistoryPage';
import NotFound from './pages/NotFound';

import AgentHomePage from './pages/AgentHomePage';
import { roleHome, type UserRole } from './lib/auth-roles';

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user, isAuthenticated, isRestoringSession } = useAuth();

  if (isRestoringSession) return <SessionLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.rol && !allowedRoles.includes(user.rol)) {
    return <Navigate to={roleHome(user?.rol)} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isRestoringSession } = useAuth();

  if (isRestoringSession) return <SessionLoading />;

  if (isAuthenticated) {
    return <Navigate to={roleHome(user?.rol)} replace />;
  }

  return <>{children}</>;
}

function SessionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p role="status" className="text-muted-foreground">
        Validando sesión...
      </p>
    </div>
  );
}

// ScrollToTop component to reset scroll on route change
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Ciudadano routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <ScanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collections"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <CollectionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collections/history"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <CollectionHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collections/:id"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <CollectionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <RewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <FAQPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute allowedRoles={['CIUDADANO']}>
              <PrivacyPolicyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['RECUPERADOR']}>
              <Navigate to="/agent/recoveries" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agent/recoveries"
          element={
            <ProtectedRoute allowedRoles={['RECUPERADOR']}>
              <AgentHomePage key="available" mode="available" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/accepted"
          element={
            <ProtectedRoute allowedRoles={['RECUPERADOR']}>
              <AgentHomePage key="accepted" mode="accepted" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/profile"
          element={
            <ProtectedRoute allowedRoles={['RECUPERADOR']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Centro de Acopio routes */}
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute allowedRoles={['CENTRO_DE_ACOPIO']}>
              <CampaignsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ReportsProvider>
              <AppRoutes />
            </ReportsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
