
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SignInPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Clerk hosted sign-in page
    window.location.href = "https://accounts.uni-customs.com/sign-in";
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting to sign in...</p>
    </div>
  );
};

export default SignInPage;
