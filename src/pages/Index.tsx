// src/pages/Index.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useClassifier } from "@/lib/classifierService";
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
} from "lucide-react";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
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
  const [progressPercent, setProgressPercent] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  const navigate = useNavigate();

  // Get usage limits hook
  const { checkCanMakeRequest, reloadUsageData } = useUsageLimits();

  // Reference to track classification state
  const classificationActiveRef = useRef<boolean>(false);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedMsRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);

  // Progress bar controller that pauses on questions
  const startProgressBar = useCallback(() => {
    // Clear any existing timer
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    
    // Reset progress
    setProgressPercent(0);
    elapsedMsRef.current = 0;
    
    // Mark classification as active
    classificationActiveRef.current = true;
    lastTickTimeRef.current = Date.now();
    
    // Start the progress timer
    updateProgressTimer();
  }, []);
  
  // Function to update/create the timer
  const updateProgressTimer = useCallback(() => {
    // Clear any existing timer
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    
    // Only run the timer if we're in the loading state
    if (state.status !== "loading") {
      return;
    }
    
    const totalDuration = 10000; // 10 seconds in ms
    const updateInterval = 50; // update every 50ms for smoother animation
    
    // Start interval to update progress bar
    timerIdRef.current = setInterval(() => {
      const now = Date.now();
      const tickDelta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;
      
      // Add the time since last tick
      elapsedMsRef.current += tickDelta;
      
      // Calculate progress as percentage
      const progress = Math.min((elapsedMsRef.current / totalDuration) * 100, 99.5);
      setProgressPercent(progress);
      
      // If we're at the end of our time, cap at 99.5% until complete
      if (elapsedMsRef.current >= totalDuration) {
        // Stop timer but maintain 99.5% progress until result
        if (timerIdRef.current) {
          clearInterval(timerIdRef.current);
          timerIdRef.current = null;
        }
      }
    }, updateInterval);
  }, [state.status]);
  
  // Handle progress bar based on state changes
  useEffect(() => {
    if (state.status === "loading" && classificationActiveRef.current) {
      // Update the last tick time to now when we enter loading state
      lastTickTimeRef.current = Date.now();
      // Resume the timer
      updateProgressTimer();
    } else if (state.status === "question" && classificationActiveRef.current) {
      // Pause the timer but keep progress
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    } else if (state.status === "result" && classificationActiveRef.current) {
      // Classification is complete, set progress to 100%
      setProgressPercent(100);
      classificationActiveRef.current = false;
      
      // Clean up any running timer
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    } else if (state.status === "idle") {
      // Reset everything when returning to idle
      setProgressPercent(0);
      elapsedMsRef.current = 0;
      classificationActiveRef.current = false;
      
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    }
    
    // Clean up on unmount
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, [state.status, updateProgressTimer]);

  // Handle product submission
  const handleClassify = async (description: string) => {
    console.log("[Index] Starting classification for:", description);
    
    // Check if the user can make a request based on their usage limits
    const canMakeRequest = await checkCanMakeRequest();
    if (!canMakeRequest) {
      return; // Don't proceed if the user has reached their limit
    }
    
    // Track the classification start event
    trackClassificationStart(description);
    
    // Start the independent progress bar (runs for exactly 10 seconds)
    startProgressBar();
    
    // If allowed, proceed with classification
    classify(description);
    
    // After classification, reload usage data to reflect the new request count
    setTimeout(() => reloadUsageData(), 1000);
  };

  // Handle answer submission
  const handleAnswer = (questionId: string, answer: string) => {
    console.log("[Index] Submitting answer:", { questionId, answer });
    
    // Track the question answer event
    if (state.status === "question" && typeof state.question === "string") {
      trackQuestionAnswer(state.question, answer);
    }
    
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
    console.log("[Index] Current classifier state:", state);
  }, [state]);

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
      <Layout className="pt-28 pb-16">
        <div className="w-full max-w-2xl mx-auto">
          {/* Status indicator for developers */}
          <div className="mb-4 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3 animate-slide-down">
              Accurate HS Classification Engine
            </div>
          </div>

          {/* Product Input */}
          {state.status === "idle" && (
            <>
              <ProductInput onSubmit={handleClassify} isLoading={false} />
              
              {/* Batch Processing Option */}
              <div className="mt-6 glass-card p-4 rounded-xl bg-secondary/10">
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

          {/* Loading State with Enhanced Classification Stage */}
          {state.status === "loading" && (
            <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center h-60">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-base font-medium mb-1">
                {!state.stage && "Processing your request..."}
                {state.stage?.type === "starting" && "Initializing classification..."}
                {state.stage?.type === "analyzing" && "Analyzing product description..."}
                {state.stage?.type === "identifying_chapter" && 
                  `Identifying HS chapter${state.stage.chapter ? `: Chapter ${state.stage.chapter}` : '...'}`}
                {state.stage?.type === "classifying_heading" && 
                  `Classifying heading${state.stage.heading ? `: Heading ${state.stage.heading}` : '...'}`}
                {state.stage?.type === "determining_subheading" && 
                  `Determining subheading${state.stage.subheading ? `: Subheading ${state.stage.subheading}` : '...'}`}
                {state.stage?.type === "classifying_group" && 
                  `Classifying group${state.stage.group ? `: ${state.stage.group}` : '...'}`}
                {state.stage?.type === "classifying_title" && 
                  `Classifying title${state.stage.title ? `: ${state.stage.title}` : '...'}`}
                {state.stage?.type === "finalizing" && 
                  `Finalizing classification${state.stage.code ? ` to ${state.stage.code}` : '...'}`}
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

          {/* Question Flow */}
          {state.status === "question" && (
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
              
              {/* Progress bar container - shown during questions too */}
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden mb-4">
                {/* Progress bar */}
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

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

          {/* Result View */}
          {state.status === "result" && (
            <HSCodeResult
              hsCode={state.code}
              description={state.description || "Product"}
              confidence={state.confidence}
              fullPath={state.path}
              onReset={reset}
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
