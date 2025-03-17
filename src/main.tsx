
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Use the publishable key
const PUBLISHABLE_KEY = "pk_test_aW5ub2NlbnQta2l0dGVuLTcxLmNsZXJrLmFjY291bnRzLmRldiQ";

// Get the base URL for the app
const domain = window.location.hostname;
const isDev = domain === 'localhost' || domain.startsWith('127.0.0.1');
const baseUrl = isDev ? window.location.origin : 'https://www.uni-customs.com';

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    // Use consistent Clerk hosted URLs
    signInUrl="https://accounts.uni-customs.com/sign-in"
    signUpUrl="https://accounts.uni-customs.com/sign-up"
    
    // Use the current domain for redirects to handle both development and production
    afterSignInUrl={baseUrl}
    afterSignUpUrl={baseUrl}
    
    // Note: Clerk will handle the user profile URL automatically
    // We don't need to set frontendApi as it's determined by your publishable key
  >
    <App />
  </ClerkProvider>
);
