// src/pages/Index.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useClassifier } from "@/lib/classifierService";
import { useClassificationStream } from "@/hooks/useClassificationStream";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { useNavigate } from "react-router-dom";
import { trackClassificationStart, trackQuestionAnswer, trackClassificationResult } from "@/lib/analyticsService";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageCircle,
  RefreshCw,
  ArrowRight,
  Bug,
  Copy,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import StreamingProgress from "@/components/StreamingProgress";
import CustomButton from "@/components/ui/CustomButton";

// Simple wrapper component to ensure any errors are contained
class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    console.error("[ErrorBoundary] Caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("[ErrorBoundary] Error details:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto mt-10 glass-card rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-destructive mr-3 mt-0.5" />
            <div>
              <h2 className="text-xl font-medium text-destructive mb-2">
                Application Error
              </h2>
              <p className="text-muted-foreground mb-4">
                An unexpected error occurred in the application.
              </p>
              <pre className="p-3 bg-secondary/50 rounded text-xs overflow-auto max-h-40 mb-4 font-mono">
                {this.state.error?.toString()}
              </pre>
              <CustomButton
                onClick={() => window.location.reload()}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reload Application
              </CustomButton>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const { state, classify, continueWithAnswer, reset, debugInfo } =
    useClassifier();
  const streamingState = useClassificationStream();
  const [progressPercent, setProgressPercent] = useState(0);
  const [originalProductDescription, setOriginalProductDescription] = useState<string>("");
  const [useStreaming, setUseStreaming] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'vertex' | 'groq'>('groq');
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  const navigate = useNavigate();

  // Get usage limits hook
  const { checkCanMakeRequest, reloadUsageData } = useUsageLimits();


  // Cleanup any timers on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

  // Handle reset
  const handleReset = () => {
    setOriginalProductDescription("");
    reset();
  };

  // Handle product submission
  const handleClassify = async (description: string) => {
    console.log("[Index] Starting classification for:", description);
    
    // Store the original product description
    setOriginalProductDescription(description);
    
    // Check if the user can make a request based on their usage limits
    const canMakeRequest = await checkCanMakeRequest();
    if (!canMakeRequest) {
      return; // Don't proceed if the user has reached their limit
    }
    
    // Track the classification start event
    trackClassificationStart(description);
    
    if (useStreaming) {
      // Use streaming classification
      streamingState.startStreaming(description, {
        interactive: true,
        maxQuestions: 3,
        hypothesisCount: 3,
        model: selectedModel
      });
    } else {
      // Use traditional classification
      classify(description, selectedModel);
    }
  };

  // Handle streaming reset
  const handleStreamingReset = () => {
    setOriginalProductDescription("");
    streamingState.reset();
  };

  // Handle restart classification with forced path
  const handleRestartClassification = useCallback(async (productDescription: string, forcedPath: Array<{ code: string; description: string }>) => {
    console.log("[Index] Restarting classification with forced path:", forcedPath);
    
    // Check if the user can make a request based on their usage limits
    const canMakeRequest = await checkCanMakeRequest();
    if (!canMakeRequest) {
      return; // Don't proceed if the user has reached their limit
    }
    
    // Keep the original product description
    setOriginalProductDescription(productDescription);
    
    // Track the classification start event for the restart
    trackClassificationStart(productDescription);
    
    // Start new streaming with forced path - this now handles the reset internally
    streamingState.restartStreaming(productDescription, forcedPath, {
      interactive: true,
      maxQuestions: 3,
      hypothesisCount: 3,
      model: selectedModel
    });
  }, [streamingState, selectedModel, checkCanMakeRequest]);

  // Handle continuation from reconstructed state
  const handleContinueFromState = useCallback(async (reconstructedState: any) => {
    console.log("[Index] Continuing from reconstructed state:", reconstructedState);
    
    // Check if the user can make a request based on their usage limits
    const canMakeRequest = await checkCanMakeRequest();
    if (!canMakeRequest) {
      return; // Don't proceed if the user has reached their limit
    }
    
    // Track the classification start event for the continuation
    trackClassificationStart(reconstructedState.product || reconstructedState.original_query);
    
    // Continue with the reconstructed state
    streamingState.continueFromState(reconstructedState, {
      model: selectedModel
    });
  }, [streamingState, selectedModel, checkCanMakeRequest]);

  // Handle streaming result
  useEffect(() => {
    if (streamingState.finalResult && useStreaming) {
      // Track the final classification result
      if (streamingState.finalResult.final_code) {
        trackClassificationResult(streamingState.finalResult.final_code);
      }
      
      // Reload usage data after successful classification
      reloadUsageData();
    }
  }, [streamingState.finalResult, useStreaming, reloadUsageData]);

  // Handle traditional mode result
  useEffect(() => {
    if (state.status === "result" && !useStreaming) {
      // Track the final classification result
      if ('code' in state && state.code) {
        trackClassificationResult(state.code);
      }
      
      // Reload usage data after successful classification
      reloadUsageData();
    }
  }, [state.status, state, useStreaming, reloadUsageData]);

  // Handle answer submission
  const handleAnswer = (questionId: string, answer: string) => {
    console.log("[Index] Submitting answer:", { questionId, answer });

    // Track the question answer event
    if (state.status === "question" && typeof state.question === "string") {
      trackQuestionAnswer(state.question, answer);
    }

    // Continue with the answer, which will transition back to loading state
    continueWithAnswer(answer);
  };

  // Copy debug info to clipboard
  const copyDebugInfo = () => {
    if (debugInfo && debugInfo.length > 0) {
      navigator.clipboard.writeText(debugInfo.join("\n"));
    }
  };

  // Log the current state for debugging purposes
  React.useEffect(() => {
    console.log("[Index] Current classifier state:", JSON.stringify(state, null, 2));
    console.log("[Index] Current streaming state:", JSON.stringify({
      isStreaming: streamingState.isStreaming,
      finalResult: streamingState.finalResult,
      isWaitingForAnswer: streamingState.isWaitingForAnswer,
      currentStage: streamingState.currentStage
    }, null, 2));
  }, [state, streamingState.isStreaming, streamingState.finalResult, streamingState.isWaitingForAnswer, streamingState.currentStage]);
  
  // Monitor streaming state changes specifically
  React.useEffect(() => {
    console.log("[Index] isStreaming changed to:", streamingState.isStreaming);
  }, [streamingState.isStreaming]);
  
  // Function to get display text for the current classification stage
  const getStageDisplayText = (state: any) => {
    // Check if we have the API state object available (in question state or passed to loading)
    if (state.state && typeof state.state === 'object') {
      // Use the state information from the API
      if (state.state.pending_stage) {
        // Convert pending_stage (like "material_identification") to a readable format
        const stageName = state.state.pending_stage
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        
        return `${stageName}...`;
      }
      
      // If we have a current node, display its info
      if (state.state.current_node && state.state.current_node.code) {
        return `Classifying in ${state.state.current_node.code}${state.state.current_node.description ? `: ${state.state.current_node.description}` : ''}`;
      }
      
      // Check for selection info
      if (state.state.selection) {
        if (state.state.selection.chapter) {
          return `Working with Chapter ${state.state.selection.chapter}`;
        }
      }
    }
    
    // Fallback to the traditional local stage information
    if (!state.stage) return "Processing your request...";
    
    switch (state.stage.type) {
      case "starting":
        return "Initializing classification...";
      case "analyzing":
        return "Analyzing product description...";
      case "identifying_chapter":
        return `Identifying HS chapter${state.stage.chapter ? `: Chapter ${state.stage.chapter}` : '...'}`;
      case "classifying_heading":
        return `Classifying heading${state.stage.heading ? `: Heading ${state.stage.heading}` : '...'}`;
      case "determining_subheading":
        return `Determining subheading${state.stage.subheading ? `: Subheading ${state.stage.subheading}` : '...'}`;
      case "classifying_group":
        return `Classifying group${state.stage.group ? `: ${state.stage.group}` : '...'}`;
      case "classifying_title":
        return `Classifying title${state.stage.title ? `: ${state.stage.title}` : '...'}`;
      case "finalizing":
        return `Finalizing classification${state.stage.code ? ` to ${state.stage.code}` : '...'}`;
      default:
        return "Processing your classification...";
    }
  };

  // Force the error boundary to catch any errors during render
  React.useEffect(() => {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error("[Global Error Handler]", message, error);
      return false; // Let the default handler run as well
    };

    window.addEventListener("unhandledrejection", (event) => {
      console.error("[Unhandled Promise Rejection]", event.reason);
    });

    return () => {
      window.onerror = null;
      window.removeEventListener("unhandledrejection", () => {});
    };
  }, []);

  return (
    <ErrorBoundary>
      <Layout className="pt-12 pb-16">
        <div className="w-full max-w-2xl mx-auto">
          {/* Product Input */}
          {(state.status === "idle" && !streamingState.isStreaming && !streamingState.finalResult && !streamingState.isWaitingForAnswer) && (
            <>
              <ProductInput 
                onSubmit={handleClassify} 
                isLoading={false}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
              
              {/* Batch Processing Option */}
              <div className="mt-4 glass-card p-4 rounded-xl bg-secondary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Need to classify multiple products?</h3>
                    <p className="text-sm text-muted-foreground">
                      Use our batch processing feature to classify multiple products at once.
                    </p>
                  </div>
                  <CustomButton 
                    variant="outline" 
                    onClick={() => navigate('/bulk-import')}
                    className="flex items-center whitespace-nowrap ml-4"
                    type="button"
                  >
                    Batch Import <ArrowRight size={14} className="ml-2" />
                  </CustomButton>
                </div>
              </div>
            </>
          )}

          {/* Streaming Progress */}
          {streamingState.isStreaming && useStreaming && (
            <StreamingProgress 
              streamingState={streamingState}
              showTechnicalDetails={showTechnicalDetails}
              onAnswerQuestion={streamingState.answerQuestion}
            />
          )}

          {/* Loading State with Enhanced Classification Stage (Traditional Mode) */}
          {state.status === "loading" && !useStreaming && (
            <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center h-60">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-base font-medium mb-1">
                {getStageDisplayText(state)}
              </p>
              
              {/* Progress bar container */}
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden mt-4 mb-2">
                {/* Progress bar */}
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                This may take a moment depending on product complexity<br/>
                <span className="text-primary text-xs font-medium mt-1 inline-block">
                  {state.path && `Path: ${state.path}`}
                </span>
              </p>
            </div>
          )}


          {/* Traditional Question Flow */}
          {state.status === "question" && !useStreaming && (
            <>
              {/* Debug info to show what's being passed to QuestionFlow */}
              {console.log("[Index] Passing question to QuestionFlow:", {
                questionText: state.question,
                questionTextType: typeof state.question,
                options: state.options,
                optionsType: Array.isArray(state.options)
                  ? "array"
                  : typeof state.options,
                state: state.state, // This contains the entire state object from the API
              })}

              {/* Stage display - show where we are in the classification process */}
              <div className="mb-3 text-sm text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {getStageDisplayText(state)}
                </span>
              </div>

              {/* We hide the main progress bar during questions - it will be replaced by the question progress bar */}

              <QuestionFlow
                question={{
                  id: "clarification",
                  text:
                    typeof state.question === "string"
                      ? state.question
                      : "Please provide more information about your product",
                  options: Array.isArray(state.options) ? state.options : [],
                  question_type: state.state?.clarification_question?.question_type || "text",
                }}
                onAnswer={handleAnswer}
                isLoading={false}
              />
            </>
          )}

          {/* Streaming Result View - Only show if we have a final result AND we're not currently streaming */}
          {streamingState.finalResult && useStreaming && !streamingState.isStreaming && !streamingState.isWaitingForAnswer && (
            <HSCodeResult
              hsCode={streamingState.finalResult.final_code || "Unknown"}
              description={streamingState.finalResult.enriched_query || originalProductDescription || "Product"}
              confidence={95} // High confidence for streaming results
              fullPath={streamingState.finalResult.full_path}
              originalProduct={originalProductDescription}
              classificationDecisions={streamingState.classificationDecisions}
              onReset={handleStreamingReset}
              onRestartClassification={handleRestartClassification}
              classificationState={streamingState.classificationState}
              onContinueFromState={handleContinueFromState}
            />
          )}

          {/* Traditional Result View */}
          {state.status === "result" && !useStreaming && (
            <HSCodeResult
              hsCode={state.code}
              description={state.description || "Product"}
              confidence={state.confidence}
              fullPath={state.path}
              originalProduct={originalProductDescription}
              classificationDecisions={[]} // Traditional mode doesn't have classification decisions
              onReset={handleReset}
            />
          )}

          {/* Error View */}
          {state.status === "error" && (
            <div className="glass-card p-6 rounded-xl animate-scale-in">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive mb-2">
                    Error Processing Request
                  </h3>
                  <p className="text-muted-foreground mb-4">{state.message}</p>

                  {state.details && (
                    <div className="mb-6 p-3 bg-secondary/50 border border-border rounded-md overflow-auto max-h-40 text-xs font-mono">
                      {state.details}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <CustomButton onClick={reset} className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default Index;
