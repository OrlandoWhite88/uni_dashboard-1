// src/lib/classifierService.ts

/**
 * A direct implementation of the HS Code classification service
 * that matches the Python implementation exactly.
 */

import { useState, useCallback } from 'react';

// API configuration - The endpoint for the classification service
const API_BASE_URL = "https://hscode-eight.vercel.app";
// const API_BASE_URL = "http://localhost:8000"; // Uncomment for local testing

// Enable debug logs for development
const DEBUG = true;

// Response type definitions
export interface OptionItem {
  id: string;
  text: string;
}

export interface ClassificationQuestion {
  question_type?: string;
  question_text: string;
  options?: OptionItem[] | string[];
  metadata?: any;
}

export interface ClassificationResponse {
  state?: any;
  clarification_question?: ClassificationQuestion;
  final_code?: string;
  enriched_query?: string;
  full_path?: string;
  final?: boolean;
}

/**
 * Log debug information
 */
const logDebug = (message: string, data?: any) => {
  if (!DEBUG) return;
  if (data) {
    console.log(`[HS-API] ${message}`, data);
  } else {
    console.log(`[HS-API] ${message}`);
  }
};

/**
 * Start a classification session - this mimics the Python classify_product function
 */
export async function classifyProduct(productDescription: string, maxQuestions: number = 3): Promise<any> {
  logDebug(`Starting classification for: "${productDescription}"`);
  
  const url = `${API_BASE_URL}/classify`;
  const payload = {
    product: productDescription,
    interactive: true,
    max_questions: maxQuestions
  };
  
  try {
    // Use POST request with JSON body exactly like the Python implementation
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      // Add mode: 'cors' for CORS requests
      mode: 'cors'
    });
    
    logDebug(`Response status: ${response.status}`);
    
    // Handle error responses
    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    
    // Try to parse as JSON first (most responses will be JSON)
    const text = await response.text();
    logDebug(`Raw response: ${text}`);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not JSON, return as plain text (could be a direct HS code)
      return text;
    }
  } catch (error) {
    logDebug(`Classification error: ${error.message}`);
    throw error;
  }
}

/**
 * Continue classification with answer - this mimics the Python continue_classification function
 */
export async function continueClassification(state: any, answer: string): Promise<any> {
  logDebug(`Continuing classification with answer: "${answer}"`);
  
  const url = `${API_BASE_URL}/classify/continue`;
  const payload = {
    state: state,
    answer: answer
  };
  
  try {
    // Use POST request with JSON body exactly like the Python implementation
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      // Add mode: 'cors' for CORS requests
      mode: 'cors'
    });
    
    logDebug(`Response status: ${response.status}`);
    
    // Handle error responses
    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    
    // Try to parse as JSON first
    const text = await response.text();
    logDebug(`Raw response: ${text}`);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not JSON, return as plain text (could be a direct HS code)
      return text;
    }
  } catch (error) {
    logDebug(`Continue classification error: ${error.message}`);
    throw error;
  }
}

// Define the possible states
export type ClassifierState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'question', question: string, options?: string[], state: any }
  | { status: 'result', code: string, description?: string, path?: string, confidence: number }
  | { status: 'error', message: string, details?: string };

/**
 * React hook for using the classifier in components
 */
