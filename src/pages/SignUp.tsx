
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SignUpPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Clerk hosted sign-up page
    window.location.href = "https://accounts.uni-customs.com/sign-up";
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting to sign up...</p>
    </div>
  );
};

export default SignUpPage;
