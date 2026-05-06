import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSubdomain } from "@/hooks/useSubdomain";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";

// Main site pages
import Index from "./pages/Index";
import About from "./pages/About";
import Pillars from "./pages/Pillars";
import Press from "./pages/Press";
import Join from "./pages/Join";
import Donate from "./pages/Donate";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const AppContent = () => {
  const subdomain = useSubdomain();
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();
  const pathname = window.location.pathname;
  const isAdminRoute = pathname.startsWith("/admin");

  // Admin subdomain routing
  if (subdomain === "admin") {
    return (
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<AdminLogin />} />
      </Routes>
    );
  }

  // Admin routes are always accessible regardless of maintenance
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // For public routes: show maintenance if active (don't block on loading)
  if (!isLoading && isMaintenanceMode) {
    return (
      <Routes>
        <Route path="*" element={<Maintenance />} />
      </Routes>
    );
  }

  // Normal routing (render immediately, don't wait for maintenance check)
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/pillars" element={<Pillars />} />
      <Route path="/press" element={<Press />} />
      <Route path="/join" element={<Join />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
