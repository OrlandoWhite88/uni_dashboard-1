
import React from "react";
import { SignUp } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

const SignUpPage = () => {
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Create an Account</h1>
        <div className="glass-card p-4 rounded-xl">
          <SignUp 
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
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

export default SignUpPage;
