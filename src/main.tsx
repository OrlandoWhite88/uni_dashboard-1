
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Use the publishable key
const PUBLISHABLE_KEY = "pk_test_aW5ub2NlbnQta2l0dGVuLTcxLmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      baseTheme: undefined
    }}
    // Use the hosted Clerk pages for sign-in/up
    signInUrl="https://accounts.uni-customs.com/sign-in"
    signUpUrl="https://accounts.uni-customs.com/sign-up"
    // Configure redirect URLs
    afterSignInUrl="https://www.uni-customs.com/"
    afterSignUpUrl="https://www.uni-customs.com/"
  >
    <App />
  </ClerkProvider>
);
