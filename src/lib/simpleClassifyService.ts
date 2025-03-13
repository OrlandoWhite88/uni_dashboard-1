/**
 * A simplified classification service that focuses on reliability over features
 */

// Original API URL
const API_BASE_URL = "https://hscode-eight.vercel.app";

// Alternative CORS proxies - we'll try multiple if needed
const CORS_PROXIES = [
  "https://corsproxy.io/?",  // Try a different proxy first
  "https://cors-anywhere.herokuapp.com/"
];

// For safety, keep mock mode available
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
 * Attempt to call the API with multiple CORS proxies if needed
 */
async function attemptApiCall(endpoint: string, data: any): Promise<any> {
  let lastError = null;
  
  // Try without proxy first (in case CORS is configured on server)
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    console.log("Direct API call failed, trying proxies...");
    lastError = err;
  }
  
  // Try with each proxy
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
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/**
 * Start a classification session with minimal error surface
 */
export async function simpleClassify(product: string): Promise<ClassificationResponse> {
  try {
    if (USE_MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
      return getMockResponse(product);
    }
    
    const result = await attemptApiCall("/classify", {
      product,
      interactive: true,
      max_questions: 3
    });
    
    // Extra validation to ensure we have a usable response
    if (typeof result === "string") {
      return { final_code: result };
    }
    
    if (!result || typeof result !== "object") {
      throw new Error("Invalid response format");
    }
    
    return result;
  } catch (error) {
    console.error("Classification error:", error);
    // Return a fail-safe response rather than throwing
    return {
      state: "error",
      clarification_question: {
        question_text: "There was an error connecting to the classification service. Would you like to try again?",
        options: ["Yes", "No"]
      }
    };
  }
}

/**
 * Continue classification with minimal error surface
 */
export async function simpleContinue(state: string, answer: string): Promise<ClassificationResponse> {
  try {
    if (USE_MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
      return getMockContinuation(answer);
    }
    
    const result = await attemptApiCall("/classify/continue", {
      state,
      answer
    });
    
    // Extra validation to ensure we have a usable response
    if (typeof result === "string") {
      return { final_code: result };
    }
    
    if (!result || typeof result !== "object") {
      throw new Error("Invalid response format");
    }
    
    return result;
  } catch (error) {
    console.error("Continue classification error:", error);
    // Return a fail-safe response rather than throwing
    return {
      state: "error",
      clarification_question: {
        question_text: "There was an error connecting to the classification service. Would you like to try again?",
        options: ["Yes", "No"]
      }
    };
  }
}