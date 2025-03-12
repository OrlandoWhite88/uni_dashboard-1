
import React from "react";
import Layout from "@/components/Layout";
import ProductInput from "@/components/ProductInput";
import QuestionFlow from "@/components/QuestionFlow";
import HSCodeResult from "@/components/HSCodeResult";
import { useHSCodeGenerator } from "@/lib/hsCodeGenerator";

const Index = () => {
  const {
    state,
    currentQuestion,
    result,
    startAnalysis,
    answerQuestion,
    reset
  } = useHSCodeGenerator();

  return (
    <Layout className="pt-20 pb-16">
      {state === "idle" && (
        <ProductInput 
          onSubmit={startAnalysis} 
          isLoading={false} 
        />
      )}
      
      {state === "analyzing" && (
        <div className="h-60 flex items-center justify-center">
          <div className="flex flex-col items-center animate-fade-in">
            <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="mt-5 text-muted-foreground">Analyzing product information...</p>
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
        <div className="h-60 flex items-center justify-center">
          <div className="flex flex-col items-center animate-fade-in">
            <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="mt-5 text-muted-foreground">Generating HS code...</p>
          </div>
        </div>
      )}
      
      {state === "complete" && result && (
        <HSCodeResult 
          hsCode={result.code} 
          description={result.description} 
          confidence={result.confidence}
          onReset={reset}
        />
      )}
    </Layout>
  );
};

export default Index;
