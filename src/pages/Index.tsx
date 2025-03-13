import React from "react";
import Layout from "@/components/Layout";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import { useHSCodeGenerator } from "@/lib/hsCodeGenerator";
import { AlertCircle } from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";

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
      
      {state === "analyzing" && (
        <div className="h-40 flex items-center justify-center">
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
        <div className="h-40 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Generating HS code...</p>
          </div>
        </div>
      )}
      
      {state === "error" && (
        <div className="max-w-2xl mx-auto p-6 glass-card rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive mb-2">Classification Error</h3>
              <p className="text-muted-foreground mb-4">{error || "An unexpected error occurred while classifying your product. Please try again."}</p>
              <CustomButton onClick={reset}>
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
    </Layout>
  );
};

export default Index;