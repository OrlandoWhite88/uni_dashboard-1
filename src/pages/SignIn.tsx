
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SignInPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // For development environment, check if we're on localhost
    if (window.location.hostname === "localhost") {
      // Redirect to the hosted Clerk sign-in page
      window.location.href = "https://accounts.uni-customs.com/sign-in";
    } else {
      // For production, we might have already been redirected to hosted page
      // If we're still here, let's try again
      window.location.href = "https://accounts.uni-customs.com/sign-in";
    }
  }, []);
  
  // Show a loading message while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold">Redirecting to sign in...</h2>
      </div>
    </div>
  );
};

export default SignInPage;
