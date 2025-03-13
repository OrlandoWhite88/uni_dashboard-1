
import React from "react";
import Layout from "@/components/Layout";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import { useHSCodeGenerator } from "@/lib/hsCodeGenerator";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const {
    state,
    currentQuestion,
    result,
    error,
    startAnalysis,
    answerQuestion,
    reset
  } = useHSCodeGenerator();

  return (
    <Layout className="pt-28 pb-16">
      {state === "idle" && (
        <ProductInput 
          onSubmit={startAnalysis} 
          isLoading={false} 
        />
      )}
      
      {(state === "analyzing" || state === "generating") && (
        <div className="h-40 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="mt-4 text-muted-foreground">
              {state === "analyzing" ? "Analyzing product information..." : "Generating HS code..."}
            </p>
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
      
      {state === "error" && (
        <div className="w-full max-w-md mx-auto p-6 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Classification Error</h3>
          <p className="text-muted-foreground mb-4">{error || "An error occurred during classification. Please try again."}</p>
          <button 
            onClick={reset}
            className="text-sm font-medium text-primary hover:underline"
          >
            Start Over
          </button>
        </div>
      )}
      
      {state === "complete" && result && (
        <HSCodeResult 
          hsCode={result.code} 
          description={result.description} 
          confidence={result.confidence}
          enrichedQuery={result.enrichedQuery}
          fullPath={result.fullPath}
          onReset={reset}
        />
      )}
    </Layout>
  );
};

export default Index;
