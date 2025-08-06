import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { DevWrapper, MockSignedIn, MockSignedOut } from "./components/DevWrapper";
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
import NavigationDemo from "./pages/NavigationDemo";
import AuthPage from "./pages/AuthPage";

// Check if we're in development
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Create Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (isDevelopment) {
    return (
      <>
        <MockSignedIn>{children}</MockSignedIn>
        <MockSignedOut>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Development Mode</h1>
              <p className="text-gray-600">Sign in required (mocked for local development)</p>
            </div>
          </div>
        </MockSignedOut>
      </>
    );
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/auth?mode=signin" replace />
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
          {/* Root redirect to product - protected */}
          <Route path="/" element={<Navigate to="/product" replace />} />
          
          {/* Main routes - all protected */}
          <Route
            path="/product"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classify"
            element={
              <ProtectedRoute>
                <Classify />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classification-complete"
            element={
              <ProtectedRoute>
                <ClassificationComplete />
              </ProtectedRoute>
            }
          />

          {/* Settings route - protected */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-import"
            element={
              <ProtectedRoute>
                <BulkImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tariff-calculator"
            element={
              <ProtectedRoute>
                <TariffCalculatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trade-flags"
            element={
              <ProtectedRoute>
                <TradeFlagsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/navigation-demo"
            element={
              <ProtectedRoute>
                <NavigationDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug-stripe"
            element={
              <ProtectedRoute>
                <DebugStripe />
              </ProtectedRoute>
            }
          />

          {/* Authentication routes - not protected */}
          <Route path="/auth" element={<AuthPage />} />
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
