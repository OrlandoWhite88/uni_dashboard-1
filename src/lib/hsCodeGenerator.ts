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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Utility to set debug info
  const addDebugInfo = (info: string) => {
    console.log("DEBUG:", info);
    setDebugInfo(prevInfo => prevInfo ? `${prevInfo}\n${info}` : info);
  };
  
  // Start the process with a product description
  const startAnalysis = async (description: string) => {
    try {
      setError(null);
      setDebugInfo(null);
      setState("analyzing");
      setProductDescription(description);
      
      addDebugInfo(`Starting analysis for: ${description}`);
      
      // Call the classify API endpoint
      const response = await classifyProduct(description);
      addDebugInfo(`Received API response type: ${typeof response}`);
      
      // Handle different response types
      if (typeof response === 'string') {
        addDebugInfo(`String response received: ${response}`);
        // If result is a string, it's the final code
        const hsResult: HSResult = {
          code: response,
          description: description,
          confidence: 90
        };
        
        setResult(hsResult);
        setState("complete");
      } else if (response && typeof response === 'object') {
        if ("clarification_question" in response && response.clarification_question) {
          // If result has clarification_question, ask it
          addDebugInfo(`Question received: ${response.clarification_question.question_text}`);
          setSessionState(response.state || null);
          
          // Create a properly formed question object
          const newQuestion: Question = {
            id: "clarification",
            text: response.clarification_question.question_text || "Please provide more information",
            options: response.clarification_question.options || []
          };
          
          setCurrentQuestion(newQuestion);
          setState("questioning");
        } else if ("final_code" in response) {
          // If result has final_code, it's the final classification
          addDebugInfo(`Final code received: ${response.final_code}`);
          const hsResult: HSResult = {
            code: response.final_code || "Unknown",
            description: response.enriched_query || description,
            confidence: 95,
            fullPath: response.full_path
          };
          
          setResult(hsResult);
          setState("complete");
        } else {
          // Unexpected response format
          throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
        }
      } else {
        // Unexpected response type
        throw new Error(`Unexpected response type: ${typeof response}`);
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
      
      addDebugInfo(`Sending answer: "${answer}" for session: ${sessionState}`);
      
      // Call the continue API endpoint
      const response = await continueClassification(sessionState, answer);
      addDebugInfo(`Received continuation response type: ${typeof response}`);
      
      // Handle different response types
      if (typeof response === 'string') {
        addDebugInfo(`String response received: ${response}`);
        // If result is a string, it's the final code
        const hsResult: HSResult = {
          code: response,
          description: productDescription,
          confidence: 90
        };
        
        setResult(hsResult);
        setState("complete");
      } else if (response && typeof response === 'object') {
        if ("clarification_question" in response && response.clarification_question) {
          // If result has clarification_question, ask it
          addDebugInfo(`Follow-up question received: ${response.clarification_question.question_text}`);
          setSessionState(response.state || null);
          
          // Create a properly formed question object
          const newQuestion: Question = {
            id: "clarification",
            text: response.clarification_question.question_text || "Please provide more information",
            options: response.clarification_question.options || []
          };
          
          setCurrentQuestion(newQuestion);
          setState("questioning");
        } else if ("final_code" in response) {
          // If result has final_code, it's the final classification
          addDebugInfo(`Final code received: ${response.final_code}`);
          const hsResult: HSResult = {
            code: response.final_code || "Unknown",
            description: response.enriched_query || productDescription,
            confidence: 95,
            fullPath: response.full_path
          };
          
          setResult(hsResult);
          setState("complete");
        } else {
          // Unexpected response format
          throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
        }
      } else {
        // Unexpected response type
        throw new Error(`Unexpected response type: ${typeof response}`);
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
    setDebugInfo(null);
  };
  
  return {
    state,
    productDescription,
    currentQuestion,
    result,
    error,
    debugInfo,
    startAnalysis,
    answerQuestion,
    reset
  };
};