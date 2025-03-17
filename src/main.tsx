
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Use the production publishable key
const PUBLISHABLE_KEY = "pk_test_aW5ub2NlbnQta2l0dGVuLTcxLmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    // Configure hosted page URLs
    signInUrl="https://accounts.uni-customs.com/sign-in"
    signUpUrl="https://accounts.uni-customs.com/sign-up"
    // Set default redirects after sign-in/up
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <App />
  </ClerkProvider>
);
