import { useState } from "react";
import { classifyProduct, continueClassification, ClassificationResponse } from "./apiService";
import { toast } from "sonner";

// Types
export type GeneratorState = "idle" | "analyzing" | "questioning" | "generating" | "complete" | "error";

export interface HSResult {
  code: string;
  description: string;
  confidence: number;
  enrichedQuery?: string;
  fullPath?: string;
}

export interface Question {
  id: string;
  text: string;
  options?: string[];
}

export const useHSCodeGenerator = () => {
  const [state, setState] = useState<GeneratorState>("idle");
  const [productDescription, setProductDescription] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [sessionState, setSessionState] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<HSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Start the process with a product description
  const startAnalysis = async (description: string) => {
    try {
      setState("analyzing");
      setProductDescription(description);
      setError(null);
      
      const response = await classifyProduct(description);
      
      // Check if we already got a final code
      if (response.final_code) {
        const hsResult: HSResult = {
          code: response.final_code,
          description: response.full_path || "No detailed description available",
          confidence: 90, // API doesn't provide confidence, set a default
          enrichedQuery: response.enriched_query,
          fullPath: response.full_path
        };
        
        setResult(hsResult);
        setState("complete");
        return;
      }
      
      // Otherwise, we have a question to ask
      if (response.clarification_question) {
        setSessionState(response.state || "");
        setCurrentQuestion({
          id: "api_question",
          text: response.clarification_question.question_text,
          options: response.clarification_question.options
        });
        setState("questioning");
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
      toast.error("Failed to analyze product. Please try again.");
      setError("Failed to analyze product");
      setState("error");
    }
  };
  
  // Handle answering a question
  const answerQuestion = async (questionId: string, answer: string) => {
    try {
      setState("analyzing");
      
      // Save the answer
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
      
      // Send answer to the API
      const response = await continueClassification(sessionState, answer);
      
      // Check if we got a final result
      if (response.final_code) {
        const hsResult: HSResult = {
          code: response.final_code,
          description: response.full_path || "No detailed description available",
          confidence: 90, // API doesn't provide confidence, set a default
          enrichedQuery: response.enriched_query,
          fullPath: response.full_path
        };
        
        setResult(hsResult);
        setState("complete");
        return;
      }
      
      // Otherwise, we have another question
      if (response.clarification_question) {
        setSessionState(response.state || "");
        setCurrentQuestion({
          id: "api_question",
          text: response.clarification_question.question_text,
          options: response.clarification_question.options
        });
        setState("questioning");
      } else {
        // If no question and no final code, something went wrong
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error answering question:", error);
      toast.error("Failed to process your answer. Please try again.");
      setError("Failed to process your answer");
      setState("error");
    }
  };
  
  // Reset everything
  const reset = () => {
    setState("idle");
    setProductDescription("");
    setCurrentQuestion(null);
    setSessionState("");
    setAnswers({});
    setResult(null);
    setError(null);
  };
  
  return {
    state,
    productDescription,
    currentQuestion,
    answers,
    result,
    error,
    startAnalysis,
    answerQuestion,
    reset
  };
};
