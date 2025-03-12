
import React, { useState } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.options && selectedOption) {
      onAnswer(question.id, selectedOption);
    } else if (answer.trim()) {
      onAnswer(question.id, answer);
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    // Auto-submit after a brief delay when an option is selected
    setTimeout(() => {
      onAnswer(question.id, option);
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6 glass-card p-6 md:p-8 rounded-xl relative overflow-hidden shadow-soft">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10">
          <div className="h-full bg-primary w-1/3 animate-pulse"></div>
        </div>
        
        <div className="flex items-start gap-5">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 mt-1">
            <MessageCircle size={17} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <h3 className="font-medium text-lg">Product Classification Assistant</h3>
              <div className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full ml-2">
                Analyzing
              </div>
            </div>
            
            <p className="text-foreground leading-relaxed mb-5">{question.text}</p>
            
            {question.options ? (
              <div className="space-y-2.5 mb-4">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all duration-200",
                      selectedOption === option 
                        ? "bg-primary/10 border-primary/30 shadow-sm transform scale-[1.01]" 
                        : "border-border hover:bg-secondary hover:border-muted"
                    )}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {selectedOption === option && (
                        <Check size={16} className="text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-4 rounded-lg border border-border bg-background/50 focus:ring-2 focus:ring-primary/30 focus-visible:outline-none pr-12"
                    placeholder="Type your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50 disabled:text-muted-foreground disabled:bg-secondary/50"
                    disabled={!answer.trim() || isLoading}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <HelpCircle size={12} className="mr-1.5" />
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
