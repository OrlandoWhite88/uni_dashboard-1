
import React from "react";
import { SignIn } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

const SignInPage = () => {
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>
        <div className="glass-card p-4 rounded-xl">
          <SignIn 
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-none w-full",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground"
              }
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SignInPage;
