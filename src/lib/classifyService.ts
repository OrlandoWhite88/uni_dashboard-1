// src/lib/classifyService.ts

const API_BASE_URL = "https://hscode-eight.vercel.app";

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

/**
 * Start a classification session with a product description
 * This exactly mirrors the classify_product function in the Python script
 */
export const classifyProduct = async (
  productDescription: string, 
  maxQuestions = 3
): Promise<ClassificationResponse | string> => {
  const url = `${API_BASE_URL}/classify`;
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
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    // Try to parse as JSON, fall back to text (exactly as Python does)
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
};

/**
 * Continue an ongoing classification session with an answer
 * This exactly mirrors the continue_classification function in the Python script
 */
export const continueClassification = async (
  state: string, 
  answer: string
): Promise<ClassificationResponse | string> => {
  const url = `${API_BASE_URL}/classify/continue`;
  const payload = {
    state: state,
    answer: answer
  };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    // Try to parse as JSON, fall back to text (exactly as Python does)
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  } catch (error) {
    console.error("Continue classification error:", error);
    throw error;
  }
};