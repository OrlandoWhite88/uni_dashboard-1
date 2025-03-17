import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

/**
 * Email verification component for Clerk authentication
 */
const VerifyEmail = () => {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processVerification = async () => {
      try {
        // Let Clerk handle email verification
        await handleRedirectCallback({
          redirectUrl: window.location.href
        });
        
        // If we reach here, the automatic redirect didn't happen
        // Navigate to the home page as a fallback
        navigate("/");
      } catch (err) {
        console.error("Email verification error:", err);
        setError("Verification error. Please try again or contact support.");
        setIsProcessing(false);
      }
    };

    processVerification();
  }, [handleRedirectCallback, navigate]);

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 rounded-xl">
          {error ? (
            <>
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-semibold mb-2">Verification Error</h1>
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
              <h1 className="text-2xl font-semibold mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address.</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
