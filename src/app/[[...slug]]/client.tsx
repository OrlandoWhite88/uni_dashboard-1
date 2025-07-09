'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ClerkProvider } from '@clerk/clerk-react'

const App = dynamic(() => import('../../App'), { ssr: false })

// Use the publishable key from environment variables
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key - check your .env.local file");
}

export function ClientOnly() {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <App />
    </ClerkProvider>
  )
}
