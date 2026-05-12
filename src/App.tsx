import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { CartProvider } from "@/contexts/CartContext";
import { useTenantAccess } from "@/hooks/useTenantAccess";

const roleDefaultRoute: Record<string, string> = {
  cozinha: "/admin/cozinha",
  pedidos: "/admin/pedidos",
  entrega: "/admin/pedidos",
};

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PedidoBotLayout from "./components/PedidoBotLayout";
import PBDashboard from "./pages/PBDashboard";
import PBOrders from "./pages/PBOrders";
import PBKitchen from "./pages/PBKitchen";
import PBCustomers from "./pages/PBCustomers";
import PBProducts from "./pages/PBProducts";
import PBCategories from "./pages/PBCategories";
import PBWhatsApp from "./pages/PBWhatsApp";
import PBReports from "./pages/PBReports";
import PBSettings from "./pages/PBSettings";
import PBStaff from "./pages/PBStaff";
import PBMenu from "./pages/PBMenu";
import PBPDV from "./pages/PBPDV";
import PBDrivers from "./pages/PBDrivers";
import PBTracking from "./pages/PBTracking";
import LandingPage from "./pages/LandingPage";
import PBSubscription from "./pages/PBSubscription";
import CPanelLayout from "./components/CPanelLayout";
import CPDashboard from "./pages/cpanel/CPDashboard";
import CPEmpresas from "./pages/cpanel/CPEmpresas";
import CPPlanos from "./pages/cpanel/CPPlanos";
import CPComunicacao from "./pages/cpanel/CPComunicacao";
import CPUsers from "./pages/cpanel/CPUsers";
import CPAuditLogs from "./pages/cpanel/CPAuditLogs";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import { SupabaseConfigValidator } from "./components/SupabaseConfigValidator";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isRecovery } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { blocked, loading: tenantLoading } = useTenantAccess();
  const location = useLocation();
  if (loading || roleLoading || tenantLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (isRecovery) return <Navigate to="/reset-password" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (blocked && location.pathname !== "/admin/assinatura") return <Navigate to="/admin/assinatura" replace />;
  // Redirect staff roles to their default page if they hit /admin
  if (role && roleDefaultRoute[role] && location.pathname === "/admin") {
    return <Navigate to={roleDefaultRoute[role]} replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isRecovery } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (isRecovery) return <Navigate to="/reset-password" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "super_admin" && role !== "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isRecovery } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  if (loading || roleLoading) return null;
  if (isRecovery) return <Navigate to="/reset-password" replace />;
  if (user) return <Navigate to={isSuperAdmin ? "/cpanel" : "/admin"} replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseConfigValidator>

    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/cardapio/:slug" element={<PBMenu />} />
              <Route path="/rastreio/:id" element={<PBTracking />} />
              <Route path="/cardapio" element={<Navigate to="/" replace />} />
              <Route path="/install" element={<Install />} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<ProtectedRoute><PedidoBotLayout /></ProtectedRoute>}>
                <Route index element={<PBDashboard />} />
                <Route path="pdv" element={<PBPDV />} />
                <Route path="pedidos" element={<PBOrders />} />
                <Route path="cozinha" element={<PBKitchen />} />
                <Route path="clientes" element={<PBCustomers />} />
                <Route path="produtos" element={<PBProducts />} />
                <Route path="categorias" element={<PBCategories />} />
                <Route path="whatsapp" element={<PBWhatsApp />} />
                <Route path="relatorios" element={<PBReports />} />
                <Route path="config" element={<PBSettings />} />
                <Route path="assinatura" element={<PBSubscription />} />
                <Route path="equipe" element={<PBStaff />} />
                <Route path="entregadores" element={<PBDrivers />} />
              </Route>
              <Route path="/cpanel" element={<AdminRoute><CPanelLayout /></AdminRoute>}>
                <Route index element={<CPDashboard />} />
                <Route path="empresas" element={<CPEmpresas />} />
                <Route path="planos" element={<CPPlanos />} />
                <Route path="usuarios" element={<CPUsers />} />
                <Route path="auditoria" element={<CPAuditLogs />} />
                <Route path="comunicacao" element={<CPComunicacao />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </SupabaseConfigValidator>
  </QueryClientProvider>
);

export default App;
