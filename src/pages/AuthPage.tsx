import React from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useSearchParams, Link } from "react-router-dom";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin'; // 'signin' or 'signup'

  return (
    <>
      {/* Custom styles for Clerk buttons */}
      <style>
        {`
          .cl-formButtonPrimary {
            background: linear-gradient(135deg, #1E43FF 0%, #A7AED0 100%) !important;
          }
          .cl-formButtonPrimary:hover {
            background: linear-gradient(135deg, #1a3ee6 0%, #9ba6c7 100%) !important;
          }
        `}
      </style>
      
      <div className="min-h-screen w-full flex">
      {/* Left Section - Authentication Form */}
      <div className="w-full lg:w-1/3 flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-background">
        <div className="max-w-sm mx-auto w-full">
          {/* Logo/Brand */}
          <div className="mb-8 text-center">
            <Link to="/" className="flex items-center justify-center mb-4">
              <img src="/uni_logo.png" alt="Logo" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-muted-foreground text-sm">
              {mode === 'signup' 
                ? 'Create your account to get started' 
                : 'Welcome back! Please sign in to continue'
              }
            </p>
          </div>

          {/* Auth Component */}
          <div className="w-full">
            {mode === 'signup' ? (
              <SignUp 
                redirectUrl="/dashboard"
                signInUrl="/auth?mode=signin"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-border hover:bg-secondary/50 transition-colors",
                    socialButtonsBlockButtonText: "text-foreground",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground",
                    formFieldInput: "border border-border bg-background focus:ring-primary focus:border-primary",
                    formFieldLabel: "text-foreground",
                    formButtonPrimary: "border-0 text-white font-medium",
                    footerActionText: "text-muted-foreground",
                    footerActionLink: "text-primary hover:text-primary/90",
                    identityPreviewText: "text-foreground",
                    identityPreviewEditButton: "text-primary hover:text-primary/90"
                  }
                }}
              />
            ) : (
              <SignIn 
                redirectUrl="/dashboard"
                signUpUrl="/auth?mode=signup"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-border hover:bg-secondary/50 transition-colors",
                    socialButtonsBlockButtonText: "text-foreground",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground",
                    formFieldInput: "border border-border bg-background focus:ring-primary focus:border-primary",
                    formFieldLabel: "text-foreground",
                    formButtonPrimary: "border-0 text-white font-medium",
                    footerActionText: "text-muted-foreground",
                    footerActionLink: "text-primary hover:text-primary/90",
                    identityPreviewText: "text-foreground",
                    identityPreviewEditButton: "text-primary hover:text-primary/90"
                  }
                }}
              />
            )}
          </div>

          {/* Additional Links */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Custom Gradient Background */}
      <div className="hidden lg:flex lg:w-2/3 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #1E43FF 0%, #A7AED0 100%)'}}>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent transform skew-x-12" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Streamline Your Trade Classifications
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Join thousands of businesses using AI-powered HS code classification to accelerate their international trade operations.
            </p>
            
            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">AI-powered HS classification</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">Advanced duty calculations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">Bulk processing capabilities</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white/90">Real-time trade compliance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-40 w-20 h-20 bg-white/15 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/20 rounded-full blur-xl" />
      </div>
    </div>
    </>
  );
};

export default AuthPage;
