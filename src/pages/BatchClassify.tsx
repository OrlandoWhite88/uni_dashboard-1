import React, { useMemo, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CustomButton from "@/components/ui/CustomButton";
import { trackClassificationStart, trackQuestionAnswer, trackClassificationResult } from "@/lib/analyticsService";
import { CheckCircle2, Download, FileText, MessageCircle, Zap, ArrowUp, Clock, ChevronDown, AlertTriangle, ExternalLink } from "lucide-react";
import ProductDetailsModal from "@/components/ProductDetailsModal";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { useNavigate } from "react-router-dom";
import _ from "lodash";
import { 
  classifyProduct, 
  continueClassification, 
  ClassificationResponse,
  Options
} from "@/lib/classifierService";
import { saveClassification } from "@/lib/supabaseService";
import { useUser } from "@clerk/clerk-react";
import QuestionFlow from "@/components/QuestionFlow";

interface Product {
  id: number;
  description: string;
}

interface ProductClassificationState {
  status: 'pending' | 'classifying' | 'question' | 'completed' | 'error';
  productId: number;
  state?: any; // API state
  currentQuestion?: {
    id: string;
    text: string;
    options?: Options[];
  };
  result?: {
    hsCode: string;
    confidence: number;
    description?: string;
  };
  error?: string;
}

interface ClassificationResult {
  id: number;
  description: string;
  hsCode: string;
  confidence: number;
}

interface Question {
  productId: number;
  questionId: string;
  text: string;
  options?: Options[];
  state: any;
  productDescription: string;
}

const BatchClassify = ({ csvFile }: { csvFile: string | ArrayBuffer }) => {
  // Get user's plan information
  const { userPlan, isLoading: isPlanLoading } = useUsageLimits();
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Check if user is on free plan
  const isFreePlan = userPlan?.plan_type === 'free';
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false);
  
  // Parse products from the input
  const products = useMemo(() => {
    // Convert input to string if it's not already
    const fileContent = csvFile.toString();
    
    // Check if it's CSV or plain text (one item per line)
    if (fileContent.includes(',')) {
      // CSV processing
      const lines = fileContent.split('\n');
      const nonEmptyLines = _.compact(lines.map(line => line.trim()));
      
      if (nonEmptyLines.length === 0) return [];
      
      // Check if first line has headers
      const firstLine = nonEmptyLines[0];
      const firstLineParts = firstLine.split(',').map(part => part.trim());
      
      const hasHeader = firstLineParts.some(part => 
        part.toLowerCase().includes('product') || 
        part.toLowerCase().includes('description') ||
        part.toLowerCase().includes('item') ||
        part.toLowerCase().includes('name') ||
        part.toLowerCase().includes('title')
      );
      
      let headers: string[] = [];
      let dataStartIndex = 0;
      
      if (hasHeader) {
        headers = firstLineParts;
        dataStartIndex = 1;
      }
      
      // Process data rows
      return nonEmptyLines.slice(dataStartIndex).map((line, i) => {
        const parts = line.split(',').map(part => part.trim());
        
        // Build description with full context
        let description = '';
        
        if (headers.length > 0) {
          // Use headers to build structured description
          const fieldDescriptions: string[] = [];
          parts.forEach((part, index) => {
            if (part && index < headers.length) {
              fieldDescriptions.push(`${headers[index]}: ${part}`);
            }
          });
          description = fieldDescriptions.join(', ');
        } else {
          // No headers, just join all parts
          description = parts.filter(part => part).join(', ');
        }
        
        return {
          id: i + 1,
          description: description || line.trim()
        };
      });
    } else {
      // Plain text processing - one product per line
      return _.compact(fileContent.split('\n')).map((line, i) => ({
        id: i + 1,
        description: line.trim()
      }));
    }
  }, [csvFile]);

  // State management
  const [classificationStates, setClassificationStates] = useState<Record<number, ProductClassificationState>>({});
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<{
    productId: number;
    questionText: string;
    answer: string;
  }[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<ClassificationResult | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Handle viewing product details
  const handleViewDetails = (result: ClassificationResult) => {
    setSelectedResult(result);
    setIsDetailsModalOpen(true);
  };
  
  // Handle closing the details modal
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedResult(null);
  };

  // Handle navigation to upgrade page
  const handleUpgrade = () => {
    navigate('/settings');
  };

  // Start classification for all products at once
  const startClassifyingAllProducts = async () => {
    // Check if user is on free plan - block batch processing
    if (isFreePlan) {
      console.log('Batch processing not available on free plan');
      setShowUpgradeMessage(true);
      return;
    }
    
    // Track batch classification start event
    trackClassificationStart(`Batch of ${products.length} products`);
    
    setIsProcessingAll(true);
    
    // Initialize states for all products
    const initialStates: Record<number, ProductClassificationState> = {};
    products.forEach(product => {
      initialStates[product.id] = {
        status: 'classifying',
        productId: product.id
      };
    });
    setClassificationStates(initialStates);
    
    // Start classification for each product in parallel
    const promises = products.map(product => classifyProductAndHandleState(product));
    
    // Wait for all initial classifications to complete
    await Promise.allSettled(promises);
    
    setIsProcessingAll(false);
  };

  // Use streaming endpoint silently (without UI) to get updated classification logic
  const classifyProductWithStreaming = async (product: Product): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('https://hscode-eight.vercel.app/classify/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product: product.description,
            interactive: true,
            max_questions: 3,
            use_multi_hypothesis: true,
            hypothesis_count: 3
          })
        });

        if (!response.ok) {
          throw new Error(`Stream failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body available');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalResult = null;
        let currentQuestion = null;
        let currentState = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Add new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete events from buffer
          let eventEndIndex;
          while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
            const eventText = buffer.substring(0, eventEndIndex);
            buffer = buffer.substring(eventEndIndex + 2);
            
            // Parse the complete event
            const lines = eventText.split('\n');
            let dataLines = [];
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                dataLines.push(line.substring(6));
              }
            }
            
            if (dataLines.length > 0) {
              try {
                const jsonData = dataLines.join('');
                const eventData = JSON.parse(jsonData);
                
                if (eventData.type === 'classification_complete') {
                  finalResult = eventData.data;
                  reader.cancel();
                  resolve(finalResult);
                  return;
                } else if (eventData.type === 'question_generated') {
                  currentQuestion = eventData.data;
                  currentState = eventData.data.state || eventData.data.classification_state;
                  reader.cancel();
                  resolve({
                    clarification_question: currentQuestion.question,
                    state: currentState
                  });
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE event:', dataLines.join(''), parseError);
              }
            }
          }
        }

        // If we get here without a final result or question, something went wrong
        reject(new Error('Stream ended without final result or question'));
      } catch (error) {
        reject(error);
      }
    });
  };

  // Continue classification with streaming endpoint silently
  const continueClassificationWithStreaming = async (state: any, answer: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('https://hscode-eight.vercel.app/classify/continue/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: state,
            answer: answer
          })
        });

        if (!response.ok) {
          throw new Error(`Continue stream failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body available for continuation');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalResult = null;
        let currentQuestion = null;
        let currentState = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let eventEndIndex;
          while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
            const eventText = buffer.substring(0, eventEndIndex);
            buffer = buffer.substring(eventEndIndex + 2);
            
            const lines = eventText.split('\n');
            let dataLines = [];
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                dataLines.push(line.substring(6));
              }
            }
            
            if (dataLines.length > 0) {
              try {
                const jsonData = dataLines.join('');
                const eventData = JSON.parse(jsonData);
                
                if (eventData.type === 'classification_complete') {
                  finalResult = eventData.data;
                  reader.cancel();
                  resolve(finalResult);
                  return;
                } else if (eventData.type === 'question_generated') {
                  currentQuestion = eventData.data;
                  currentState = eventData.data.state || eventData.data.classification_state;
                  reader.cancel();
                  resolve({
                    clarification_question: currentQuestion.question,
                    state: currentState
                  });
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse continuation SSE event:', dataLines.join(''), parseError);
              }
            }
          }
        }

        reject(new Error('Continue stream ended without final result or question'));
      } catch (error) {
        reject(error);
      }
    });
  };

  // Classify a single product and update its state
  const classifyProductAndHandleState = async (product: Product) => {
    try {
      console.log(`Starting classification for product ${product.id}: ${product.description}`);
      
      // Track individual product classification start
      trackClassificationStart(`Batch item: ${product.description.substring(0, 30)}${product.description.length > 30 ? '...' : ''}`);
      
      // Use streaming endpoint to get updated classification logic
      const response = await classifyProductWithStreaming(product);
      
      // Process the API response
      handleClassificationResponse(product.id, response, product.description);
    } catch (error) {
      console.error(`Error classifying product ${product.id}:`, error);
      // Handle error state
      setClassificationStates(prev => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }));
    }
  };

  // Handle classification response - can be a question or final result
  const handleClassificationResponse = async (productId: number, response: any, productDescription: string) => {
    console.log(`Processing response for product ${productId}:`, response);
    
    // If response is a string, it's a direct HS code result
    if (typeof response === "string") {
      // Use a fixed high confidence range between 94-99%
      let confidence = 94; // Base confidence for direct string responses
      
      // Track classification result event
      trackClassificationResult(response);
      
      // Add to completed results
      setResults(prev => [
        ...prev,
        {
          id: productId,
          description: productDescription,
          hsCode: response,
          confidence
        }
      ]);
      
      // Update state
      setClassificationStates(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          status: 'completed',
          result: {
            hsCode: response,
            confidence
          }
        }
      }));
      
      return;
    }
    
    // Handle object response (usually a question)
    if (response && typeof response === "object") {
      // Check for the new API format with 'final' flag
      if ("final" in response) {
        if (response.final === true) {
          // This is a final classification response
          let finalCode = "Unknown";
          if (response.classification && response.classification.code) {
            finalCode = String(response.classification.code);
          } else if (response.final_code) {
            finalCode = String(response.final_code);
          }
          
          // Track classification result event
          trackClassificationResult(finalCode);
          
          // Calculate confidence score
          let confidence = 94;
          const hasDescription = !!response.enriched_query;
          const hasPath = !!(response.classification?.path || response.full_path);
          
          // Use log_score for most accurate confidence calculation
          if (response.classification && typeof response.classification.log_score === "number") {
            const logScore = response.classification.log_score;
            if (logScore >= -0.1) confidence = 99;
            else if (logScore >= -0.3) confidence = 97;
            else if (logScore >= -0.5) confidence = 95;
            else if (logScore >= -0.8) confidence = 92;
            else if (logScore >= -1.2) confidence = 88;
            else confidence = 85;
          } else {
            if (hasDescription) confidence += 2;
            if (hasPath) confidence += 3;
            confidence = Math.min(confidence, 99);
          }
          
          // Add to completed results
          setResults(prev => [
            ...prev,
            {
              id: productId,
              description: productDescription,
              hsCode: finalCode,
              confidence
            }
          ]);
          
          // Update state
          setClassificationStates(prev => ({
            ...prev,
            [productId]: {
              ...prev[productId],
              status: 'completed',
              result: {
                hsCode: finalCode,
                confidence,
                description: response.enriched_query
              }
            }
          }));
          
          // Save classification to database
          if (user?.id) {
            try {
              await saveClassification({
                user_id: user.id,
                user_email: user.emailAddresses?.[0]?.emailAddress,
                product_description: productDescription,
                hs_code: finalCode,
                confidence: confidence,
                full_path: response.classification?.path || response.full_path
              });
              console.log(`Classification saved for product ${productId}`);
            } catch (error) {
              console.error(`Failed to save classification for product ${productId}:`, error);
            }
          }
          
          return;
        } else {
          // This is a clarification question response
          if (response.clarification_question) {
            const question = response.clarification_question;
            
            // Extract question text
            let questionText = "Please provide more information";
            if (question && typeof question.question_text === "string") {
              questionText = question.question_text;
            }
            
            // Extract options if available
            let options: Options[] = [];
            if (question && Array.isArray(question.options)) {
              options = question.options.map((opt, index) => {
                if (opt && typeof opt === "object" && "id" in opt && "text" in opt) {
                  return { id: String(opt.id), text: String(opt.text) };
                } else if (typeof opt === "string") {
                  return { id: String(index + 1), text: opt };
                } else if (opt && typeof opt === "object" && "text" in opt) {
                  return { id: String(index + 1), text: String(opt.text) };
                } else {
                  return { id: String(index + 1), text: String(opt) };
                }
              });
            }
            
            const questionId = `question-${productId}-${Date.now()}`;
            
            // Update state with question
            setClassificationStates(prev => ({
              ...prev,
              [productId]: {
                ...prev[productId],
                status: 'question',
                state: response.state,
                currentQuestion: {
                  id: questionId,
                  text: questionText,
                  options: options
                }
              }
            }));
            
            // Add to active questions queue
            setActiveQuestions(prev => [
              ...prev,
              {
                productId,
                questionId,
                text: questionText,
                options,
                state: response.state,
                productDescription
              }
            ]);
          }
          return;
        }
      }
      
      // Legacy format handling - Check if it's a final classification
      if ("final_code" in response) {
        // Calculate confidence score based on available information
        const hasDescription = !!response.enriched_query;
        const hasPath = !!response.full_path;
        
        // Track classification result event
        trackClassificationResult(response.final_code);
        
        // Start with base confidence of 94%
        let confidence = 94;
        
        // Add confidence if we have enriched description
        if (hasDescription) {
          confidence += 2;
        }
        
        // Add confidence if we have full path
        if (hasPath) {
          confidence += 3;
        }
        
        // Cap at 99% - high confidence but never 100%
        confidence = Math.min(confidence, 99);
        
        // Add to completed results
        setResults(prev => [
          ...prev,
          {
            id: productId,
            description: productDescription,
            hsCode: response.final_code,
            confidence
          }
        ]);
        
        // Update state
        setClassificationStates(prev => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            status: 'completed',
            result: {
              hsCode: response.final_code,
              confidence,
              description: response.enriched_query
            }
          }
        }));
        
        return;
      }
      
      // If it has a clarification question, process it
      if ("clarification_question" in response) {
        const question = response.clarification_question;
        
        // Extract question text
        let questionText = "Please provide more information";
        if (question && typeof question.question_text === "string") {
          questionText = question.question_text;
        }
        
        // Extract options if available
        let options: Options[] = [];
        if (question && Array.isArray(question.options)) {
          options = question.options.map((opt, index) => {
            // If option is already an object with id and text
            if (opt && typeof opt === "object" && "id" in opt && "text" in opt) {
              return {
                id: String(opt.id),
                text: String(opt.text)
              };
            }
            // If option is just a string or has only text property
            else if (typeof opt === "string") {
              return {
                id: String(index + 1),
                text: opt
              };
            }
            else if (opt && typeof opt === "object" && "text" in opt) {
              return {
                id: String(index + 1),
                text: String(opt.text)
              };
            }
            // Fallback
            else {
              return {
                id: String(index + 1),
                text: String(opt)
              };
            }
          });
        }
        
        const questionId = `question-${productId}-${Date.now()}`;
        
        // Update state with question
        setClassificationStates(prev => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            status: 'question',
            state: response.state,
            currentQuestion: {
              id: questionId,
              text: questionText,
              options: options
            }
          }
        }));
        
        // Add to active questions queue
        setActiveQuestions(prev => [
          ...prev,
          {
            productId,
            questionId,
            text: questionText,
            options,
            state: response.state,
            productDescription
          }
        ]);
      }
    }
  };

  // Handle user answering a question  
  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    // Find the question in the active questions
    const questionIndex = activeQuestions.findIndex(q => q.questionId === questionId);
    if (questionIndex === -1) return;
    
    const question = activeQuestions[questionIndex];
    const { productId, state, productDescription, text } = question;
    
    try {
      console.log(`Answering question for product ${productId}: ${answer}`);
      
      // Track question answer event
      trackQuestionAnswer(text, answer);
      
      // Remove the question from active questions
      setActiveQuestions(prev => prev.filter((_, i) => i !== questionIndex));
      
      // Add to answered questions
      setAnsweredQuestions(prev => [
        ...prev,
        {
          productId,
          questionText: text,
          answer
        }
      ]);
      
      // Update state to show it's processing the answer
      setClassificationStates(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          status: 'classifying'
        }
      }));
      
      // Use streaming endpoint to continue classification with the answer
      const response = await continueClassificationWithStreaming(state, answer);
      console.log(`Continuation response for product ${productId}:`, response);
      
      // Process the response using the exact same logic as initial classification
      handleClassificationResponse(productId, response, productDescription);
    } catch (error) {
      console.error(`Error processing answer for product ${productId}:`, error);
      // Handle error
      setClassificationStates(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }));
    }
  };

  // Initialize all products on component mount
  useEffect(() => {
    if (products.length > 0 && Object.keys(classificationStates).length === 0 && !isPlanLoading) {
      startClassifyingAllProducts();
    }
  }, [products, isPlanLoading]);

  const handleDownloadResults = () => {
    const csv = [
      ["Product ID", "Description", "HS Code", "Confidence", "Tariff Information"],
      ...results.map((result) => [
        result.id,
        result.description,
        result.hsCode,
        `${result.confidence}%`,
        `https://www.uni-customs.com/tariff/${result.hsCode}`
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hs-code-results.csv";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Progress calculation
  const completedCount = results.length;
  const totalCount = products.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            Batch Classification
          </h1>
          <p className="text-muted-foreground">
            Answer questions about your products to get accurate HS code
            classifications for all items.
          </p>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Progress: {completedCount} of {totalCount} products classified
              </span>
              <span className="text-sm font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Free plan upgrade message */}
        {showUpgradeMessage && (
          <div className="glass-card p-6 rounded-xl mb-6 border border-amber-400">
            <div className="flex items-start">
              <AlertTriangle size={24} className="text-amber-500 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium mb-2">Batch Processing Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  Batch processing is only available on the Pro plan. Please upgrade your account to access this feature.
                </p>
                <CustomButton onClick={handleUpgrade}>
                  Upgrade to Pro
                </CustomButton>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Product list */}
          <div className="lg:col-span-5">
            <div className="glass-card p-5 rounded-xl h-full">
              <h2 className="text-xl font-medium mb-4">
                Imported Products ({products.length})
              </h2>

              <div className="overflow-y-auto max-h-[60vh]">
                <table className="min-w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground rounded-tl-lg">
                        ID
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                        Product Description
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground rounded-tr-lg">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => {
                      const state = classificationStates[product.id];
                      const isQuestionActive = activeQuestions.some(q => q.productId === product.id);
                      
                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-secondary/20 transition-colors ${
                            isQuestionActive ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="py-2.5 px-4 text-sm">{product.id}</td>
                          <td className="py-2.5 px-4 text-sm">
                            {product.description}
                          </td>
                          <td className="py-2.5 px-4 text-sm">
                            {state?.status === 'completed' ? (
                              <span className="inline-flex items-center text-green-600">
                                <CheckCircle2 size={14} className="mr-1" />
                                Completed
                              </span>
                            ) : state?.status === 'question' ? (
                              <span className="inline-flex items-center text-primary">
                                <MessageCircle size={14} className="mr-1" />
                                Question
                              </span>
                            ) : state?.status === 'classifying' ? (
                              <span className="inline-flex items-center text-amber-600">
                                <Clock size={14} className="mr-1" />
                                Processing
                              </span>
                            ) : state?.status === 'error' ? (
                              <span className="inline-flex items-center text-red-500">
                                Error
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Questions and Results */}
          <div className="lg:col-span-7">
            {/* Loading indicator */}
            {isProcessingAll && (
              <div className="glass-card p-6 rounded-xl mb-4 text-center">
                <div className="py-4 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
                  <p className="text-muted-foreground">
                    Processing products...
                  </p>
                </div>
              </div>
            )}

            {/* Questions - show one at a time */}
            {activeQuestions.length > 0 && (
              <div className="glass-card p-6 rounded-xl mb-4">
                <div className="p-3 bg-primary/10 rounded-lg mb-3 flex items-center">
                  <MessageCircle size={16} className="text-primary mr-2" />
                  <span>Currently classifying: <strong>{activeQuestions[0].productDescription}</strong></span>
                </div>
                
                <QuestionFlow
                  question={{
                    id: activeQuestions[0].questionId,
                    text: activeQuestions[0].text,
                    options: activeQuestions[0].options
                  }}
                  onAnswer={handleAnswerQuestion}
                  isLoading={false}
                />
                
                {activeQuestions.length > 1 && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground flex items-center">
                    <ArrowUp size={14} className="mr-2" />
                    <span>{activeQuestions.length - 1} more questions waiting to be answered</span>
                  </div>
                )}
              </div>
            )}

            {/* Answered questions history - collapsed by default */}
            {answeredQuestions.length > 0 && (
              <div className="glass-card p-4 rounded-xl mb-4">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    <h3>Previously Answered Questions ({answeredQuestions.length})</h3>
                    <span className="transition group-open:rotate-180">
                      <ChevronDown size={18} />
                    </span>
                  </summary>
                  <div className="mt-3 text-sm divide-y divide-border">
                    {answeredQuestions.map((qa, idx) => (
                      <div key={idx} className="py-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Product {qa.productId}</span>
                          <span className="text-muted-foreground text-xs">
                            Answered
                          </span>
                        </div>
                        <p className="mt-1">{qa.questionText}</p>
                        <p className="mt-1 text-primary">
                          Answer: {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Results table */}
            {results.length > 0 && (
              <div className="glass-card p-6 rounded-xl animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle2 size={18} className="text-green-600 mr-2" />
                    <h3 className="text-lg font-medium">Classification Results</h3>
                  </div>

                  <CustomButton onClick={handleDownloadResults} size="sm">
                    <Download size={14} className="mr-2" /> Export CSV
                  </CustomButton>
                </div>

                <div className="overflow-y-auto max-h-[400px]">
                  <table className="min-w-full">
                    <thead className="bg-secondary/50 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                          HS Code
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                          Confidence
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.map((result) => (
                        <tr
                          key={result.id}
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          <td className="py-3 px-4 max-w-xs truncate" title={result.description}>
                            {result.description}
                          </td>
                          <td className="py-3 px-4 font-medium">{result.hsCode}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <span className="text-green-600">
                                {result.confidence}%
                              </span>
                              <div className="ml-2 h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600"
                                  style={{ width: `${result.confidence}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <CustomButton 
                              onClick={() => handleViewDetails(result)} 
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <ExternalLink size={12} className="mr-1" />
                              View Details
                            </CustomButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedResult && (
        <ProductDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          product={selectedResult.description}
          hsCode={selectedResult.hsCode}
          confidence={selectedResult.confidence}
        />
      )}
    </Layout>
  );
};

export default BatchClassify;
