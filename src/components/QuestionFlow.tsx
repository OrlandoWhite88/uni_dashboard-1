import React, { useState, useEffect } from "react";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";
import { ArrowRight, MessageCircle, Check, X, HelpCircle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options?: string[];
}

interface QuestionFlowProps {
  question: Question;
  onAnswer: (questionId: string, answer: string) => void;
  isLoading: boolean;
}

const QuestionFlow = ({ question, onAnswer, isLoading }: QuestionFlowProps) => {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Debug log when question changes
  useEffect(() => {
    console.log("[QuestionFlow] Received question:", question);
    console.log("[QuestionFlow] Question text type:", typeof question.text);
    console.log("[QuestionFlow] Question options:", question.options);
    console.log("[QuestionFlow] Question options type:", Array.isArray(question.options) ? "array" : typeof question.options);
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.options && selectedOption) {
      console.log("[QuestionFlow] Submitting selected option:", selectedOption);
      onAnswer(question.id, selectedOption);
    } else if (answer.trim()) {
      console.log("[QuestionFlow] Submitting text answer:", answer);
      onAnswer(question.id, answer);
    }
  };

  const handleOptionSelect = (option: string) => {
    console.log("[QuestionFlow] Option selected:", option);
    setSelectedOption(option);
    // Auto-submit after a brief delay when an option is selected
    setTimeout(() => {
      onAnswer(question.id, option);
    }, 500);
  };

  // Guard against invalid question objects to prevent rendering errors
  if (!question || typeof question !== 'object') {
    console.error("[QuestionFlow] Invalid question object received:", question);
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 glass-card p-6 rounded-xl">
          <div className="text-destructive">Error: Invalid question format</div>
          <p className="mt-2 text-sm text-muted-foreground">
            The system received an invalid question object. Please try again or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  // Guard specifically against non-string text
  if (typeof question.text !== 'string') {
    console.error("[QuestionFlow] Invalid question text type:", typeof question.text, "Value:", question.text);
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 glass-card p-6 rounded-xl">
          <div className="text-destructive">Error: Invalid question text format</div>
          <p className="mt-2 text-sm text-muted-foreground">
            The system received a question with an invalid text format. Please try again or contact support if the issue persists.
          </p>
          <pre className="mt-4 p-2 bg-secondary/50 text-xs rounded overflow-auto max-h-20">
            {JSON.stringify(question, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6 glass-card p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
          <div className="h-full bg-primary w-1/3 animate-pulse"></div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 mt-1">
            <MessageCircle size={17} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <h3 className="font-medium">Product Classification Assistant</h3>
              <div className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded ml-2">
                Analyzing
              </div>
            </div>
            
            <p className="text-foreground leading-relaxed mb-4">{question.text}</p>
            
            {question.options && Array.isArray(question.options) && question.options.length > 0 ? (
              <div className="space-y-2.5 mb-4">
                {question.options.map((option, index) => {
                  // Ensure option is a string
                  const optionStr = typeof option === 'string' ? option : String(option);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleOptionSelect(optionStr)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-lg border transition-all duration-200",
                        selectedOption === optionStr 
                          ? "bg-primary/10 border-primary/30 shadow-sm" 
                          : "border-border hover:bg-secondary hover:border-muted"
                      )}
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-between">
                        <span>{optionStr}</span>
                        {selectedOption === optionStr && (
                          <Check size={16} className="text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3.5 rounded-lg border border-border bg-transparent focus:ring-2 focus:ring-primary/30 focus-visible:outline-none pr-12"
                    placeholder="Type your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 text-primary disabled:opacity-50 disabled:text-muted-foreground disabled:bg-secondary/50"
                    disabled={!answer.trim() || isLoading}
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <HelpCircle size={12} className="mr-1" />
                  <span>Provide as much detail as possible for accurate classification</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionFlow;