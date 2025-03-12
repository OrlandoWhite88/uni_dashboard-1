
import React, { useState } from "react";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";
import { ArrowRight, MessageCircle, Check, X, HelpCircle, LightbulbIcon } from "lucide-react";

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
      <div className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl relative overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
          <div className="h-full bg-primary w-1/3 animate-pulse"></div>
        </div>
        
        <div className="flex items-start gap-4 p-6">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 mt-1">
            <MessageCircle size={17} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold">Product Classification Assistant</h3>
              <div className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                Analyzing
              </div>
            </div>
            
            <p className="text-foreground leading-relaxed mb-4">{question.text}</p>
            
            {question.options ? (
              <div className="space-y-2.5 mb-4">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-lg border transition-all duration-200",
                      selectedOption === option 
                        ? "bg-primary/10 border-primary/30 shadow-sm" 
                        : "border-border hover:bg-secondary hover:border-muted"
                    )}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
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
                    className="w-full p-3.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/30 focus-visible:outline-none pr-12"
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
                
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  <LightbulbIcon size={12} className="shrink-0" />
                  <span>Provide as much detail as possible about materials, uses, and components for accurate classification</span>
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
