// Types for API responses
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
 */
export const classifyProduct = async (productDescription: string, maxQuestions = 3): Promise<ClassificationResponse> => {
  try {
    const response = await fetch("https://hscode-eight.vercel.app/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product: productDescription,
        interactive: true,
        max_questions: maxQuestions,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
};

/**
 * Continue an ongoing classification session with an answer
 */
export const continueClassification = async (state: string, answer: string): Promise<ClassificationResponse> => {
  try {
    const response = await fetch("https://hscode-eight.vercel.app/classify/continue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
        answer,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Continue classification error:", error);
    throw error;
  }
};
