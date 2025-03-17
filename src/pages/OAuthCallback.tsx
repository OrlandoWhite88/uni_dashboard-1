import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

/**
 * OAuth callback handler component for Clerk authentication
 */
const OAuthCallback = () => {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Process the Clerk OAuth callback
    const processCallback = async () => {
      try {
        // Let Clerk handle the redirect callback
        // This automatically processes the OAuth flow and redirects based on your ClerkProvider configuration
        await handleRedirectCallback({
          redirectUrl: window.location.href
        });
        
        // If we reach here, it means the automatic redirect didn't happen
        // Navigate to the home page as a fallback
        navigate("/");
      } catch (err) {
        console.error("Error processing OAuth callback:", err);
        setError("Authentication error. Please try again.");
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleRedirectCallback, navigate]);

  // Show a simple loading screen while processing
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 rounded-xl">
          {error ? (
            <>
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-semibold mb-2">Authentication Error</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={() => navigate("/")}
                className="text-primary hover:underline"
              >
                Return to home page
              </button>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-semibold mb-2">Processing authentication...</h1>
              <p className="text-muted-foreground">Please wait while we complete your sign-in.</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OAuthCallback;
