import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useClerk, useAuth } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { setActive } = useClerk();

  // Redirect to Clerk's hosted verification page if no token in URL
  useEffect(() => {
    if (isLoaded && !location.search && !isSignedIn) {
      // Redirect to Clerk's hosted verification page
      window.location.href = "https://accounts.uni-customs.com/verify";
    }
  }, [isLoaded, location.search, isSignedIn]);

  // Handle verification token if present in URL
  useEffect(() => {
    const verifyEmailIfNeeded = async () => {
      try {
        // Handle the verification if this page was loaded from an email link
        if (isLoaded && location.search) {
          // The verification logic is handled by Clerk internally, but we need to
          // ensure we attempt to set the active session afterwards
          await setActive({ session: window.location.href });
          
          // After successful verification, redirect to home
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Error verifying email", error);
      }
    };

    verifyEmailIfNeeded();
  }, [isLoaded, location.search, setActive, navigate]);

  // Show loading state until process completes
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 rounded-xl">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold mb-2">Verifying your email...</h1>
          <p className="text-muted-foreground">Please wait while we verify your email address.</p>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
