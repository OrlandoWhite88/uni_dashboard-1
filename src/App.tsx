import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import IntercomProvider from "./components/IntercomProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SSOCallback from "./pages/SSOCallback";
import OAuthCallback from "./pages/OAuthCallback";
import BulkImport from "./pages/BulkImport";
import BatchClassify from "./pages/BatchClassify";
import DebugStripe from "./pages/DebugStripe";

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
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          
          {/* Protected routes */}
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
            element={<BulkImport />} 
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
