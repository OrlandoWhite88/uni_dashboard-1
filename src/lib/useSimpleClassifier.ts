import { useState, useCallback } from 'react';
import { simpleClassify, simpleContinue, ClassificationResponse } from './simpleClassifyService';

// Define the possible states
type ClassifierState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'question', question: string, options?: string[], state: string }
  | { status: 'result', code: string, description?: string, path?: string }
  | { status: 'error', message: string };

/**
 * A simplified React hook for HS code classification
 */
export function useSimpleClassifier() {
  const [state, setState] = useState<ClassifierState>({ status: 'idle' });
  
  /**
   * Start the classification process
   */
  const classify = useCallback(async (product: string) => {
    try {
      // Set loading state
      setState({ status: 'loading' });
      
      // Call the service
      const response = await simpleClassify(product);
      handleResponse(response, product);
    } catch (err) {
      // Fallback error handling
      console.error('Classification error:', err);
      setState({ 
        status: 'error', 
        message: err instanceof Error ? err.message : 'Unknown error occurred' 
      });
    }
  }, []);
  
  /**
   * Continue the classification with an answer
   */
  const continueWithAnswer = useCallback(async (answer: string) => {
    // Only proceed if we're in question state
    if (state.status !== 'question') {
      console.error('Cannot continue - not in question state');
      return;
    }
    
    try {
      // Set loading state
      setState({ status: 'loading' });
      
      // Call the service
      const response = await simpleContinue(state.state, answer);
      handleResponse(response);
    } catch (err) {
      // Fallback error handling
      console.error('Continue error:', err);
      setState({ 
        status: 'error', 
        message: err instanceof Error ? err.message : 'Unknown error occurred' 
      });
    }
  }, [state]);
  
  /**
   * Reset the classifier to idle state
   */
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);
  
  /**
   * Handle various response formats from the API
   */
  const handleResponse = useCallback((response: ClassificationResponse | string, productDescription?: string) => {
    console.log('Handling response:', response);
    
    // Handle string response (direct HS code)
    if (typeof response === 'string') {
      setState({
        status: 'result',
        code: response,
        description: productDescription || 'Product'
      });
      return;
    }
    
    // Handle object response
    if (response) {
      // Error state handling
      if (response.state === 'error') {
        setState({
          status: 'error',
          message: 'Service error occurred'
        });
        return;
      }
      
      // Question handling
      if (response.clarification_question) {
        setState({
          status: 'question',
          question: response.clarification_question.question_text,
          options: response.clarification_question.options,
          state: response.state || ''
        });
        return;
      }
      
      // Final code handling
      if (response.final_code) {
        setState({
          status: 'result',
          code: response.final_code,
          description: response.enriched_query || productDescription || 'Product',
          path: response.full_path
        });
        return;
      }
    }
    
    // Fallback for unexpected response format
    setState({
      status: 'error',
      message: 'Received unexpected response format'
    });
  }, []);
  
  // Return the state and functions
  return { state, classify, continueWithAnswer, reset };
}