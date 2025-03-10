
import { useState } from "react";
import { toast } from "sonner";

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

// OpenAI API client
const callOpenAI = async (prompt: string) => {
  try {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not defined");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a customs classification expert helping to assign HS codes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to communicate with OpenAI API");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
};

// Mock questions for demonstration purposes
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

// Helper for simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main classification function that uses OpenAI to determine HS code
const classifyProduct = async (productDescription: string): Promise<HSResult> => {
  try {
    // Create a prompt for OpenAI to classify the product
    const prompt = `
    Determine the appropriate Harmonized System (HS) code for the following product:
    
    PRODUCT: ${productDescription}
    
    Please provide:
    1. The most specific HS code (at least 6 digits)
    2. A brief description of the classification
    3. Your confidence level (as a percentage)
    
    Format your response exactly like this:
    CODE: [HS code]
    DESCRIPTION: [brief description]
    CONFIDENCE: [number]%
    `;

    const response = await callOpenAI(prompt);
    
    // Parse the response to extract code, description, and confidence
    const codeMatch = response.match(/CODE:\s*([^\n]+)/);
    const descriptionMatch = response.match(/DESCRIPTION:\s*([^\n]+)/);
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)%/);
    
    if (!codeMatch || !descriptionMatch || !confidenceMatch) {
      throw new Error("Failed to parse classification response");
    }
    
    const code = codeMatch[1].trim();
    const description = descriptionMatch[1].trim();
    const confidence = parseInt(confidenceMatch[1], 10);
    
    return { code, description, confidence };
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
};

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
    
    try {
      // In a more advanced implementation, we'd analyze the product and
      // determine if we need to ask questions or can proceed directly
      // For now, we'll simulate a delay and move to questioning
      await delay(1500);
      
      // Later, this logic can be enhanced to decide whether to ask questions
      // or proceed directly to classification based on the product description
      setState("questioning");
      setCurrentQuestion(MOCK_QUESTIONS[0]);
    } catch (error) {
      console.error("Error starting analysis:", error);
      toast.error("Failed to start analysis. Please try again.");
      setState("idle");
    }
  };
  
  // Handle answering a question
  const answerQuestion = async (questionId: string, answer: string) => {
    setState("analyzing");
    
    // Save the answer
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    try {
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
        
        try {
          // Use collected answers to enhance the classification
          const enhancedDescription = `
            Product: ${productDescription}
            
            Additional Information:
            ${Object.entries(answers).map(([key, value]) => {
              const question = MOCK_QUESTIONS.find(q => q.id === key);
              return `${question?.text}: ${value}`;
            }).join('\n')}
          `;
          
          const hsResult = await classifyProduct(enhancedDescription);
          setResult(hsResult);
          setState("complete");
        } catch (error) {
          console.error("Error classifying product:", error);
          toast.error("Failed to generate HS code. Please try again.");
          setState("idle");
        }
      }
    } catch (error) {
      console.error("Error processing answer:", error);
      toast.error("Failed to process your answer. Please try again.");
      setState("idle");
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
