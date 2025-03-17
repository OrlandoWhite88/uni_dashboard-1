import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

const SSOCallback = () => {
  const { handleRedirectCallback } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Always redirect to home page after successful auth
        // This ensures consistent behavior across the application
        const redirectUrl = "/";
        
        // Handle the OAuth callback
        await handleRedirectCallback({
          redirectUrl,
        });
        
        // Navigate to the home page
        navigate(redirectUrl, { replace: true });
        
      } catch (err) {
        console.error("Error during SSO callback processing:", err);
        setError("There was an error processing your authentication. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleRedirectCallback, location, navigate]);

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 rounded-xl">
          {isProcessing ? (
            <>
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-semibold mb-2">Processing authentication...</h1>
              <p className="text-muted-foreground">Please wait while we complete your sign-in.</p>
            </>
          ) : error ? (
            <>
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-semibold mb-2">Authentication Error</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <a 
                href="https://accounts.uni-customs.com/sign-in" 
                className="text-primary hover:underline"
              >
                Return to sign in
              </a>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-semibold mb-2">Redirecting...</h1>
              <p className="text-muted-foreground">You'll be redirected to the application shortly.</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SSOCallback;
