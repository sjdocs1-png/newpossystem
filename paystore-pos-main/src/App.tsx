import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { POSProvider, usePOSSafe } from "@/contexts/POSContext";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getSessionStorageValue } from '@/hooks/useSessionStorage';
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { FeatureGuard } from "@/components/FeatureGuard";

import { PermissionRequestScreen } from "@/components/PermissionRequestScreen";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { OnlineOrderListener } from "@/components/pos/OnlineOrderListener";
import { unlockAudioContext, setOrderSoundSource } from '@/lib/orderSound';

// Lazy-loaded pages for code splitting
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const POSBillingPage = lazy(() => import("./pages/POSBillingPage"));
const TablesManagementPage = lazy(() => import("./pages/TablesManagementPage"));
const OrdersManagementPage = lazy(() => import("./pages/OrdersManagementPage"));
const KitchenDisplayPage = lazy(() => import("./pages/KitchenDisplayPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const StaffPortalPage = lazy(() => import("./pages/StaffPortalPage"));
const StaffDashboardPage = lazy(() => import("./pages/StaffDashboardPage"));
const LeaveRequestPage = lazy(() => import("./pages/LeaveRequestPage"));
const AdvanceRequestPage = lazy(() => import("./pages/AdvanceRequestPage"));
const AdminApprovalsPage = lazy(() => import("./pages/AdminApprovalsPage"));
const StaffSchedulePage = lazy(() => import("./pages/StaffSchedulePage"));
const StaffSettingsPage = lazy(() => import("./pages/StaffSettingsPage"));
const AttendanceReportsPage = lazy(() => import("./pages/AttendanceReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const OwnerSettingsPage = lazy(() => import("./pages/OwnerSettingsPage"));
const LiveViewPage = lazy(() => import("./pages/LiveViewPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const ItemOnOffPage = lazy(() => import("./pages/ItemOnOffPage"));
const SearchBillPage = lazy(() => import("./pages/SearchBillPage"));
const BulkMenuUploadPage = lazy(() => import("./pages/BulkMenuUploadPage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const CategorySummaryPage = lazy(() => import("./pages/reports/CategorySummaryPage"));
const ItemSummaryPage = lazy(() => import("./pages/reports/ItemSummaryPage"));
const SalesSummaryPage = lazy(() => import("./pages/reports/SalesSummaryPage"));
const OrderSummaryPage = lazy(() => import("./pages/reports/OrderSummaryPage"));
const ExecutiveSalesPage = lazy(() => import("./pages/reports/ExecutiveSalesPage"));
const EmployeeSummaryPage = lazy(() => import("./pages/reports/EmployeeSummaryPage"));
const GroupSummaryPage = lazy(() => import("./pages/reports/GroupSummaryPage"));
const VariationSummaryPage = lazy(() => import("./pages/reports/VariationSummaryPage"));
const CoverSizeSummaryPage = lazy(() => import("./pages/reports/CoverSizeSummaryPage"));
const TipSummaryPage = lazy(() => import("./pages/reports/TipSummaryPage"));
const CounterSummaryPage = lazy(() => import("./pages/reports/CounterSummaryPage"));
const StoresPage = lazy(() => import("./pages/StoresPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const CashFlowPage = lazy(() => import("./pages/CashFlowPage"));
const WithdrawalPage = lazy(() => import("./pages/WithdrawalPage"));
const CashTopUpPage = lazy(() => import("./pages/CashTopUpPage"));
const AdvancedReportsPage = lazy(() => import("./pages/AdvancedReportsPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const OnlineOrdersPage = lazy(() => import("./pages/OnlineOrdersPage"));
const KOTListingPage = lazy(() => import("./pages/KOTListingPage"));
const DeliveryPage = lazy(() => import("./pages/DeliveryPage"));

const ChatPage = lazy(() => import("./pages/ChatPage"));
const ComplianceDashboardPage = lazy(() => import("./pages/ComplianceDashboardPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/PurchaseOrdersPage"));
const WorkforceAnalyticsPage = lazy(() => import("./pages/WorkforceAnalyticsPage"));
const AIControlCenterPage = lazy(() => import("./pages/AIControlCenterPage"));
const SmartInventoryPage = lazy(() => import("./pages/SmartInventoryPage"));
const DynamicPricingPage = lazy(() => import("./pages/DynamicPricingPage"));
const ExecutiveDashboardPage = lazy(() => import("./pages/ExecutiveDashboardPage"));
const APIManagementPage = lazy(() => import("./pages/APIManagementPage"));
const TaxEnginePage = lazy(() => import("./pages/TaxEnginePage"));
const RevenueForecastPage = lazy(() => import("./pages/RevenueForecastPage"));
const PRDPage = lazy(() => import("./pages/PRDPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const CustomerMenuPage = lazy(() => import("./pages/CustomerMenuPage"));
const QROrdersPage = lazy(() => import("./pages/QROrdersPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const CreditLedgerPage = lazy(() => import("./pages/CreditLedgerPage"));
const UICustomizationPage = lazy(() => import("./pages/UICustomizationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { PWAInstallPrompt } from "./components/pos/PWAInstallPrompt";

const queryClient = new QueryClient();

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

// Protected route wrapper - defined outside to maintain stable identity
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[]; allowStoreLogin?: boolean; allowStaffLogin?: boolean }> = ({ 
  children, 
  allowedRoles,
  allowStoreLogin = false,
  allowStaffLogin = false
}) => {
  const { isAuthenticated, isLoading, userRole } = useSupabaseAuth();
  const posContext = usePOSSafe();
  
  // Safely access POS context values with defaults
  const isStoreLogin = posContext?.isStoreLogin ?? false;
  const activeStore = posContext?.activeStore ?? null;
  
  // Check for staff login session
  const staffSession = getSessionStorageValue('pos_staff_session');
  const isStaffLoggedIn = !!staffSession;
  const hasAuthenticatedStaffRole = isAuthenticated && userRole?.role === 'staff';
  
  // For staff-only routes (allowStaffLogin=true without allowedRoles), require staff session
  const isStaffOnlyRoute = allowStaffLogin && !allowedRoles && !allowStoreLogin;
  
  // Staff-only route: must have staff session, don't allow owner/admin Supabase auth
  if (isStaffOnlyRoute) {
    if (isStaffLoggedIn || hasAuthenticatedStaffRole) {
      return <MainLayout>{children}</MainLayout>;
    }
    // No staff session - redirect to staff login
    return <Navigate to="/auth" replace />;
  }
  
  // Show loading while auth is initializing (only if not store/staff login)
  if (isLoading && !isStoreLogin && !isStaffLoggedIn) {
    return <LoadingSpinner />;
  }
  
  // Allow access if store login is enabled for this route and user is logged in via store
  if (allowStoreLogin && isStoreLogin && activeStore) {
    return <MainLayout>{children}</MainLayout>;
  }
  
  // Allow access if staff login is enabled for this route and staff is logged in
  if (allowStaffLogin && (isStaffLoggedIn || hasAuthenticatedStaffRole)) {
    return <MainLayout>{children}</MainLayout>;
  }
  
  // Redirect if not authenticated via any method
  if (!isAuthenticated && !isStoreLogin && !isStaffLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access (only for Supabase auth)
  if (allowedRoles && userRole && !allowedRoles.includes(userRole.role)) {
    // If store login is active, allow access
    if (isStoreLogin && activeStore) {
      return <MainLayout>{children}</MainLayout>;
    }
    return <Navigate to="/" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

// Admin route wrapper - no MainLayout, no sidebar, no header
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, userRole } = useSupabaseAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated || userRole?.role !== 'admin') {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public route wrapper - shows content if not authenticated, redirects if authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, userRole } = useSupabaseAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated) {
    // Redirect based on role if role exists
    if (userRole) {
      switch (userRole.role) {
        case 'admin':
          return <Navigate to="/admin-dashboard" replace />;
        case 'owner':
          return <Navigate to="/dashboard" replace />;
        case 'store_manager':
          return <Navigate to="/pos" replace />;
        case 'staff':
          return <Navigate to="/staff-dashboard" replace />;
      }
    }
    // If authenticated but no role yet, still show the page (they need to contact admin)
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const showOrderListener = !/^\/(menu|track)(\/|$)/.test(location.pathname);

  // Enable Android back button handling
  useAndroidBackButton();
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showOrderListener && <OnlineOrderListener />}
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/~oauth" element={<AuthCallbackPage />} />
      
      {/* Reset Password */}
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      
      {/* Public QR Menu for customers */}
      <Route path="/menu/:storeCode" element={<CustomerMenuPage />} />
      <Route path="/track/:storeCode/:orderNumber" element={<OrderTrackingPage />} />
      
      {/* Legacy routes - redirect to unified auth */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/staff-login" element={<Navigate to="/auth" replace />} />

      {/* Admin Routes - standalone layout, no sidebar/header */}
      <Route path="/admin-dashboard" element={
        <AdminRoute><AdminDashboardPage /></AdminRoute>
      } />

      {/* Staff Routes (accessible after staff login) */}
      <Route path="/staff-dashboard" element={
        <ProtectedRoute allowStaffLogin><StaffDashboardPage /></ProtectedRoute>
      } />
      <Route path="/leave-request" element={
        <ProtectedRoute allowStaffLogin><LeaveRequestPage /></ProtectedRoute>
      } />
      <Route path="/advance-request" element={
        <ProtectedRoute allowStaffLogin><AdvanceRequestPage /></ProtectedRoute>
      } />
      
      {/* Protected Routes - Owner & Store Manager */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><POSBillingPage /></ProtectedRoute>
      } />
      <Route path="/tables" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="tableManagement"><TablesManagementPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><OrdersManagementPage /></ProtectedRoute>
      } />
      <Route path="/kitchen" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><KitchenDisplayPage /></ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><InventoryPage /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><ReportsPage /></ProtectedRoute>
      } />
      <Route path="/staff-portal" element={
        <ProtectedRoute><StaffPortalPage /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><SettingsPage /></ProtectedRoute>
      } />
      <Route path="/owner-settings" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><OwnerSettingsPage /></ProtectedRoute>
      } />
      <Route path="/ui-customization" element={
        <ProtectedRoute allowStoreLogin allowStaffLogin><UICustomizationPage /></ProtectedRoute>
      } />
      <Route path="/live-view" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="liveView"><LiveViewPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/operations" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><OperationsPage /></ProtectedRoute>
      } />
      <Route path="/item-onoff" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><ItemOnOffPage /></ProtectedRoute>
      } />
      <Route path="/search-bill" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><SearchBillPage /></ProtectedRoute>
      } />
      <Route path="/bulk-upload" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']}><BulkMenuUploadPage /></ProtectedRoute>
      } />
      <Route path="/menu" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><MenuPage /></ProtectedRoute>
      } />
      <Route path="/stores" element={
        <ProtectedRoute allowedRoles={['admin', 'owner']}><StoresPage /></ProtectedRoute>
      } />
      <Route path="/expenses" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="expenseTracking"><ExpensesPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><CustomersPage /></ProtectedRoute>
      } />
      <Route path="/online-orders" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="swiggyZomato"><OnlineOrdersPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/qr-orders" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="qrMenuOrdering"><QROrdersPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/kot-listing" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="kotListing"><KOTListingPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/support" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><SupportPage /></ProtectedRoute>
      } />
      <Route path="/delivery" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="deliveryTracking"><DeliveryPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/credit-ledger" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="creditLedger"><CreditLedgerPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/cash-flow" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="cashFlow"><CashFlowPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/withdrawal" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="withdrawal"><WithdrawalPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/cash-topup" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="cashTopUp"><CashTopUpPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/advanced-reports" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="advancedAnalytics"><AdvancedReportsPage /></FeatureGuard></ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin allowStaffLogin><FeatureGuard featureKey="teamChat"><ChatPage /></FeatureGuard></ProtectedRoute>
      } />
      {/* Admin Management Routes */}
      <Route path="/admin-approvals" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><AdminApprovalsPage /></ProtectedRoute>
      } />
      <Route path="/staff-schedule" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><StaffSchedulePage /></ProtectedRoute>
      } />
      <Route path="/staff-settings" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><StaffSettingsPage /></ProtectedRoute>
      } />
      <Route path="/attendance-reports" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><AttendanceReportsPage /></ProtectedRoute>
      } />
      
      {/* Report Routes */}
      <Route path="/reports/category" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><CategorySummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/item" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><ItemSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/sales" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><SalesSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/order" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><OrderSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/executive" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><ExecutiveSalesPage /></ProtectedRoute>
      } />
      <Route path="/reports/employee" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><EmployeeSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/group" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><GroupSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/variation" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><VariationSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/cover-size" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><CoverSizeSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/tip" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><TipSummaryPage /></ProtectedRoute>
      } />
      <Route path="/reports/counter" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><CounterSummaryPage /></ProtectedRoute>
      } />
      
      <Route path="/compliance" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="compliance"><ComplianceDashboardPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/purchase-orders" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="purchaseOrders"><PurchaseOrdersPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/workforce-analytics" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="workforceAnalytics"><WorkforceAnalyticsPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/ai-control-center" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="aiControlCenter"><AIControlCenterPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/smart-inventory" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="smartInventory"><SmartInventoryPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/dynamic-pricing" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="dynamicPricing"><DynamicPricingPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/executive-dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'owner']} allowStoreLogin><FeatureGuard featureKey="executiveDashboard"><ExecutiveDashboardPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/api-management" element={
        <ProtectedRoute allowedRoles={['admin', 'owner']} allowStoreLogin><FeatureGuard featureKey="apiIntegrations"><APIManagementPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/tax-engine" element={
        <ProtectedRoute allowedRoles={['admin', 'owner', 'store_manager']} allowStoreLogin><FeatureGuard featureKey="taxEngine"><TaxEnginePage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/revenue-forecast" element={
        <ProtectedRoute allowedRoles={['admin', 'owner']} allowStoreLogin><FeatureGuard featureKey="revenueForecast"><RevenueForecastPage /></FeatureGuard></ProtectedRoute>
      } />
      <Route path="/prd" element={<PRDPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
};