export function useClassifier() {
  const [state, setState] = useState<ClassifierState>({ status: 'idle' });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  /**
   * Add debug information to the log
   */
  const addDebug = useCallback((message: string) => {
    console.log(`[Classifier] ${message}`);
    setDebugInfo(prev => [...prev, message]);
  }, []);
  
  /**
   * Start the classification process
   */
  const classify = useCallback(async (product: string) => {
    try {
      // Clear previous debug info
      setDebugInfo([]);
      addDebug(`Starting classification for: ${product}`);
      
      // Set loading state
      setState({ status: 'loading' });
      
      // Call the API to classify the product
      const result = await classifyProduct(product);
      addDebug(`Received API response: ${JSON.stringify(result, null, 2)}`);
      addDebug(`Response type: ${typeof result}`);
      
      // Process the result exactly like the Python script does
      processApiResponse(result, product);
    } catch (err) {
      // Handle errors
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      addDebug(`Classification error: ${errorMsg}`);
      
      setState({ 
        status: 'error', 
        message: 'Classification Error',
        details: errorMsg
      });
    }
  }, [addDebug]);
  
  /**
   * Process an answer to a question and continue classification
   */
  const continueWithAnswer = useCallback(async (answer: string) => {
    // Only proceed if we're in question state
    if (state.status !== 'question') {
      addDebug(`Cannot continue - not in question state (current state: ${state.status})`);
      return;
    }
    
    try {
      addDebug(`Continuing with answer: ${answer}`);
      
      // Set loading state
      setState({ status: 'loading' });
      
      // Call the API to continue classification
      const result = await continueClassification(state.state, answer);
      addDebug(`Received continuation response: ${JSON.stringify(result, null, 2)}`);
      addDebug(`Response type: ${typeof result}`);
      
      // Process the result exactly like the Python script does
      processApiResponse(result);
    } catch (err) {
      // Handle errors
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      addDebug(`Continue error: ${errorMsg}`);
      
      setState({ 
        status: 'error', 
        message: 'Error Processing Answer',
        details: errorMsg
      });
    }
  }, [state, addDebug]);
  
  /**
   * Process the API response following the same logic as the Python script
   */
  const processApiResponse = useCallback((result: any, productDescription?: string) => {
    // Detailed logging of the result for debugging
    addDebug(`Processing API response: ${JSON.stringify(result, null, 2)}`);
    
    // If result is a string, it's the final code
    if (typeof result === 'string') {
      addDebug(`Received final code as string: ${result}`);
      setState({
        status: 'result',
        code: result,
        description: productDescription || "Product",
        confidence: 85 // We don't have more info, so use a reasonable default
      });
      return;
    }
    
    // If result has clarification_question, ask it
    if (result && typeof result === 'object' && "clarification_question" in result) {
      // Log the structure of the clarification question
      addDebug(`Clarification question structure: ${JSON.stringify(result.clarification_question, null, 2)}`);
      
      // Get the question text safely
      let questionText = "Please provide more information about your product";
      if (result.clarification_question && 
          typeof result.clarification_question.question_text === 'string') {
        questionText = result.clarification_question.question_text;
      } else if (result.clarification_question) {
        // If it's not a string, try to make a string representation
        try {
          questionText = JSON.stringify(result.clarification_question.question_text);
          addDebug(`Converted non-string question to: ${questionText}`);
        } catch (e) {
          addDebug(`Could not stringify question: ${e}`);
        }
      }
      
      // Get options safely - transform objects with id/text to strings (just text)
      let options: string[] = [];
      if (result.clarification_question && 
          Array.isArray(result.clarification_question.options)) {
          
        // Process each option - could be a string or an object with id/text
        options = result.clarification_question.options.map(opt => {
          // If the option is an object with a text property, extract just the text
          if (opt && typeof opt === 'object' && 'text' in opt) {
            return String(opt.text);
          }
          // Otherwise, convert to string
          return String(opt);
        });
        
        addDebug(`Processed options: ${JSON.stringify(options)}`);
      }
      
      // Get state safely - this could be a string or an object
      const sessionState = result.state;
      addDebug(`Session state type: ${typeof sessionState}`);
      
      setState({
        status: 'question',
        question: questionText,
        options: options,
        state: sessionState
      });
      
      return;
    }
    
    // If result has final_code, it's the final classification
    if (result && typeof result === 'object' && "final_code" in result) {
      addDebug(`Received final code in JSON: ${result.final_code}`);
      
      // Calculate a confidence score based on available information
      const hasDescription = !!result.enriched_query;
      const hasPath = !!result.full_path;
      
      // Simple heuristic: more info = more confidence
      const confidence = 70 + (hasDescription ? 15 : 0) + (hasPath ? 15 : 0);
      
      setState({
        status: 'result',
        code: typeof result.final_code === 'string' ? result.final_code : String(result.final_code || "Unknown"),
        description: typeof result.enriched_query === 'string' 
          ? result.enriched_query 
          : (productDescription || "Product"),
        path: typeof result.full_path === 'string' ? result.full_path : undefined,
        confidence
      });
      return;
    }
    
    // If we get here, we don't understand the response format
    addDebug(`Unexpected response format: ${JSON.stringify(result, null, 2)}`);
    setState({
      status: 'error',
      message: 'Unexpected Response',
      details: `The API returned a response in an unexpected format: ${JSON.stringify(result, null, 2)}`
    });
  }, [addDebug]);
  
  /**
   * Reset the classifier to idle state
   */
  const reset = useCallback(() => {
    addDebug('Resetting classifier state');
    setState({ status: 'idle' });
    setDebugInfo([]);
  }, [addDebug]);
  
  // Return the state, functions and debug info
  return { 
    state, 
    classify, 
    continueWithAnswer, 
    reset,
    debugInfo 
  };
}