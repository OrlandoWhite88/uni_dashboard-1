// Client-only integration for Stripe
// This approach doesn't require a secret key, using only the publishable key

// Get publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_Stripe_Publishable_Key || '';
const STRIPE_PRO_PRICE_ID = 'price_1R31WfRUBtigqfwzgSVyP0Zr';

// Log initialization for debugging
console.log('Stripe client-only initialization:');
console.log(`Publishable Key Set: ${STRIPE_PUBLISHABLE_KEY !== ''}`);
console.log(`Using Price ID: ${STRIPE_PRO_PRICE_ID}`);

// Load Stripe.js script dynamically
let stripePromise: Promise<any> | null = null;
const loadStripe = async () => {
  if (!stripePromise) {
    // Create new promise to load the Stripe.js script
    stripePromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => {
        // @ts-ignore - Stripe is loaded as a global object
        const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        resolve(stripe);
      };
      document.body.appendChild(script);
    });
  }
  return stripePromise;
};

// Customer creation is not supported in client-only integration
// Instead we'll use a mock implementation for the MVP
export async function createCustomer(email: string, name: string): Promise<string> {
  console.log('Creating customer data:', { email, name });
  // Mock customer ID for client-side
  const mockCustomerId = `cus_mock_${Math.random().toString(36).substring(2, 10)}`;
  return mockCustomerId;
}

// Create checkout session using client-only integration
export async function createCheckoutSession(
  customerId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    console.log('Creating checkout session with params:', {
      customerId,
      successUrl,
      cancelUrl,
      priceId: STRIPE_PRO_PRICE_ID
    });

    // Check if we have a publishable key
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.error('Stripe Publishable Key is not set.');
      throw new Error('Stripe Publishable Key not configured. Please check your environment variables.');
    }

    // Load Stripe.js
    const stripe = await loadStripe();
    
    console.log('Redirecting to Stripe Checkout...');
    
    // Redirect to Stripe Checkout directly
    // This is a client-only integration that uses redirectToCheckout
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    });
    
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
    
    // Return a mock session object to maintain API compatibility
    // Note: redirectToCheckout navigates away, so this doesn't actually get returned
    return {
      id: `cs_live_${Math.random().toString(36).substring(2, 10)}`,
      url: '#' // This won't be used as redirectToCheckout handles navigation
    };
  } catch (error) {
    // Enhanced error logging
    console.error('Error creating checkout session:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error object:', error);
    }
    throw error;
  }
}

// Subscription retrieval is not supported in client-only integration
// Use a mock implementation for the MVP
export async function getSubscription(subscriptionId: string) {
  console.log('Getting subscription data for:', subscriptionId);
  
  // Return mock subscription data for client-side
  return {
    id: subscriptionId || `sub_mock_${Math.random().toString(36).substring(2, 10)}`,
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  };
}
