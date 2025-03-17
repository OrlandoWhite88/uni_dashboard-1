
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Use environment variable for the publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                        "pk_test_aW5ub2NlbnQta2l0dGVuLTcxLmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Determine if we're in development environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === "localhost";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    // Configure sign-in and sign-up URLs based on environment
    signInUrl={isDevelopment ? "/sign-in" : "https://accounts.uni-customs.com/sign-in"}
    signUpUrl={isDevelopment ? "/sign-up" : "https://accounts.uni-customs.com/sign-up"}
    // Where to redirect after authentication
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <App />
  </ClerkProvider>
);
