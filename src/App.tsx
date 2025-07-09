import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import IntercomProvider from "./components/IntercomProvider";
import Dashboard from "./old-pages/Dashboard";
import Classify from "./old-pages/Classify";
import ClassificationComplete from "./old-pages/ClassificationComplete";
import NotFound from "./old-pages/NotFound";
import Settings from "./old-pages/Settings";
import SSOCallback from "./old-pages/SSOCallback";
import OAuthCallback from "./old-pages/OAuthCallback";
import BulkImport from "./old-pages/BulkImport";
import BatchClassify from "./old-pages/BatchClassify";
import DebugStripe from "./old-pages/DebugStripe";
import TariffCalculatorPage from "./old-pages/TariffCalculatorPage";
import TradeFlagsPage from "./old-pages/TradeFlagsPage";
import ClassificationHistory from "./old-pages/ClassificationHistory";
import NavigationDemo from "./old-pages/NavigationDemo";

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
