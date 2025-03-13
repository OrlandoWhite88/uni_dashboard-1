
import { useState } from "react";

// Types
export type GeneratorState = "idle" | "analyzing" | "questioning" | "generating" | "complete";

export interface HSResult {
  code: string;
  description: string;
  confidence: number;
}

export interface Question {
  id: string;
  text: string;
  options?: string[];
}

// Mock data for demonstration purposes
const MOCK_QUESTIONS: Question[] = [
  {
    id: "material",
    text: "What is the primary material of the product?",
    options: ["Cotton", "Polyester", "Leather", "Metal", "Plastic", "Other"]
  },
  {
    id: "purpose",
    text: "What is the main purpose or use of this product?",
    options: ["Clothing", "Industrial", "Electronic", "Medical", "Food", "Other"]
  },
  {
    id: "processing",
    text: "Has the product undergone any specific processing or treatment?",
  },
  {
    id: "components",
    text: "Does the product contain any electronic components or batteries?",
    options: ["Yes", "No"]
  }
];

// Mock HS code result generation
const generateMockHSCode = (): HSResult => {
  // This would be replaced with actual API call
  const codes = [
    { code: "6204.49.10", description: "Women's dresses, of artificial fibers", confidence: 95 },
    { code: "8517.12.00", description: "Telephones for cellular networks or other wireless networks", confidence: 88 },
    { code: "3926.20.90", description: "Articles of apparel and clothing accessories of plastic", confidence: 76 },
    { code: "9403.60.80", description: "Other wooden furniture", confidence: 92 },
    { code: "8471.30.01", description: "Portable automatic data processing machines", confidence: 89 },
  ];
  
  return codes[Math.floor(Math.random() * codes.length)];
};

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useHSCodeGenerator = () => {
  const [state, setState] = useState<GeneratorState>("idle");
  const [productDescription, setProductDescription] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<HSResult | null>(null);
  
  // Start the process with a product description
  const startAnalysis = async (description: string) => {
    setState("analyzing");
    setProductDescription(description);
    
    // Simulated analysis delay
    await delay(1500);
    
    setState("questioning");
    setCurrentQuestion(MOCK_QUESTIONS[0]);
  };
  
  // Handle answering a question
  const answerQuestion = async (questionId: string, answer: string) => {
    setState("analyzing");
    
    // Save the answer
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Simulated processing delay
    await delay(1000);
    
    // Move to next question or generate result
    if (questionIndex < MOCK_QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setCurrentQuestion(MOCK_QUESTIONS[questionIndex + 1]);
      setState("questioning");
    } else {
      // Final question answered, generate result
      setState("generating");
      await delay(2000);
      
      const hsResult = generateMockHSCode();
      setResult(hsResult);
      setState("complete");
    }
  };
  
  // Reset everything
  const reset = () => {
    setState("idle");
    setProductDescription("");
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
  };
  
  return {
    state,
    productDescription,
    currentQuestion,
    answers,
    result,
    startAnalysis,
    answerQuestion,
    reset
  };
};
