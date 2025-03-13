
import React from "react";
import Layout from "@/components/Layout";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import { useHSCodeGenerator } from "@/lib/hsCodeGenerator";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  
  const { toast } = useToast();
  
  // Show toast when error occurs
  React.useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error, toast]);

  return (
    <Layout className="pt-28 pb-16">
      {(state === "idle" || state === "error") && (
        <ProductInput 
          onSubmit={startAnalysis} 
          isLoading={state === "analyzing"} 
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
          isLoading={state === "analyzing"} 
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
      
      {state === "error" && (
        <div className="w-full max-w-xl mx-auto mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <p className="text-destructive font-medium">
              An error occurred during classification. Please try again.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;
