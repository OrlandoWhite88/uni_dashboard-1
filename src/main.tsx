
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { DevWrapper } from './components/DevWrapper';
import App from './App.tsx';
import './index.css';

// Use the production publishable key
const PUBLISHABLE_KEY = "pk_live_Y2xlcmsudW5pLWN1c3RvbXMuY29tJA";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    // The simplest configuration - let Clerk handle the redirects
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <DevWrapper>
      <App />
    </DevWrapper>
  </ClerkProvider>
);
