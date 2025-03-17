
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

const SignInPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the hosted Clerk sign-in page
    window.location.href = "https://accounts.uni-customs.com/sign-in";
  }, []);

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-center">Redirecting to sign-in page...</p>
        </div>
      </div>
    </Layout>
  );
};

export default SignInPage;
