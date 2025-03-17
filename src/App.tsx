import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import IntercomProvider from "./components/IntercomProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import SSOCallback from "./pages/SSOCallback";
import OAuthCallback from "./pages/OAuthCallback";
import BulkImport from "./pages/BulkImport";
import BatchClassify from "./pages/BatchClassify";
import DebugStripe from "./pages/DebugStripe";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <IntercomProvider />
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Index />} />
          
          {/* Auth routes - these will redirect to Clerk's hosted pages */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          
          {/* Auth callback routes */}
          <Route path="/sign-up/verify-email-address" element={<VerifyEmail />} />
          <Route path="/sign-up/sso-callback" element={<SSOCallback />} />
          <Route path="/sign-in/sso-callback" element={<SSOCallback />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/sso-callback" element={<OAuthCallback />} />
          
          {/* Protected routes */}
          <Route path="/settings" element={
            <>
              <SignedIn>
                <Settings />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          } />
          
          <Route path="/bulk-import" element={
            <>
              <SignedIn>
                <BulkImport />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          } />
          
          <Route path="/debug-stripe" element={
            <>
              <SignedIn>
                <DebugStripe />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
