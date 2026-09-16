import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { POSProvider } from './context/POSContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { WebSocketOrderAlertListener } from './components/merchant/WebSocketOrderAlertListener';
import { OfflineSyncBanner } from './components/merchant/OfflineSyncBanner';

// Lazy-loaded Auth Pages
const LoginScreen = lazy(() =>
  import('./pages/auth/LoginScreen').then((m) => ({ default: m.LoginScreen }))
);
const RegisterScreen = lazy(() =>
  import('./pages/auth/RegisterScreen').then((m) => ({ default: m.RegisterScreen }))
);
const StaffLoginScreen = lazy(() =>
  import('./pages/auth/StaffLoginScreen').then((m) => ({ default: m.StaffLoginScreen }))
);

// Lazy-loaded Merchant Pages
const DashboardScreen = lazy(() =>
  import('./pages/merchant/DashboardScreen').then((m) => ({ default: m.DashboardScreen }))
);
const POSScreen = lazy(() =>
  import('./pages/merchant/POSScreen').then((m) => ({ default: m.POSScreen }))
);
const KhataScreen = lazy(() =>
  import('./pages/merchant/KhataScreen').then((m) => ({ default: m.KhataScreen }))
);
const ProcurementListScreen = lazy(() =>
  import('./pages/merchant/ProcurementListScreen').then((m) => ({ default: m.ProcurementListScreen }))
);
const ExpenseScreen = lazy(() =>
  import('./pages/merchant/ExpenseScreen').then((m) => ({ default: m.ExpenseScreen }))
);
const InventoryScreen = lazy(() =>
  import('./pages/merchant/InventoryScreen').then((m) => ({ default: m.InventoryScreen }))
);
const AnalyticsScreen = lazy(() =>
  import('./pages/merchant/AnalyticsScreen').then((m) => ({ default: m.AnalyticsScreen }))
);
const OffersScreen = lazy(() =>
  import('./pages/merchant/OffersScreen').then((m) => ({ default: m.OffersScreen }))
);
const ProfileScreen = lazy(() =>
  import('./pages/merchant/ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
);
const PickupVerifyScreen = lazy(() =>
  import('./pages/merchant/PickupVerifyScreen').then((m) => ({ default: m.PickupVerifyScreen }))
);

// Protected Route Guard (Merchant Only Check)
const ProtectedMerchantRoute = ({ children }) => {
  const { isAuthenticated, loading, isMerchant } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading Merchant OS..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <POSProvider>
              <BrowserRouter>
                <WebSocketOrderAlertListener />
                <OfflineSyncBanner />
                <Suspense fallback={<LoadingSpinner text="Loading Merchant OS..." />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/merchant" replace />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/staff-login" element={<StaffLoginScreen />} />
                    <Route path="/merchant/staff-login" element={<StaffLoginScreen />} />

                    {/* Merchant Dashboard & Dukan OS (Protected) */}
                    <Route
                      path="/merchant"
                      element={
                        <ProtectedMerchantRoute>
                          <DashboardScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route
                      path="/merchant/pos"
                      element={
                        <ProtectedMerchantRoute>
                          <POSScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/pos" element={<Navigate to="/merchant/pos" replace />} />
                    <Route
                      path="/merchant/khata"
                      element={
                        <ProtectedMerchantRoute>
                          <KhataScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/khata" element={<Navigate to="/merchant/khata" replace />} />
                    <Route
                      path="/merchant/procurement-list"
                      element={
                        <ProtectedMerchantRoute>
                          <ProcurementListScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/procurement" element={<Navigate to="/merchant/procurement-list" replace />} />
                    <Route path="/merchant/procurement" element={<Navigate to="/merchant/procurement-list" replace />} />
                    <Route
                      path="/merchant/expenses"
                      element={
                        <ProtectedMerchantRoute>
                          <ExpenseScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/expenses" element={<Navigate to="/merchant/expenses" replace />} />
                    <Route
                      path="/merchant/inventory"
                      element={
                        <ProtectedMerchantRoute>
                          <InventoryScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/inventory" element={<Navigate to="/merchant/inventory" replace />} />
                    <Route
                      path="/merchant/analytics"
                      element={
                        <ProtectedMerchantRoute>
                          <AnalyticsScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/analytics" element={<Navigate to="/merchant/analytics" replace />} />

                    <Route
                      path="/merchant/offers"
                      element={
                        <ProtectedMerchantRoute>
                          <OffersScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/offers" element={<Navigate to="/merchant/offers" replace />} />

                    <Route
                      path="/merchant/pickups"
                      element={
                        <ProtectedMerchantRoute>
                          <PickupVerifyScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/reservations" element={<Navigate to="/merchant/pickups" replace />} />

                    <Route
                      path="/profile"
                      element={
                        <ProtectedMerchantRoute>
                          <ProfileScreen />
                        </ProtectedMerchantRoute>
                      }
                    />
                    <Route path="/merchant/profile" element={<Navigate to="/profile" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/merchant" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </POSProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
