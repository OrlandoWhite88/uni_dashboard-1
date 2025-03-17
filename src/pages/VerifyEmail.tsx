import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Check if this is a callback from verification
        if (location.search && (location.search.includes("__clerk_status") || location.search.includes("verification_token"))) {
          console.log("Processing verification callback with URL:", window.location.href);
          
          // Process the callback
          try {
            await handleRedirectCallback({
              redirectUrl: window.location.href,
            });
            
            // Let Clerk handle the redirect or fallback to home
            console.log("Verification callback handled successfully");
          } catch (callbackError) {
            console.error("Error during verification callback:", callbackError);
            // On error, go to home page
            window.location.href = window.location.origin;
          }
          return;
        }
        
        // If not a callback, redirect to Clerk hosted verification page
        // Include the redirect URL so Clerk knows where to return the user
        console.log("Redirecting to verification page");
        window.location.href = "https://accounts.uni-customs.com/verify-email?redirect_url=" + 
          encodeURIComponent(window.location.origin);
      } catch (error) {
        console.error("Error during email verification:", error);
      }
    };

    handleVerification();
  }, [location, handleRedirectCallback]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Processing email verification...</p>
    </div>
  );
};

export default VerifyEmail;
