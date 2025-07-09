import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import IntercomProvider from "./components/IntercomProvider";
import Dashboard from "./pages/Dashboard";
import Classify from "./pages/Classify";
import ClassificationComplete from "./pages/ClassificationComplete";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SSOCallback from "./pages/SSOCallback";
import OAuthCallback from "./pages/OAuthCallback";
import BulkImport from "./pages/BulkImport";
import BatchClassify from "./pages/BatchClassify";
import DebugStripe from "./pages/DebugStripe";
import TariffCalculatorPage from "./pages/TariffCalculatorPage";
import TradeFlagsPage from "./pages/TradeFlagsPage";
import ClassificationHistory from "./pages/ClassificationHistory";
import NavigationDemo from "./pages/NavigationDemo";

// Create Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <IntercomProvider />
        <Routes>
          {/* Root redirect to product */}
          <Route path="/" element={<Navigate to="/product" replace />} />
          
          {/* Main routes */}
          <Route path="/product" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classify" element={<Classify />} />
          <Route path="/classification-complete" element={<ClassificationComplete />} />

          {/* Settings route - accessible for all users */}
          <Route
            path="/settings"
            element={<Settings />}
          />
          <Route
            path="/bulk-import"
            element={<BulkImport />}
          />
          <Route
            path="/tariff-calculator"
            element={<TariffCalculatorPage />}
          />
          <Route
            path="/trade-flags"
            element={<TradeFlagsPage />}
          />
          <Route
            path="/classification-history"
            element={<ClassificationHistory />}
          />
          <Route
            path="/navigation-demo"
            element={<NavigationDemo />}
          />
          <Route
            path="/debug-stripe"
            element={
              <ProtectedRoute>
                <DebugStripe />
              </ProtectedRoute>
            }
          />

          {/* Authentication callback routes */}
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/sso-callback" element={<SSOCallback />} />

          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Analytics />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
