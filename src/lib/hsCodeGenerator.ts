// src/lib/hsCodeGenerator.ts
import { useState } from "react";
import { classifyProduct, continueClassification, ClassificationResponse } from "./classifyService";

// Types
export type GeneratorState = "idle" | "analyzing" | "questioning" | "generating" | "complete" | "error";

export interface HSResult {
  code: string;
  description: string;
  confidence: number;
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
    try {
      setState("analyzing");
      setProductDescription(description);
      setError(null);
      
      // Call the classify API endpoint exactly like the Python script
      const response = await classifyProduct(description);
      console.log("API Response:", response); // Debug log
      
      // Handle different response types exactly as in Python script
      if (typeof response === 'string') {
        console.log("String response type detected");
        // If result is a string, it's the final code - exactly as in Python
        setState("generating");
        
        setTimeout(() => {
          const hsResult: HSResult = {
            code: response,
            description: description,
            confidence: 90
          };
          
          setResult(hsResult);
          setState("complete");
        }, 1000);
      } else if ("clarification_question" in response) {
        console.log("Question response detected:", response.clarification_question);
        // If result has clarification_question, ask it - exactly as in Python
        setSessionState(response.state || null);
        
        // Extract the question information
        const questionText = response.clarification_question.question_text;
        const options = response.clarification_question.options;
        
        console.log("Setting question:", { id: "clarification", text: questionText, options });
        
        // Set the current question state
        setCurrentQuestion({
          id: "clarification",
          text: questionText,
          options: options
        });
        
        setState("questioning");
      } else if ("final_code" in response) {
        console.log("Final code response detected");
        // If result has final_code, it's the final classification - exactly as in Python
        setState("generating");
        
        setTimeout(() => {
          const hsResult: HSResult = {
            code: response.final_code,
            description: response.enriched_query || description,
            confidence: 95,
            fullPath: response.full_path
          };
          
          setResult(hsResult);
          setState("complete");
        }, 1000);
      } else {
        // Unexpected response format
        console.error("Unexpected response format:", response);
        throw new Error("Unexpected response format from classification service");
      }
    } catch (err) {
      console.error("Error starting analysis:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  };
  
  // Handle answering a question
  const answerQuestion = async (questionId: string, answer: string) => {
    try {
      setState("analyzing");
      
      if (!sessionState) {
        throw new Error("No active session state");
      }
      
      console.log("Sending answer:", answer, "for session:", sessionState);
      
      // Call the continue API endpoint exactly like the Python script
      const response = await continueClassification(sessionState, answer);
      console.log("Continue API Response:", response); // Debug log
      
      // Handle different response types exactly as in Python script
      if (typeof response === 'string') {
        console.log("String response type detected");
        // If result is a string, it's the final code - exactly as in Python
        setState("generating");
        
        setTimeout(() => {
          const hsResult: HSResult = {
            code: response,
            description: productDescription,
            confidence: 90
          };
          
          setResult(hsResult);
          setState("complete");
        }, 1000);
      } else if ("clarification_question" in response) {
        console.log("Follow-up question detected:", response.clarification_question);
        // If result has clarification_question, ask it - exactly as in Python
        setSessionState(response.state || null);
        
        // Extract the question information
        const questionText = response.clarification_question.question_text;
        const options = response.clarification_question.options;
        
        console.log("Setting question:", { id: "clarification", text: questionText, options });
        
        // Set the current question state
        setCurrentQuestion({
          id: "clarification",
          text: questionText,
          options: options
        });
        
        setState("questioning");
      } else if ("final_code" in response) {
        console.log("Final code response detected");
        // If result has final_code, it's the final classification - exactly as in Python
        setState("generating");
        
        setTimeout(() => {
          const hsResult: HSResult = {
            code: response.final_code,
            description: response.enriched_query || productDescription,
            confidence: 95,
            fullPath: response.full_path
          };
          
          setResult(hsResult);
          setState("complete");
        }, 1000);
      } else {
        // Unexpected response format
        console.error("Unexpected response format:", response);
        throw new Error("Unexpected response format from classification service");
      }
    } catch (err) {
      console.error("Error processing answer:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
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