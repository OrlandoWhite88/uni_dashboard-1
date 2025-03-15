import Stripe from 'stripe';

// Attempt to access environment variables in multiple ways
// For Vite, client-side env vars are exposed on import.meta.env
// Test different formats to find the correct one
console.log('All available environment variables:', import.meta.env);

let STRIPE_SECRET_KEY = 'sk_test_placeholder';
let STRIPE_PUBLISHABLE_KEY = 'pk_test_placeholder';

// Try different possible formats for environment variables
const possibleSecretKeyNames = [
  'Stripe_Secret_Key',
  'STRIPE_SECRET_KEY',
  'VITE_Stripe_Secret_Key',
  'VITE_STRIPE_SECRET_KEY'
];

const possiblePublishableKeyNames = [
  'Stripe_Publishable_Key',
  'STRIPE_PUBLISHABLE_KEY',
  'VITE_Stripe_Publishable_Key',
  'VITE_STRIPE_PUBLISHABLE_KEY'
];

// Check each possible name and use the first one found
for (const name of possibleSecretKeyNames) {
  if (import.meta.env[name]) {
    STRIPE_SECRET_KEY = import.meta.env[name];
    console.log(`Found secret key using name: ${name}`);
    break;
  }
}

for (const name of possiblePublishableKeyNames) {
  if (import.meta.env[name]) {
    STRIPE_PUBLISHABLE_KEY = import.meta.env[name];
    console.log(`Found publishable key using name: ${name}`);
    break;
  }
}

// Product ID and Price ID provided by the user
const STRIPE_PRODUCT_ID = 'prod_RwvNiL4Mq4boQL';
const STRIPE_PRO_PRICE_ID = 'price_1R31WfRUBtigqfwzgSVyP0Zr';

// Log initialization details
console.log('Stripe initialization:');
console.log(`Secret Key Set: ${STRIPE_SECRET_KEY !== 'sk_test_placeholder'}`);
console.log(`Publishable Key Set: ${STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder'}`);
console.log(`Using Product: ${STRIPE_PRODUCT_ID}`);
console.log(`Using Price: ${STRIPE_PRO_PRICE_ID}`);

// Initialize Stripe - in a production app, this would be server-side
// For demo and testing purposes, we're initializing it client-side
// In production, these API calls should go through a secure backend endpoint
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export async function createCustomer(email: string, name: string): Promise<string> {
  try {
    console.log('Creating Stripe customer with info:', { email, name });
    
    // For MVP: If Stripe API key is not available, return mock customer ID
    if (STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      console.warn('Stripe Secret Key not found. Using demo mode for customer creation.');
      const mockCustomerId = `cus_mock_${Math.random().toString(36).substring(2, 10)}`;
      console.log('Created mock customer in demo mode:', mockCustomerId);
      return mockCustomerId;
    }
    
    // Using real Stripe API call with enhanced logging
    console.log('Sending customer creation request to Stripe API...');
    const customer = await stripe.customers.create({ email, name });
    console.log('Customer created successfully with ID:', customer.id);
    return customer.id;
  } catch (error) {
    // Enhanced error logging
    console.error('Error creating customer:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for Stripe-specific error properties
      const stripeError = error as any;
      if (stripeError.type) {
        console.error('Stripe error type:', stripeError.type);
        console.error('Stripe error code:', stripeError.code);
        console.error('Stripe error param:', stripeError.param);
      }
    } else {
      console.error('Unknown error object:', error);
    }
    throw error;
  }
}

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
    
    // For MVP: If Stripe API key is not available, use a demo implementation
    if (STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      console.warn('Stripe Secret Key not found. Using demo mode for checkout.');
      
      // Generate a mock session with a URL that mimics Stripe checkout
      // Redirect to a mock Stripe page first, then redirect to success URL
      const mockSessionId = `cs_mock_${Math.random().toString(36).substring(2, 10)}`;
      const mockSession = {
        id: mockSessionId,
        url: `https://stripe.com/checkout/mock-session?_demo=true&session=${mockSessionId}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`,
      };
      
      console.log('Created mock checkout session in demo mode:', mockSession);
      return mockSession;
    }
    
    // If API key is available, use the real Stripe API
    console.log('Sending request to Stripe API...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url
    });
    
    return session;
  } catch (error) {
    // Enhanced error logging
    console.error('Error creating checkout session:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for Stripe-specific error properties
      const stripeError = error as any;
      if (stripeError.type) {
        console.error('Stripe error type:', stripeError.type);
        console.error('Stripe error code:', stripeError.code);
        console.error('Stripe error param:', stripeError.param);
      }
    } else {
      console.error('Unknown error object:', error);
    }
    
    throw error;
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    console.log('Getting subscription with ID:', subscriptionId);
    
    // For MVP: If Stripe API key is not available, return mock data
    if (STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      console.warn('Stripe Secret Key not found. Using demo mode for subscription data.');
      
      // Return mock subscription data for testing
      return {
        id: subscriptionId || `sub_mock_${Math.random().toString(36).substring(2, 10)}`,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      };
    }
    
    // Using real Stripe API call with enhanced logging
    console.log('Sending subscription retrieval request to Stripe API...');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Subscription retrieved successfully:', {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    });
    return subscription;
  } catch (error) {
    // Enhanced error logging
    console.error('Error getting subscription:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for Stripe-specific error properties
      const stripeError = error as any;
      if (stripeError.type) {
        console.error('Stripe error type:', stripeError.type);
        console.error('Stripe error code:', stripeError.code);
        console.error('Stripe error param:', stripeError.param);
      }
    } else {
      console.error('Unknown error object:', error);
    }
    throw error;
  }
}