const App = () => {
  console.log('[App] App component mounted');
  const [permissionsComplete, setPermissionsComplete] = useState(() => {
    return localStorage.getItem('permissions_requested') === 'true';
  });

  useEffect(() => {
    // Unlock audio on first user interaction (browser autoplay policy)
    const unlock = () => {
      console.log('[App] Audio unlock triggered by user interaction');
      unlockAudioContext();
      
      // Initialize audio with selected ringtone
      const audio = document.getElementById('order-audio') as HTMLAudioElement;
      if (audio) {
        console.log('[App] Initializing order sound on user interaction');

        let selectedRingtone = 'ringtone1.wav';
        let customSoundUrl: string | null = null;
        let volume = 0.8;

        try {
          const saved = localStorage.getItem('onlineOrderSettings');
          if (saved) {
            const parsed = JSON.parse(saved);
            selectedRingtone = parsed.setSound || 'ringtone1.wav';
            customSoundUrl = parsed.customSoundUrl || null;
            volume = parsed.volume ? Number(parsed.volume) / 100 : 0.8;
            console.log('[App] Selected ringtone:', selectedRingtone, customSoundUrl, volume);
          }
        } catch (e) {
          console.log('[App] Could not read ringtone settings, using default');
        }

        setOrderSoundSource(selectedRingtone, customSoundUrl, volume);
      }
      
      window.removeEventListener('click', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('mousedown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('mousedown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('mousedown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Show permission request screen on first launch (native only)
  if (!permissionsComplete) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <PermissionRequestScreen onComplete={() => setPermissionsComplete(true)} />
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LocaleProvider>
            <SupabaseAuthProvider>
              <POSProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <OfflineIndicator />
                  {/* Global audio element for order notifications - uses data URI for reliability */}
                  <audio 
                    id="order-audio" 
                    src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" 
                    preload="auto"
                  />
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppRoutes />
                    <PWAInstallPrompt />
                  </BrowserRouter>
                </TooltipProvider>
              </POSProvider>
            </SupabaseAuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
