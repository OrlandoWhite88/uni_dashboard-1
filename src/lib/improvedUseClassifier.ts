// src/lib/improvedUseClassifier.ts

import { useState, useCallback } from 'react';
import { classifyProduct, continueClassification, ClassificationResponse } from './improvedClassifyService';

// Define the possible states
export type ClassifierState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'question', question: string, options?: string[], state: string }
  | { status: 'result', code: string, description?: string, path?: string, confidence: number }
  | { status: 'error', message: string, details?: string };

/**
 * A React hook for HS code classification with comprehensive error handling
 */
export function useImprovedClassifier() {
  const [state, setState] = useState<ClassifierState>({ status: 'idle' });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  /**
   * Add debug information to the debug log
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
      
      // Call the service
      const response = await classifyProduct(product);
      addDebug(`Received response: ${JSON.stringify(response)}`);
      
      // Handle the response
      handleResponse(response, product);
    } catch (err) {
      // Fallback error handling
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      addDebug(`Classification error: ${errorMsg}`);
      
      setState({ 
        status: 'error', 
        message: 'Failed to classify product',
        details: errorMsg
      });
    }
  }, [addDebug]);
  
  /**
   * Continue the classification with an answer
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
      
      // Call the service
      const response = await continueClassification(state.state, answer);
      addDebug(`Received continuation response: ${JSON.stringify(response)}`);
      
      // Handle the response
      handleResponse(response);
    } catch (err) {
      // Fallback error handling
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      addDebug(`Continue error: ${errorMsg}`);
      
      setState({ 
        status: 'error', 
        message: 'Failed to process answer',
        details: errorMsg
      });
    }
  }, [state, addDebug]);
  
  /**
   * Reset the classifier to idle state
   */
  const reset = useCallback(() => {
    addDebug('Resetting classifier state');
    setState({ status: 'idle' });
    setDebugInfo([]);
  }, [addDebug]);
  
  /**
   * Handle various response formats from the API
   */
  const handleResponse = useCallback((response: ClassificationResponse, productDescription?: string) => {
    // Handle error in response
    if (response.error) {
      addDebug(`Error in response: ${response.error}`);
      setState({
        status: 'error',
        message: 'Service error',
        details: response.error
      });
      return;
    }
    
    // Handle questions/clarifications
    if (response.clarification_question) {
      addDebug(`Received question: ${response.clarification_question.question_text}`);
      setState({
        status: 'question',
        question: response.clarification_question.question_text,
        options: response.clarification_question.options,
        state: response.state || ''
      });
      return;
    }
    
    // Handle final code
    if (response.final_code) {
      addDebug(`Received final code: ${response.final_code}`);
      
      // Calculate a confidence score based on available information
      const hasDescription = !!response.enriched_query;
      const hasPath = !!response.full_path;
      
      // Simple heuristic: more info = more confidence
      const confidence = 70 + (hasDescription ? 15 : 0) + (hasPath ? 15 : 0);
      
      setState({
        status: 'result',
        code: response.final_code,
        description: response.enriched_query || productDescription || 'Product',
        path: response.full_path,
        confidence
      });
      return;
    }
    
    // Fallback for unexpected response format
    addDebug(`Received unexpected response format: ${JSON.stringify(response)}`);
    setState({
      status: 'error',
      message: 'Received unexpected response format',
      details: JSON.stringify(response)
    });
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