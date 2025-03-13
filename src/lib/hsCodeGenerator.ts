
import { useState } from "react";
import { classifyProduct, continueClassification, ClassificationResponse } from "./api";

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
  const [sessionState, setSessionState] = useState<string | null>(null);
  const [result, setResult] = useState<HSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Start the process with a product description
  const startAnalysis = async (description: string) => {
    setError(null);
    setState("analyzing");
    setProductDescription(description);
    
    try {
      const response = await classifyProduct(description);
      
      if (response.final_code) {
        // Direct result without questions
        setResult({
          code: response.final_code,
          description: response.enriched_query || description,
          confidence: 90, // Default confidence
          enrichedQuery: response.enriched_query,
          fullPath: response.full_path
        });
        setState("complete");
      } else if (response.clarification_question) {
        // Need to ask questions
        setCurrentQuestion({
          id: "question",
          text: response.clarification_question.question_text,
          options: response.clarification_question.options
        });
        setSessionState(response.state || null);
        setState("questioning");
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error starting analysis:", err);
      setError("Failed to analyze product. Please try again.");
      setState("error");
    }
  };
  
  // Handle answering a question
  const answerQuestion = async (questionId: string, answer: string) => {
    if (!sessionState) {
      setError("Session state is missing. Please start over.");
      setState("error");
      return;
    }
    
    setState("analyzing");
    
    try {
      const response = await continueClassification(sessionState, answer);
      
      if (response.final_code) {
        // Got final result
        setResult({
          code: response.final_code,
          description: response.enriched_query || productDescription,
          confidence: 90, // Default confidence
          enrichedQuery: response.enriched_query,
          fullPath: response.full_path
        });
        setState("complete");
      } else if (response.clarification_question) {
        // More questions
        setCurrentQuestion({
          id: "question",
          text: response.clarification_question.question_text,
          options: response.clarification_question.options
        });
        setSessionState(response.state || null);
        setState("questioning");
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error processing answer:", err);
      setError("Failed to process your answer. Please try again.");
      setState("error");
    }
  };
  
  // Reset everything
  const reset = () => {
    setState("idle");
    setProductDescription("");
    setCurrentQuestion(null);
    setSessionState(null);
    setResult(null);
    setError(null);
  };
  
  return {
    state,
    productDescription,
    currentQuestion,
    result,
    error,
    startAnalysis,
    answerQuestion,
    reset
  };
};
