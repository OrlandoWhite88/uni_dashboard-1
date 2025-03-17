import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Removed ClerkProvider import as it's already in main.tsx
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
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-up/verify-email-address" element={<VerifyEmail />} />
          <Route path="/sign-up/sso-callback" element={<SSOCallback />} />
          <Route path="/sign-in/sso-callback" element={<SSOCallback />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/sso-callback" element={<OAuthCallback />} />
          <Route path="/bulk-import" element={<BulkImport />} />
          <Route path="/debug-stripe" element={<DebugStripe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
