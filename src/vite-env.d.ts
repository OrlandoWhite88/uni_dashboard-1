/// <reference types="vite/client" />

// Add global Stripe type for client-side integration
interface Window {
  Stripe: (key: string) => {
    redirectToCheckout: (options: {
      lineItems: { price: string; quantity: number }[];
      mode: 'subscription' | 'payment';
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
    }) => Promise<{ error?: { message: string } }>;
  };
}
