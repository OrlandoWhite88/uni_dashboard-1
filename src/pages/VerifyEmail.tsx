import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useClerk, useAuth } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

const VerifyEmail = () => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const { setActive } = useClerk();

  // Automatically attempt to verify the email if there's a token in the URL
  React.useEffect(() => {
    const verifyEmailIfNeeded = async () => {
      try {
        // Handle the verification if this page was loaded from an email link
        if (isLoaded && location.search) {
          // The verification logic is handled by Clerk internally, but we need to
          // ensure we attempt to set the active session afterwards
          await setActive({ session: window.location.href });
        }
      } catch (error) {
        console.error("Error verifying email", error);
      }
    };

    verifyEmailIfNeeded();
  }, [isLoaded, location.search, setActive]);

  // Show loading state until Clerk is loaded
  if (!isLoaded) {
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
  }

  // If already signed in, redirect to home
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Show the verification message
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8 rounded-xl">
          <h1 className="text-2xl font-semibold mb-4">Verify Your Email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to your email address. Please check your inbox and click on the link to verify your account.
          </p>
          <p className="text-sm text-muted-foreground">
            Didn't receive an email? Check your spam folder or{" "}
            <a href="/sign-up" className="text-primary hover:underline">
              try signing up again
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
