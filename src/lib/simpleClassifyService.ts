/**
 * A simplified classification service that focuses on reliability over features
 */

// Original API URL
const API_BASE_URL = "https://hscode-eight.vercel.app";

// CORS proxy configuration - Heroku CORS Anywhere worked well
const CORS_PROXIES = [
  "https://cors-anywhere.herokuapp.com/", // Primary (working) proxy
  "https://corsproxy.io/?",               // Backup option 1
  "https://api.allorigins.win/raw?url="   // Backup option 2
];

// For safety, keep mock mode available but disabled by default
const USE_MOCK_MODE = false;

// Basic types for the responses
export interface ClassificationQuestion {
  question_text: string;
  options?: string[];
}

export interface ClassificationResponse {
  state?: string;
  clarification_question?: ClassificationQuestion;
  final_code?: string;
  enriched_query?: string;
  full_path?: string;
  error?: string; // Added for error details
}

// Simple mock implementation
const getMockResponse = (product: string): ClassificationResponse => {
  return {
    state: "mock_session",
    clarification_question: {
      question_text: "What is the primary material of your product?",
      options: ["Cotton", "Plastic", "Metal", "Other"]
    }
  };
};

const getMockContinuation = (answer: string): ClassificationResponse => {
  return {
    final_code: "6204.42.30.10",
    enriched_query: "Cotton dress, for testing purposes",
    full_path: "Section XI > Chapter 62 > Heading 6204 > Subheading 6204.42 > 6204.42.30.10"
  };
};

/**
 * Attempt to call the API with CORS proxy
 */
async function attemptApiCall(endpoint: string, data: any): Promise<any> {
  let lastError = null;
  console.log(`Attempting API call to ${endpoint} with data:`, data);
  
  // Try direct call first - though unlikely to work due to CORS
  try {
    const directUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Trying direct API call to: ${directUrl}`);
    const response = await fetch(directUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      return await parseApiResponse(response);
    }
  } catch (err) {
    console.log("Direct API call failed, trying proxy...");
    lastError = err;
  }
  
  // Try with each proxy, prioritizing the Heroku CORS Anywhere that worked
  for (const proxy of CORS_PROXIES) {
    try {
      const url = `${proxy}${API_BASE_URL}${endpoint}`;
      console.log(`Trying with proxy: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"  // Required by some proxies
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return await parseApiResponse(response);
      }
    } catch (err) {
      console.warn(`Proxy ${proxy} failed:`, err);
      lastError = err;
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error("All API attempts failed");
}

/**
 * Parse API response, handling both JSON and text formats
 */
async function parseApiResponse(response: Response): Promise<any> {
  const text = await response.text();
  console.log("Raw API response:", text);
  
  try {
    const parsed = JSON.parse(text);
    console.log("Parsed JSON response:", parsed);
    return parsed;
  } catch (e) {
    console.log("Response is not JSON, treating as text:", text);
    return text;
  }
}

/**
 * Start a classification session
 */
export async function simpleClassify(product: string): Promise<ClassificationResponse> {
  try {
    if (USE_MOCK_MODE) {
      return getMockResponse(product);
    }
    
    const result = await attemptApiCall("/classify", {
      product,
      interactive: true,
      max_questions: 3
    });
    
    // Handle string response (direct HS code)
    if (typeof result === "string") {
      return { final_code: result };
    }
    
    // Handle object response
    if (result && typeof result === "object") {
      return result;
    }
    
    throw new Error("Unexpected response format");
  } catch (error) {
    console.error("Classification error:", error);
    // Return a fail-safe response with error details
    return {
      state: "error",
      error: error instanceof Error ? error.message : 'Unknown error',
      clarification_question: {
        question_text: "There was an error connecting to the classification service. Would you like to try again?",
        options: ["Try Again", "Cancel"]
      }
    };
  }
}

/**
 * Continue classification with an answer
 */
export async function simpleContinue(state: string, answer: string): Promise<ClassificationResponse> {
  try {
    if (USE_MOCK_MODE) {
      return getMockContinuation(answer);
    }
    
    const result = await attemptApiCall("/classify/continue", {
      state,
      answer
    });
    
    // Handle string response (direct HS code)
    if (typeof result === "string") {
      return { final_code: result };
    }
    
    // Handle object response
    if (result && typeof result === "object") {
      return result;
    }
    
    throw new Error("Unexpected response format");
  } catch (error) {
    console.error("Continue classification error:", error);
    // Return a fail-safe response with error details
    return {
      state: "error",
      error: error instanceof Error ? error.message : 'Unknown error',
      clarification_question: {
        question_text: "There was an error continuing the classification. Would you like to try again?",
        options: ["Try Again", "Cancel"]
      }
    };
  }
}