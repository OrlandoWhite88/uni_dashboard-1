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
        if (location.search && location.search.includes("__clerk_status")) {
          // Process the callback
          await handleRedirectCallback({
            redirectUrl: window.location.href,
          });
          // Redirect to home after verification
          window.location.href = "https://www.uni-customs.com/";
          return;
        }
        
        // If not a callback, redirect to Clerk hosted verification page
        window.location.href = "https://accounts.uni-customs.com/verify-email";
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
