
import { HSResult, Question } from "./hsCodeGenerator";

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

export const classifyProduct = async (productDescription: string, maxQuestions: number = 3): Promise<ClassificationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: productDescription,
        interactive: true,
        max_questions: maxQuestions
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
};

export const continueClassification = async (state: string, answer: string): Promise<ClassificationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/classify/continue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: state,
        answer: answer
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Continue classification error:", error);
    throw error;
  }
};
