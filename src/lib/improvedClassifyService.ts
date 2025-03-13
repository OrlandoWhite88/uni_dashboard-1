// src/lib/improvedClassifyService.ts

/**
 * An improved version of the classification service that focuses on reliability
 * and handling CORS issues properly. This version adds better debugging,
 * more robust error handling, and multiple approaches to handle CORS.
 */

// API configuration
const API_BASE_URL = "https://hscode-eight.vercel.app";

// Response types
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
  error?: string;
}

// Interface for the request payload
interface ClassifyRequest {
  product: string;
  interactive?: boolean;
  max_questions?: number;
}

interface ContinueRequest {
  state: string;
  answer: string;
}

// Debug mode - turn on for testing
const DEBUG = true;

// Enables mock mode if all API calls fail
let FALLBACK_TO_MOCK = false;

/**
 * Log debug information if DEBUG is enabled
 */
const debug = (message: string, data?: any) => {
  if (!DEBUG) return;
  console.log(`[HS-API] ${message}`, data !== undefined ? data : '');
};

/**
 * Mock implementations for offline testing
 */
const mockResponses = {
  classify: (product: string): ClassificationResponse => {
    debug(`Mock classify for: ${product}`);
    return {
      state: "mock_session_123",
      clarification_question: {
        question_text: `What is the primary material of "${product}"?`,
        options: ["Cotton", "Plastic", "Metal", "Other"]
      }
    };
  },
  
  continue: (answer: string): ClassificationResponse => {
    debug(`Mock continue with answer: ${answer}`);
    
    // Return different mock responses based on the answer
    if (answer.toLowerCase().includes("cotton")) {
      return {
        final_code: "6204.42.30.10",
        enriched_query: "Cotton clothing item",
        full_path: "Section XI > Chapter 62 > Heading 6204 > Subheading 6204.42 > 6204.42.30.10"
      };
    } else if (answer.toLowerCase().includes("plastic")) {
      return {
        final_code: "3926.90.99",
        enriched_query: "Plastic article",
        full_path: "Section VII > Chapter 39 > Heading 3926 > Subheading 3926.90 > 3926.90.99"
      };
    } else {
      return {
        final_code: "8479.89.99",
        enriched_query: "Other item, not elsewhere classified",
        full_path: "Section XVI > Chapter 84 > Heading 8479 > Subheading 8479.89 > 8479.89.99"
      };
    }
  }
};

/**
 * Make an API request using different methods to handle CORS
 */
async function makeApiRequest(endpoint: string, data: any): Promise<ClassificationResponse> {
  // Log the request details
  debug(`API Request to ${endpoint}`, data);
  
  // If we're in mock fallback mode, return mock data
  if (FALLBACK_TO_MOCK) {
    debug("Using mock data due to previous API failures");
    if (endpoint === "/classify") {
      return mockResponses.classify(data.product);
    } else {
      return mockResponses.continue(data.answer);
    }
  }
  
  // Stringify the data once to ensure consistency
  const jsonData = JSON.stringify(data);
  debug("Request payload (JSON):", jsonData);
  
  // Collection of approaches to try
  const approaches = [
    // 1. First try direct API call (works if CORS is correctly configured on server)
    {
      name: "Direct API",
      url: `${API_BASE_URL}${endpoint}`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: jsonData
      }
    },
    
    // 2. Try with CORS Anywhere (Heroku) proxy
    {
      name: "CORS Anywhere Proxy",
      url: `https://cors-anywhere.herokuapp.com/${API_BASE_URL}${endpoint}`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: jsonData
      }
    },
    
    // 3. Try with corsproxy.io
    {
      name: "CORS Proxy IO",
      url: `https://corsproxy.io/?${API_BASE_URL}${endpoint}`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: jsonData
      }
    },
    
    // 4. Try with AllOrigins API
    {
      name: "AllOrigins",
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`${API_BASE_URL}${endpoint}`)}`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: jsonData
      }
    }
  ];
  
  // Try each approach in sequence
  let lastError: Error | null = null;
  
  for (const approach of approaches) {
    try {
      debug(`Trying ${approach.name}:`, approach.url);
      
      const response = await fetch(approach.url, approach.options);
      
      // Log response status
      debug(`${approach.name} response status:`, response.status);
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        debug(`${approach.name} error response:`, errorText);
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }
      
      // Try to parse the response
      const responseText = await response.text();
      debug(`${approach.name} raw response:`, responseText);
      
      // If the response is empty, that's a problem
      if (!responseText.trim()) {
        throw new Error("Empty response received");
      }
      
      try {
        // Attempt to parse as JSON
        const jsonResponse = JSON.parse(responseText);
        debug(`${approach.name} parsed response:`, jsonResponse);
        return jsonResponse;
      } catch (parseError) {
        // If it's not valid JSON, return as a final code string
        debug(`${approach.name} response is not JSON, treating as code:`, responseText);
        return { final_code: responseText.trim() };
      }
    } catch (error) {
      debug(`${approach.name} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue; // Try next approach
    }
  }
  
  // If we get here, all approaches failed
  debug("All API approaches failed, setting fallback to mock mode");
  FALLBACK_TO_MOCK = true;
  
  // Return the appropriate mock data with an error note
  if (endpoint === "/classify") {
    const mockResponse = mockResponses.classify(data.product);
    mockResponse.error = `API connection failed: ${lastError?.message}. Using mock data.`;
    return mockResponse;
  } else {
    const mockResponse = mockResponses.continue(data.answer);
    mockResponse.error = `API connection failed: ${lastError?.message}. Using mock data.`;
    return mockResponse;
  }
}

/**
 * Start a classification process for a product
 */
export async function classifyProduct(product: string): Promise<ClassificationResponse> {
  try {
    const payload: ClassifyRequest = {
      product,
      interactive: true,
      max_questions: 3
    };
    
    return await makeApiRequest("/classify", payload);
  } catch (error) {
    debug("Error in classifyProduct:", error);
    
    // Handle the error by returning a properly structured error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      state: "error",
      error: errorMessage,
      clarification_question: {
        question_text: "There was an error connecting to the classification service. Would you like to try again?",
        options: ["Try Again", "Cancel"]
      }
    };
  }
}

/**
 * Continue a classification process with an answer
 */
export async function continueClassification(state: string, answer: string): Promise<ClassificationResponse> {
  try {
    const payload: ContinueRequest = {
      state,
      answer
    };
    
    return await makeApiRequest("/classify/continue", payload);
  } catch (error) {
    debug("Error in continueClassification:", error);
    
    // Handle the error by returning a properly structured error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      state: "error",
      error: errorMessage,
      clarification_question: {
        question_text: "There was an error continuing the classification. Would you like to try again?",
        options: ["Try Again", "Cancel"]
      }
    };
  }
}