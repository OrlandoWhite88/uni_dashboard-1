import React, { useEffect } from "react";

const SignUpPage = () => {
  useEffect(() => {
    // Redirect to Clerk hosted sign-up page
    if (typeof window !== 'undefined') {
      window.location.href = "https://accounts.uni-customs.com/sign-up";
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting to sign up...</p>
    </div>
  );
};

export default SignUpPage;
