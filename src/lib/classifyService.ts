// src/lib/classifyService.ts

// Original API URL
const API_BASE_URL = "https://hscode-eight.vercel.app";

// Use a CORS proxy to avoid CORS issues when calling from a browser
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

// Set to false to use the real API with a CORS proxy
const USE_MOCK_DATA = false;

// Same interface as the Python script response types
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

// Mock data for demo mode
const mockQuestions: Record<string, ClassificationQuestion> = {
  "first": {
    question_text: "Can you provide more details about the product? What is it made of?",
    options: ["Cotton", "Wool", "Plastic", "Metal", "Wood", "Other"]
  },
  "second": {
    question_text: "What is the main purpose of this product?",
    options: ["Clothing", "Electronics", "Food", "Construction", "Medical", "Other"]
  },
  "third": {
    question_text: "Is this product ready for retail sale or does it require further processing?",
    options: ["Ready for retail", "Requires processing", "Not sure"]
  }
};

// Mock classification logic
const mockClassify = (product: string): ClassificationResponse => {
  // Convert to lowercase for easier matching
  const lowerProduct = product.toLowerCase();
  
  // Start with first question
  return {
    state: "session_1",
    clarification_question: mockQuestions.first
  };
};

// Mock continuation logic
const mockContinue = (state: string, answer: string): ClassificationResponse | string => {
  // Simple state machine to move through questions
  if (state === "session_1") {
    return {
      state: "session_2",
      clarification_question: mockQuestions.second
    };
  } else if (state === "session_2") {
    return {
      state: "session_3",
      clarification_question: mockQuestions.third
    };
  } else {
    // Final answer after the last question
    const material = answer.toLowerCase();
    
    // Different codes based on input
    if (material.includes("cotton") || material.includes("clothing") || material.includes("retail")) {
      return {
        final_code: "6204.42.30.10",
        enriched_query: "Cotton dress, ready for retail sale",
        full_path: "Section XI > Chapter 62 > Heading 6204 > Subheading 6204.42 > 6204.42.30.10"
      };
    } else if (material.includes("metal") || material.includes("electronics")) {
      return {
        final_code: "8517.12.00.00",
        enriched_query: "Electronic device with metal casing",
        full_path: "Section XVI > Chapter 85 > Heading 8517 > Subheading 8517.12 > 8517.12.00.00"
      };
    } else if (material.includes("plastic")) {
      return {
        final_code: "3926.40.00.00",
        enriched_query: "Plastic decorative article",
        full_path: "Section VII > Chapter 39 > Heading 3926 > Subheading 3926.40 > 3926.40.00.00"
      };
    } else {
      return {
        final_code: "9705.31.00.00",
        enriched_query: "Various merchandise article",
        full_path: "Section XXI > Chapter 97 > Heading 9705 > Subheading 9705.31 > 9705.31.00.00"
      };
    }
  }
};

/**
 * Start a classification session with a product description
 */
export const classifyProduct = async (
  productDescription: string, 
  maxQuestions = 3
): Promise<ClassificationResponse | string> => {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    console.log("Using mock data for product classification");
    // Short delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockClassify(productDescription);
  }
  
  // Use CORS proxy with the API URL
  const url = `${CORS_PROXY}${API_BASE_URL}/classify`;
  console.log(`Making API request to: ${url}`);
  
  const payload = {
    product: productDescription,
    interactive: true,
    max_questions: maxQuestions
  };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain",
        "X-Requested-With": "XMLHttpRequest", // Required by some CORS proxies
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    
    // Log raw response for debugging
    const responseText = await response.text();
    console.log("Raw API response:", responseText);
    
    // Try to parse as JSON
    try {
      // We need to parse the response text since we already consumed it above
      const parsedResponse = JSON.parse(responseText);
      console.log("Parsed response:", parsedResponse);
      return parsedResponse;
    } catch (e) {
      console.log("Response is not JSON, treating as text");
      return responseText;
    }
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
};

/**
 * Continue an ongoing classification session with an answer
 */
export const continueClassification = async (
  state: string, 
  answer: string
): Promise<ClassificationResponse | string> => {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    console.log("Using mock data for classification continuation");
    // Short delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockContinue(state, answer);
  }
  
  // Use CORS proxy with the API URL
  const url = `${CORS_PROXY}${API_BASE_URL}/classify/continue`;
  console.log(`Making continuation API request to: ${url}`);
  
  const payload = {
    state: state,
    answer: answer
  };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain",
        "X-Requested-With": "XMLHttpRequest", // Required by some CORS proxies
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    
    // Log raw response for debugging
    const responseText = await response.text();
    console.log("Raw API response:", responseText);
    
    // Try to parse as JSON
    try {
      // We need to parse the response text since we already consumed it above
      const parsedResponse = JSON.parse(responseText);
      console.log("Parsed response:", parsedResponse);
      return parsedResponse;
    } catch (e) {
      console.log("Response is not JSON, treating as text");
      return responseText;
    }
  } catch (error) {
    console.error("Continue classification error:", error);
    throw error;
  }
};