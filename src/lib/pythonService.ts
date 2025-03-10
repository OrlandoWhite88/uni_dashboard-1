
import { toast } from "sonner";

interface ClassificationResult {
  code: string;
  description: string;
  confidence: number;
}

export const classifyProduct = async (productDescription: string): Promise<ClassificationResult> => {
  try {
    // In a production environment, this would use Node.js child_process
    // to execute the Python script. In the browser environment, we'll
    // simulate this with a call to the OpenAI API.
    
    console.log(`Classifying product: ${productDescription}`);
    console.log(`Would execute: python ai_code/tree_engine.py classify --tree ai_code/hs_code_tree.pkl --product "${productDescription}"`);
    
    // Since we can't directly run Python from the browser, we'll use the OpenAI approach
    // as a fallback for now. In a real deployment, this would be replaced with actual Python execution.
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not defined");
    }
    
    // Create a prompt that simulates the output format of your Python script
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
    const content = data.choices[0].message.content.trim();
    
    // Parse the response to extract code, description, and confidence
    const codeMatch = content.match(/CODE:\s*([^\n]+)/);
    const descriptionMatch = content.match(/DESCRIPTION:\s*([^\n]+)/);
    const confidenceMatch = content.match(/CONFIDENCE:\s*(\d+)%/);
    
    if (!codeMatch || !descriptionMatch || !confidenceMatch) {
      throw new Error("Failed to parse classification response");
    }
    
    return {
      code: codeMatch[1].trim(),
      description: descriptionMatch[1].trim(),
      confidence: parseInt(confidenceMatch[1], 10)
    };
  } catch (error) {
    console.error("Classification error:", error);
    toast.error("Failed to classify product. Please try again.");
    throw error;
  }
};
