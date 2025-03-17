
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Use the publishable key
const PUBLISHABLE_KEY = "pk_test_aW5ub2NlbnQta2l0dGVuLTcxLmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    // Properly configure Clerk hosted pages
    signInUrl="https://accounts.uni-customs.com/sign-in"
    signUpUrl="https://accounts.uni-customs.com/sign-up"
    // Use the modern props for redirects as mentioned in the error message
    // These get used after successful authentication
    afterSignInUrl="https://www.uni-customs.com/"
    afterSignUpUrl="https://www.uni-customs.com/"
  >
    <App />
  </ClerkProvider>
);
