import React, { useEffect } from "react";
import Layout from "@/components/Layout";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import { useHSCodeGenerator } from "@/lib/hsCodeGenerator";
import { AlertCircle, RefreshCw, Bug } from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = () => {
  const {
    state,
    currentQuestion,
    result,
    error,
    debugInfo,
    startAnalysis,
    answerQuestion,
    reset
  } = useHSCodeGenerator();

  // Debug logging for state changes
  useEffect(() => {
    console.log("Current application state:", state);
    if (currentQuestion) {
      console.log("Current question:", currentQuestion);
    }
    if (result) {
      console.log("Result:", result);
    }
  }, [state, currentQuestion, result]);

  // Helper to determine if we should show the debug panel
  const showDebugPanel = Boolean(debugInfo) || state === "error" || state === "questioning";

  return (
    <ErrorBoundary>
      <Layout className="pt-28 pb-16">
        {/* Debug Panel - Visible in development or when there's debug info */}
        {showDebugPanel && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="flex items-center text-yellow-800 font-medium">
                <Bug size={16} className="mr-2" />
                Debug Information
              </h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                State: {state}
              </span>
            </div>
            
            {state === "questioning" && currentQuestion && (
              <div className="mb-2 pb-2 border-b border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Current Question:</strong> {currentQuestion.text}
                </p>
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <p className="text-sm text-yellow-800">
                    <strong>Options:</strong> {currentQuestion.options.join(", ")}
                  </p>
                )}
              </div>
            )}
            
            {error && (
              <div className="mb-2 text-red-600 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {debugInfo && (
              <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs font-mono overflow-auto max-h-40">
                {debugInfo}
              </pre>
            )}
          </div>
        )}
        
        {/* Main Content */}
        {state === "idle" && (
          <ProductInput 
            onSubmit={startAnalysis} 
            isLoading={false} 
          />
        )}
        
        {state === "analyzing" && (
          <div className="h-60 flex items-center justify-center glass-card rounded-xl max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Analyzing product information...</p>
            </div>
          </div>
        )}
        
        {state === "questioning" && currentQuestion && (
          <QuestionFlow 
            question={currentQuestion} 
            onAnswer={answerQuestion}
            isLoading={false} 
          />
        )}
        
        {state === "generating" && (
          <div className="h-60 flex items-center justify-center glass-card rounded-xl max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Generating HS code...</p>
            </div>
          </div>
        )}
        
        {state === "error" && (
          <div className="max-w-2xl mx-auto p-6 glass-card rounded-xl">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-destructive mb-2">Classification Error</h3>
                <p className="text-muted-foreground mb-4">{error || "An unexpected error occurred while classifying your product. Please try again."}</p>
                <CustomButton onClick={reset}>
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </CustomButton>
              </div>
            </div>
          </div>
        )}
        
        {state === "complete" && result && (
          <HSCodeResult 
            hsCode={result.code} 
            description={result.description} 
            confidence={result.confidence}
            fullPath={result.fullPath}
            onReset={reset}
          />
        )}
        
        {/* Fallback for unexpected states */}
        {!["idle", "analyzing", "questioning", "generating", "complete", "error"].includes(state) && (
          <div className="max-w-2xl mx-auto p-6 glass-card rounded-xl">
            <div className="text-center">
              <p className="mb-4">Unexpected application state: <strong>{state}</strong></p>
              <CustomButton onClick={reset}>
                <RefreshCw size={16} className="mr-2" />
                Reset Application
              </CustomButton>
            </div>
          </div>
        )}
      </Layout>
    </ErrorBoundary>
  );
};

export default Index;