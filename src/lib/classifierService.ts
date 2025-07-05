// src/lib/classifierService.ts

/**
 * A direct implementation of the HS Code classification service
 * that matches the Python implementation exactly.
 */

import { useState, useCallback, useRef } from "react";
import { logUsage, saveClassification } from "@/lib/supabaseService";
import { useAuth } from "@clerk/clerk-react";
import { trackClassificationResult } from "@/lib/analyticsService";

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
  question_type: "text" | "multiple_choice";
  question_text: string;
  options?: OptionItem[];
  metadata?: any;
}

export interface ClassificationState {
  product: string;
  original_query: string;
  current_query: string;
  questions_asked: number;
  selection: any;
  current_node: any;
  classification_path: any[];
  steps: any[];
  conversation: any[];
  pending_question: any;
  pending_stage: string;
  max_questions: number;
  visited_nodes: any[];
  history: any[];
  product_attributes: Record<string, any>;
  recent_questions: any[];
}

export interface ClassificationResponse {
  final: boolean;
  // For non-final responses (questions)
  clarification_question?: ClassificationQuestion;
  state?: ClassificationState;
  // For final responses
  original_query?: string;
  enriched_query?: string;
  classification?: {
    chapter: string;
    heading: string;
    subheading: string;
    tariff: string;
    code?: string;
    path?: string;
    log_score?: number;
    confidence?: number;
  };
  final_code?: string;
  full_path?: string;
  steps?: any[];
  conversation?: any[];
  explanation?: string;
  is_complete?: boolean;
  visited_nodes?: any[];
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
export async function classifyProduct(
  productDescription: string,
  maxQuestions: number = 5,
  model: 'vertex' | 'groq' = 'vertex'
): Promise<ClassificationResponse | string> {
  logDebug(`Starting classification for: "${productDescription}" using ${model} model`);

  // Determine the endpoint based on the selected model
  const endpoint = model === 'groq' ? '/classify-groq' : '/classify';
  const url = `${API_BASE_URL}${endpoint}`;
  const payload = {
    product: productDescription,
    interactive: true,
    max_questions: maxQuestions,
  };

  try {
    // Use POST request with JSON body exactly like the Python implementation
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // Add mode: 'cors' for CORS requests
      mode: "cors",
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
      // Parse the JSON response
      const result = JSON.parse(text);
      
      // Validate that we got a properly formatted response
      if (typeof result === 'object' && result !== null) {
        // Check if it has the expected 'final' flag
        if ("final" in result) {
          logDebug(`Response has 'final' flag: ${result.final}`);
          
          // If this is a clarification question (non-final response)
          if (result.final === false && result.clarification_question) {
            logDebug(`Got clarification question response with state`);
          } 
          // If this is a final classification
          else if (result.final === true) {
            logDebug(`Got final classification response`);
          }
        } else {
          logDebug(`Response missing 'final' flag, assuming legacy format`);
        }
      }
      
      return result;
    } catch (e) {
      // If not JSON, return as plain text (could be a direct HS code)
      logDebug(`Response is not JSON, treating as plain text`);
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
export async function continueClassification(
  state: ClassificationState | any,
  answer: string,
  model: 'vertex' | 'groq' = 'vertex'
): Promise<ClassificationResponse | string> {
  logDebug(`Continuing classification with answer: "${answer}" using ${model} model`);

  // Determine the endpoint based on the selected model
  const endpoint = model === 'groq' ? '/classify-groq/continue' : '/classify/continue';
  const url = `${API_BASE_URL}${endpoint}`;
  const payload = {
    state: state, // Pass the entire state object without modification
    answer: answer,
  };

  try {
    // Use POST request with JSON body exactly like the Python implementation
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // Add mode: 'cors' for CORS requests
      mode: "cors",
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
      // Parse the JSON response
      const result = JSON.parse(text);
      
      // Validate that we got a properly formatted response
      if (typeof result === 'object' && result !== null) {
        // Check if it has the expected 'final' flag
        if ("final" in result) {
          logDebug(`Response has 'final' flag: ${result.final}`);
          
          // If this is a clarification question (non-final response)
          if (result.final === false && result.clarification_question) {
            logDebug(`Got clarification question response with state`);
          } 
          // If this is a final classification
          else if (result.final === true) {
            logDebug(`Got final classification response`);
          }
        } else {
          logDebug(`Response missing 'final' flag, assuming legacy format`);
        }
      }
      
      return result;
    } catch (e) {
      // If not JSON, return as plain text (could be a direct HS code)
      logDebug(`Response is not JSON, treating as plain text`);
      return text;
    }
  } catch (error) {
    logDebug(`Continue classification error: ${error.message}`);
    throw error;
  }
}

/**
 * Restart classification with a forced path
 */
export async function restartClassification(
  productDescription: string,
  forcedPath: Array<{ code: string; description: string }>,
  model: 'vertex' | 'groq' = 'vertex'
): Promise<ClassificationResponse | string> {
  logDebug(`Restarting classification with forced path: ${JSON.stringify(forcedPath)}`);

  // Determine the endpoint based on the selected model
  const endpoint = model === 'groq' ? '/classify-groq/restart' : '/classify/restart';
  const url = `${API_BASE_URL}${endpoint}`;
  const payload = {
    product: productDescription,
    forced_path: forcedPath,
    interactive: true,
    max_questions: 3,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      mode: "cors",
    });

    logDebug(`Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }

    const text = await response.text();
    logDebug(`Raw response: ${text}`);

    try {
      const result = JSON.parse(text);
      return result;
    } catch (e) {
      logDebug(`Response is not JSON, treating as plain text`);
      return text;
    }
  } catch (error) {
    logDebug(`Restart classification error: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch tariff information for a given HS code
 *
 * Uses the new tariff_details endpoint which returns a more comprehensive
 * set of tariff data from the tariff.xlsx file
 */
export async function getTariffInfo(hsCode: string): Promise<any> {
  logDebug(`Fetching tariff info for: ${hsCode}`);

  // Format the HS code by removing periods and other non-alphanumeric characters
  // The API expects codes without periods (e.g., "03028511" instead of "0302.85.11.00")
  const formattedHsCode = hsCode.replace(/[^a-zA-Z0-9]/g, '');

  logDebug(`Formatted HS code for API request: ${formattedHsCode}`);

  try {
    // Use the new tariff_details endpoint with the formatted HS code
    const response = await fetch(`${API_BASE_URL}/tariff_details/${formattedHsCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      // Handle 404 errors specifically
      if (response.status === 404) {
        throw new Error(`HS code ${formattedHsCode} not found. Please check the code and try again.`);
      } else {
        throw new Error(`${response.status} - ${response.statusText}`);
      }
    }

    const data = await response.json();

    // Check if the data is valid
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new Error(`No data returned for HS code ${formattedHsCode}`);
    }

    logDebug(`Tariff info retrieved successfully:`, data);
    return data;
  } catch (error) {
    logDebug(`Error fetching tariff info: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch HS code subtree for a given prefix
 */
export async function getHSCodeSubtree(
  prefix: string, 
  full: boolean = true,
  maxDepth?: number
): Promise<string> {
  logDebug(`Fetching HS code subtree for prefix: ${prefix}, full: ${full}`);
  
  let url = `${API_BASE_URL}/subtree/${prefix}?full=${full}`;
  if (maxDepth !== undefined) {
    url += `&max_depth=${maxDepth}`;
  }
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    logDebug(`Subtree retrieved successfully`);
    return text;
  } catch (error) {
    logDebug(`Error fetching subtree: ${error.message}`);
    throw error;
  }
}

/**
 * Get AI-generated explanation of tariff information
 */
export async function explainTariff(
  hsCode: string, 
  includeFootnotes: boolean = true, 
  detailLevel: 'basic' | 'medium' | 'high' = 'medium'
): Promise<string> {
  logDebug(`Fetching tariff explanation for: ${hsCode}, includeFootnotes: ${includeFootnotes}, detailLevel: ${detailLevel}`);
  
  let url = `${API_BASE_URL}/explain_tariff/${hsCode}?include_footnotes=${includeFootnotes}&detail_level=${detailLevel}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    logDebug(`Tariff explanation retrieved successfully`);
    return text;
  } catch (error) {
    logDebug(`Error fetching tariff explanation: ${error.message}`);
    throw error;
  }
}

/**
 * Get structured HS code children with node_ids
 */
export async function getHSCodeChildren(
  parentCode: string
): Promise<Array<{
  node_id: number;
  code: string;
  description: string;
  is_group: boolean;
}>> {
  logDebug(`Fetching structured children for: ${parentCode}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/hs-children/${parentCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    logDebug(`Children retrieved successfully:`, data);
    return data;
  } catch (error) {
    logDebug(`Error fetching children: ${error.message}`);
    throw error;
  }
}

export type Options = { id: string; text: string };

// Define the possible states
// Possible classification stages with additional data
export type ClassificationStage = 
  | { type: "starting" }
  | { type: "analyzing" }
  | { type: "identifying_chapter"; chapter?: string }
  | { type: "classifying_heading"; heading?: string }
  | { type: "determining_subheading"; subheading?: string }
  | { type: "classifying_group"; group?: string }
  | { type: "classifying_title"; title?: string }
  | { type: "finalizing"; code?: string };

export type ClassifierState =
  | { status: "idle" }
  | { status: "loading"; stage?: ClassificationStage; path?: string; state?: any }
  | {
      status: "question";
      question: string;
      options?: Options[];
      state: any;
      previousStage?: ClassificationStage;
    }
  | {
      status: "result";
      code: string;
      description?: string;
      path?: string;
      confidence: number;
    }
  | { status: "error"; message: string; details?: string };

/**
 * React hook for using the classifier in components
 */
export function useClassifier() {
  const [state, setState] = useState<ClassifierState>({ status: "idle" });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [classificationStage, setClassificationStage] = useState<ClassificationStage>({ type: "starting" });
  
  // Add a ref to track if we need to force update stages
  const stageUpdateRequiredRef = useRef<boolean>(false);

  /**
   * Add debug information to the log
   */
  const addDebug = useCallback((message: string) => {
    console.log(`[Classifier] ${message}`);
    setDebugInfo((prev) => [...prev, message]);
  }, []);

  /**
   * Start the classification process
   */
  const { userId } = useAuth();

  /**
   * Update the classification stage and loading state
   */
  const updateStage = useCallback((stage: ClassificationStage) => {
    setClassificationStage(stage);
    
    // Always update stage in state, and force a complete state update to ensure it's detected
    setState(current => {
      if (current.status === "loading") {
        return { 
          ...current, 
          stage: {...stage}, // Create a new object to ensure React detects the change
        };
      }
      return current;
    });
    
    addDebug(`Classification stage: ${JSON.stringify(stage)}`);
    
    // Mark that stage updates are required for this classification session
    stageUpdateRequiredRef.current = true;
  }, []);
  
  /**
   * Helper function to parse a path string to extract classification information
   */
  const parsePathInfo = useCallback((path?: string): { 
    chapter?: string;
    heading?: string;
    subheading?: string;
  } => {
    if (!path) return {};
    
    // Example path: "Chapter 90 > Heading 9018 > Subheading 901890 > Medical instruments and appliances"
    const result: { chapter?: string; heading?: string; subheading?: string } = {};
    
    // Extract chapter number
    const chapterMatch = path.match(/Chapter\s+(\d+)/i);
    if (chapterMatch && chapterMatch[1]) {
      result.chapter = chapterMatch[1];
    }
    
    // Extract heading number
    const headingMatch = path.match(/Heading\s+(\d+)/i);
    if (headingMatch && headingMatch[1]) {
      result.heading = headingMatch[1];
    }
    
    // Extract subheading number
    const subheadingMatch = path.match(/Subheading\s+(\d+)/i);
    if (subheadingMatch && subheadingMatch[1]) {
      result.subheading = subheadingMatch[1];
    }
    
    return result;
  }, []);
  
  // Add a new function to ensure stages are properly sequenced
  const runStageSequence = useCallback((extractedInfo: any = {}, finalCode?: string) => {
    // Start with initial stages
    updateStage({ type: "starting" });
    updateStage({ type: "analyzing" });
    
    // If we have chapter info, add chapter stages
    if (extractedInfo.chapter) {
      updateStage({ 
        type: "identifying_chapter", 
        chapter: extractedInfo.chapter 
      });
      
      // If we have heading info, add heading stages
      if (extractedInfo.heading) {
        updateStage({ 
          type: "classifying_heading", 
          heading: extractedInfo.heading 
        });
        
        // If we have subheading info, add subheading stages
        if (extractedInfo.subheading) {
          updateStage({ 
            type: "determining_subheading", 
            subheading: extractedInfo.subheading 
          });
          
          // Add group stage after subheading
          updateStage({ type: "classifying_group" });
        }
      }
    } else {
      // If we don't have specific chapter info, use generic stages
      updateStage({ type: "identifying_chapter" });
      updateStage({ type: "classifying_heading" });
      updateStage({ type: "determining_subheading" });
    }
    
    // Always end with finalizing stage
    if (finalCode) {
      updateStage({ type: "finalizing", code: finalCode });
    } else {
      updateStage({ type: "finalizing" });
    }
  }, [updateStage]);
  
  const classify = useCallback(
    async (product: string, model: 'vertex' | 'groq' = 'vertex') => {
      try {
        // Clear previous debug info
        setDebugInfo([]);
        addDebug(`Starting classification for: ${product}`);

        // Set initial loading state with clear starting stage
        setState({ status: "loading", stage: { type: "starting" } });
        stageUpdateRequiredRef.current = true;
        
        // Start stage sequence immediately for better UX
        updateStage({ type: "analyzing" });

        // Note: We only log usage when a final result is returned
        // This happens in the processApiResponse function when we get a final code

        // Call the API to classify the product
        const result = await classifyProduct(product, 5, model);
        addDebug(`Received API response: ${JSON.stringify(result, null, 2)}`);
        addDebug(`Response type: ${typeof result}`);
        
        // Extract classification information if present
        let finalCode = "";
        let extractedInfo: {
          chapter?: string;
          heading?: string;
          subheading?: string;
        } = {};
        
        if (typeof result === "string") {
          finalCode = result;
          
          // Ensure all stages are shown even for string results
          runStageSequence({}, finalCode);
        } else if (result && typeof result === "object") {
          // Check for new API response format with classification object
          if (result.classification && result.classification.code) {
            finalCode = result.classification.code;
          } else if (result.final_code) {
            finalCode = result.final_code;
          }
          
          // Check for path in classification object or at root level
          const fullPath = result.classification?.path || result.full_path;
          
          // If we have a full path, parse it to get chapter/heading/subheading
          if (fullPath) {
            extractedInfo = parsePathInfo(fullPath);
            
            // Add path to loading state
            setState(current => 
              current.status === "loading" 
                ? { 
                    ...current, 
                    path: fullPath,
                    // Force stage update to ensure it's always included
                    stage: current.stage 
                  } 
                : current
            );
            
            // Run through all stages with appropriate data
            runStageSequence(extractedInfo, finalCode);
          } else {
            // No path info, use generic stage sequence
            runStageSequence({}, finalCode);
          }
        }

        // Process the result exactly like the Python script does
        processApiResponse(result, product);
      } catch (err) {
        // Handle errors
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error occurred";
        addDebug(`Classification error: ${errorMsg}`);

        setState({
          status: "error",
          message: "Classification Error",
          details: errorMsg,
        });
      }
    },
    [addDebug, userId]
  );

  /**
   * Process an answer to a question and continue classification
   */
  const continueWithAnswer = useCallback(
    async (answer: string) => {
      // Only proceed if we're in question state
      if (state.status !== "question") {
        addDebug(
          `Cannot continue - not in question state (current state: ${state.status})`
        );
        return;
      }

      try {
        addDebug(`Continuing with answer: ${answer}`);
        
        // Keep a reference to the API state object
        const apiState = state.state;
        addDebug(`Using API state object for continuation: ${typeof apiState}`);
        
        // We start with the heading classification stage
        const currentStage = { type: "classifying_heading" as const };
        
        // Set loading state with appropriate stage and preserve API state
        setState({ 
          status: "loading", 
          stage: currentStage,
          state: apiState // Keep the state while loading
        });
        
        // Call the API to continue classification
        const result = await continueClassification(state.state, answer);
        addDebug(
          `Received continuation response: ${JSON.stringify(result, null, 2)}`
        );
        addDebug(`Response type: ${typeof result}`);

        // Extract classification information if present
        let extractedInfo: {
          chapter?: string;
          heading?: string;
          subheading?: string;
        } = {};
        let finalCode = "";
        
        if (typeof result === "string") {
          finalCode = result;
        } else if (result && typeof result === "object") {
          // Check for new API response format with classification object
          if (result.classification && result.classification.code) {
            finalCode = result.classification.code;
          } else if (result.final_code) {
            finalCode = result.final_code;
          }
          
          // Check for path in classification object or at root level
          const fullPath = result.classification?.path || result.full_path;
          
          if (fullPath) {
            extractedInfo = parsePathInfo(fullPath);
            
            // Add path to the loading state and force stage update
            setState(current => 
              current.status === "loading" 
                ? { 
                    ...current, 
                    path: fullPath,
                    // Force stage update to ensure it's always included
                    stage: current.stage 
                  }
                : current
            );
          }
        }
        
        // Use the right starting point for continuing classification
        // Start with the determining_subheading stage or earlier based on extracted info
        let startStage = "determining_subheading";
        if (extractedInfo && Object.keys(extractedInfo).length === 0) {
          startStage = "classifying_heading";
        }
        
        // Run appropriate stages based on where we are in the classification process
        if (startStage === "classifying_heading") {
          updateStage({ type: "classifying_heading" });
          updateStage({ type: "determining_subheading" });
        } else {
          if (extractedInfo.subheading) {
            updateStage({ 
              type: "determining_subheading", 
              subheading: extractedInfo.subheading 
            });
          } else {
            updateStage({ type: "determining_subheading" });
          }
        }
        
        // Always add group stage and finalizing
        updateStage({ type: "classifying_group" });
        updateStage({ type: "finalizing", code: finalCode });

        // Process the result
        processApiResponse(result);
      } catch (err) {
        // Handle errors
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error occurred";
        addDebug(`Continue error: ${errorMsg}`);

        setState({
          status: "error",
          message: "Error Processing Answer",
          details: errorMsg,
        });
      }
    },
    [state, addDebug, parsePathInfo]
  );

  /**
   * Process the API response following the new stateless API schema
   */
  const processApiResponse = useCallback(
    async (result: any, productDescription?: string) => {
      // Detailed logging of the result for debugging
      addDebug(`Processing API response: ${JSON.stringify(result, null, 2)}`);

      // If result is a string, it's the final code (legacy format or direct HS code)
      if (typeof result === "string") {
        addDebug(`Received final code as string: ${result}`);
        
        // Show result immediately but continue the visual animation
        const finalCode = result;
        
        // Log usage only when we get a final result
        try {
          // Pass userId (will be null for anonymous users, which logUsage handles)
          await logUsage(userId, 'final_classification');
          addDebug(`Logged final result usage for user: ${userId || 'anonymous'}`);
        } catch (error) {
          addDebug(`Error logging usage: ${error}`);
        }
        
        // Track the final classification result
        trackClassificationResult(finalCode);
        
        // Use a fixed high confidence range between 94-99%
        let confidence = 94; // Base confidence
        
        // Save classification to database if user is logged in
        if (userId && productDescription) {
          try {
            await saveClassification({
              user_id: userId,
              user_email: null, // User email not available in current Clerk version
              product_description: productDescription,
              hs_code: finalCode,
              confidence: confidence,
              full_path: undefined, // String results don't have path info
              tariff_data: null,
              notes: null
            });
            addDebug(`Classification saved to database for user: ${userId}`);
          } catch (error) {
            addDebug(`Error saving classification: ${error}`);
          }
        }
        
        // Update state to show result immediately
        setState({
          status: "result",
          code: finalCode,
          description: productDescription || "Product",
          confidence, // More realistic confidence that's never 100%
        });
        return;
      }

      // Check for object response and the new 'final' flag
      if (result && typeof result === "object") {
        // Check for the final flag to determine response type
        if ("final" in result) {
          if (result.final === true) {
            // This is a final classification response
            addDebug(`Processing final classification response`);
            
            // Check for new API response format with classification object
            let finalCode = "Unknown";
            if (result.classification && result.classification.code) {
              finalCode = String(result.classification.code);
            } else if (result.final_code) {
              finalCode = typeof result.final_code === "string"
                ? result.final_code
                : String(result.final_code);
            }
              
            const description = typeof result.enriched_query === "string"
              ? result.enriched_query
              : productDescription || "Product";
              
            // Check for path in classification object or at root level
            const path = result.classification?.path || result.full_path;
            const pathString = typeof path === "string" ? path : undefined;
            
            // Log usage only when we get a final result
            try {
              await logUsage(userId, 'final_classification');
              addDebug(`Logged final result usage for user: ${userId || 'anonymous'}`);
            } catch (error) {
              addDebug(`Error logging usage: ${error}`);
            }

            // Track the final classification result
            trackClassificationResult(finalCode);
            
            // Calculate confidence score based on available information
            const hasDescription = !!result.enriched_query;
            const hasPath = !!pathString;
            
            // Use log_score for most accurate confidence calculation
            let confidence = 94;
            if (result.classification && typeof result.classification.log_score === "number") {
              // Log score is typically negative, closer to 0 means higher confidence
              // Map log scores to high confidence ranges (85-99%)
              const logScore = result.classification.log_score;
              
              if (logScore >= -0.1) {
                // Extremely high confidence
                confidence = 99;
              } else if (logScore >= -0.3) {
                // Very high confidence  
                confidence = 97;
              } else if (logScore >= -0.5) {
                // High confidence (like your seabream example)
                confidence = 95;
              } else if (logScore >= -0.8) {
                // Good confidence
                confidence = 92;
              } else if (logScore >= -1.2) {
                // Moderate confidence
                confidence = 88;
              } else {
                // Lower confidence but still reasonable
                confidence = 85;
              }
              
              addDebug(`Log score: ${logScore} mapped to confidence: ${confidence}%`);
            } else if (result.classification && typeof result.classification.confidence === "number") {
              // Fallback to confidence field, but boost it significantly
              const rawConfidence = result.classification.confidence;
              if (rawConfidence >= 0.5) {
                // Boost confidence scores that are 50%+ to high ranges
                confidence = Math.min(99, Math.round(85 + (rawConfidence - 0.5) * 28)); // Maps 0.5-1.0 to 85-99%
              } else {
                confidence = Math.max(75, Math.round(rawConfidence * 150)); // Boost lower scores
              }
              addDebug(`Raw confidence: ${rawConfidence} boosted to: ${confidence}%`);
            } else {
              // Start with base confidence of 94%
              confidence = 94;
              
              // Add confidence if we have enriched description
              if (hasDescription) {
                confidence += 2;
              }
              
              // Add confidence if we have full path
              if (hasPath) {
                confidence += 3;
              }
              
              // Cap at 99%
              confidence = Math.min(confidence, 99);
            }

            // Save classification to database if user is logged in
            if (userId && (productDescription || description)) {
              try {
                await saveClassification({
                  user_id: userId,
                  user_email: null, // User email not available in current Clerk version
                  product_description: productDescription || description,
                  hs_code: finalCode,
                  confidence: confidence,
                  full_path: pathString,
                  tariff_data: null,
                  notes: null
                });
                addDebug(`Classification saved to database for user: ${userId}`);
              } catch (error) {
                addDebug(`Error saving classification: ${error}`);
              }
            }

            // Update state to show result immediately
            setState({
              status: "result",
              code: finalCode,
              description: description,
              path: pathString,
              confidence: confidence,
            });
            return;
          } else {
            // This is a clarification question response
            addDebug(`Processing clarification question response`);
            
            if (result.clarification_question) {
              // Log the structure of the clarification question
              addDebug(
                `Clarification question structure: ${JSON.stringify(
                  result.clarification_question,
                  null,
                  2
                )}`
              );

              // Get the question text safely
              let questionText = "Please provide more information about your product";
              if (
                result.clarification_question &&
                typeof result.clarification_question.question_text === "string"
              ) {
                questionText = result.clarification_question.question_text;
              } else if (result.clarification_question) {
                // If it's not a string, try to make a string representation
                try {
                  questionText = JSON.stringify(
                    result.clarification_question.question_text
                  );
                  addDebug(`Converted non-string question to: ${questionText}`);
                } catch (e) {
                  addDebug(`Could not stringify question: ${e}`);
                }
              }

              // Get options safely - ensure they're in the Options object format
              let options: Options[] = [];
              if (
                result.clarification_question &&
                Array.isArray(result.clarification_question.options)
              ) {
                // Process each option - normalize to Options object format
                options = result.clarification_question.options.map((opt, index) => {
                  // If the option is already an object with id and text properties
                  if (opt && typeof opt === "object" && "id" in opt && "text" in opt) {
                    return {
                      id: String(opt.id),
                      text: String(opt.text)
                    };
                  }
                  // If the option is an object with just a text property
                  else if (opt && typeof opt === "object" && "text" in opt) {
                    return {
                      id: String(index + 1),
                      text: String(opt.text)
                    };
                  }
                  // If the option is a string, create an Options object
                  else {
                    return {
                      id: String(index + 1),
                      text: String(opt)
                    };
                  }
                });

                addDebug(`Processed options: ${JSON.stringify(options)}`);
              }

              // CRITICAL: Store the entire state object from the API response without modifying it
              const sessionState = result.state;
              addDebug(`Session state received, type: ${typeof sessionState}`);

              setState({
                status: "question",
                question: questionText,
                options: options,
                state: sessionState, // Pass the complete state object
              });
              return;
            }
          }
        }
        
        // Check for legacy format (without 'final' flag)
        // If result has clarification_question, ask it
        else if ("clarification_question" in result) {
          addDebug(`Processing legacy clarification question format`);
          
          // Get the question text safely
          let questionText = "Please provide more information about your product";
          if (
            result.clarification_question &&
            typeof result.clarification_question.question_text === "string"
          ) {
            questionText = result.clarification_question.question_text;
          } else if (result.clarification_question) {
            // If it's not a string, try to make a string representation
            try {
              questionText = JSON.stringify(
                result.clarification_question.question_text
              );
              addDebug(`Converted non-string question to: ${questionText}`);
            } catch (e) {
              addDebug(`Could not stringify question: ${e}`);
            }
          }

          // Get options safely - ensure they're in the Options object format
          let options: Options[] = [];
          if (
            result.clarification_question &&
            Array.isArray(result.clarification_question.options)
          ) {
            // Process each option - normalize to Options object format
            options = result.clarification_question.options.map((opt, index) => {
              // If the option is already an object with id and text properties
              if (opt && typeof opt === "object" && "id" in opt && "text" in opt) {
                return {
                  id: String(opt.id),
                  text: String(opt.text)
                };
              }
              // If the option is an object with just a text property
              else if (opt && typeof opt === "object" && "text" in opt) {
                return {
                  id: String(index + 1),
                  text: String(opt.text)
                };
              }
              // If the option is a string, create an Options object
              else {
                return {
                  id: String(index + 1),
                  text: String(opt)
                };
              }
            });

            addDebug(`Processed options: ${JSON.stringify(options)}`);
          }

          // Get state safely - this could be a string or an object
          const sessionState = result.state;
          addDebug(`Session state type: ${typeof sessionState}`);

          setState({
            status: "question",
            question: questionText,
            options: options,
            state: sessionState, // Store the entire state object
          });

          return;
        }
        // If result has final_code (legacy format), it's the final classification
        else if ("final_code" in result) {
          addDebug(`Processing legacy final code format: ${result.final_code}`);
          
          // Show result immediately but continue the visual animation
          const finalCode = typeof result.final_code === "string"
            ? result.final_code
            : String(result.final_code || "Unknown");
            
          const description = typeof result.enriched_query === "string"
            ? result.enriched_query
            : productDescription || "Product";
            
          const path = typeof result.full_path === "string" ? result.full_path : undefined;
          
          // Log usage only when we get a final result
          try {
            // Pass userId (will be null for anonymous users, which logUsage handles)
            await logUsage(userId, 'final_classification');
            addDebug(`Logged final result usage for user: ${userId || 'anonymous'}`);
          } catch (error) {
            addDebug(`Error logging usage: ${error}`);
          }

          // Track the final classification result
          trackClassificationResult(finalCode);
          
          // Calculate confidence score based on available information
          const hasDescription = !!result.enriched_query;
          const hasPath = !!result.full_path;
          
          // Start with base confidence of 94%
          let confidence = 94;
          
          // Add confidence if we have enriched description
          if (hasDescription) {
            confidence += 2;
          }
          
          // Add confidence if we have full path
          if (hasPath) {
            confidence += 3;
          }
          
          // Cap at 99% - high confidence but never 100%
          confidence = Math.min(confidence, 99);

          // Update state to show result immediately
          setState({
            status: "result",
            code: finalCode,
            description: description,
            path: path,
            confidence: confidence,
          });
          return;
        }
      }

      // If we get here, we don't understand the response format
      addDebug(
        `Unexpected response format: ${JSON.stringify(result, null, 2)}`
      );
      setState({
        status: "error",
        message: "Unexpected Response",
        details: `The API returned a response in an unexpected format: ${JSON.stringify(
          result,
          null,
          2
        )}`,
      });
    },
    [addDebug, userId]
  );

  /**
   * Reset the classifier to idle state
   */
  const reset = useCallback(() => {
    addDebug("Resetting classifier state");
    setState({ status: "idle" });
    setDebugInfo([]);
  }, [addDebug]);

  // Return the state, functions and debug info
  return {
    state,
    classify,
    continueWithAnswer,
    reset,
    debugInfo,
  };
}
