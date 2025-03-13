
import axios from "axios";

const API_BASE_URL = "https://hscode-eight.vercel.app";

export interface ClassificationResponse {
  clarification_question?: {
    question_text: string;
    options?: string[];
  };
  state?: string;
  final_code?: string;
  enriched_query?: string;
  full_path?: string;
}

export const classifyProduct = async (
  productDescription: string,
  maxQuestions = 3
): Promise<ClassificationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/classify`, {
      product: productDescription,
      interactive: true,
      max_questions: maxQuestions,
    });
    
    return response.data;
  } catch (error) {
    console.error("Error classifying product:", error);
    throw error;
  }
};

export const continueClassification = async (
  state: string,
  answer: string
): Promise<ClassificationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/classify/continue`, {
      state,
      answer,
    });
    
    return response.data;
  } catch (error) {
    console.error("Error continuing classification:", error);
    throw error;
  }
};
