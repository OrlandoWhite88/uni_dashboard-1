// src/pages/Index.tsx

import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useClassifier } from "@/lib/classifierService";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  MessageCircle,
  RefreshCw, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  Bug
} from "lucide-react";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import CustomButton from "@/components/ui/CustomButton";

// Simple wrapper component to ensure any errors are contained
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Error caught by boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto mt-10 glass-card rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-destructive mr-3 mt-0.5" />
            <div>
              <h2 className="text-xl font-medium text-destructive mb-2">Application Error</h2>
              <p className="text-muted-foreground mb-4">An unexpected error occurred in the application.</p>
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
  const { state, classify, continueWithAnswer, reset, debugInfo } = useClassifier();
  const [showDebug, setShowDebug] = useState(false);

  // Handle product submission
  const handleClassify = (description: string) => {
    console.log("[Index] Starting classification for:", description);
    classify(description);
  };

  // Handle answer submission
  const handleAnswer = (questionId: string, answer: string) => {
    console.log("[Index] Submitting answer:", { questionId, answer });
    continueWithAnswer(answer);
  };

  // Copy debug info to clipboard
  const copyDebugInfo = () => {
    if (debugInfo && debugInfo.length > 0) {
      navigator.clipboard.writeText(debugInfo.join('\n'));
    }
  };

  // Log the current state for debugging purposes
  React.useEffect(() => {
    console.log("[Index] Current classifier state:", state);
  }, [state]);

  return (
    <ErrorBoundary>
      <Layout className="pt-28 pb-16">
        <div className="w-full max-w-2xl mx-auto">
          {/* Status indicator for developers */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors bg-secondary text-muted-foreground">
              HS Code Classification Service
            </div>
          </div>

          {/* Product Input */}
          {state.status === 'idle' && (
            <ProductInput onSubmit={handleClassify} isLoading={false} />
          )}

          {/* Loading State */}
          {state.status === 'loading' && (
            <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center h-60 animate-pulse">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Processing your request...</p>
            </div>
          )}

          {/* Question Flow */}
          {state.status === 'question' && (
            <>
              {/* Debug info to show what's being passed to QuestionFlow */}
              {console.log("[Index] Passing question to QuestionFlow:", {
                questionText: state.question,
                questionTextType: typeof state.question,
                options: state.options,
                optionsType: Array.isArray(state.options) ? "array" : typeof state.options
              })}
              
              <QuestionFlow 
                question={{
                  id: 'clarification', 
                  text: typeof state.question === 'string' 
                    ? state.question 
                    : "Please provide more information about your product",
                  options: Array.isArray(state.options) ? state.options : []
                }}
                onAnswer={handleAnswer}
                isLoading={false}
              />
            </>
          )}

          {/* Result View */}
          {state.status === 'result' && (
            <HSCodeResult 
              hsCode={state.code}
              description={state.description || 'Product'}
              confidence={state.confidence}
              fullPath={state.path}
              onReset={reset}
            />
          )}

          {/* Error View */}
          {state.status === 'error' && (
            <div className="glass-card p-6 rounded-xl animate-scale-in">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive mb-2">Error Processing Request</h3>
                  <p className="text-muted-foreground mb-4">{state.message}</p>
                  
                  {state.details && (
                    <div className="mb-6 p-3 bg-secondary/50 border border-border rounded-md overflow-auto max-h-40 text-xs font-mono">
                      {state.details}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <CustomButton
                      onClick={reset}
                      className="flex items-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debug Panel - shows debug info for developers */}
          {debugInfo && debugInfo.length > 0 && (
            <div className="mt-8 rounded-xl border border-border">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer bg-secondary/50 rounded-t-xl"
                onClick={() => setShowDebug(!showDebug)}
              >
                <div className="flex items-center text-sm font-medium">
                  <Bug className="h-4 w-4 mr-2 text-muted-foreground" />
                  Debug Information
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyDebugInfo();
                    }}
                    className="p-1.5 rounded-md hover:bg-secondary mr-1"
                    title="Copy debug info"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {showDebug ? 
                    <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </div>
              
              {showDebug && (
                <div className="p-3 border-t border-border bg-background/50 rounded-b-xl">
                  <div className="max-h-60 overflow-auto p-2 bg-muted/30 rounded-md font-mono text-xs">
                    {debugInfo.map((line, i) => (
                      <div key={i} className="py-0.5 border-b border-secondary last:border-0">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default Index;