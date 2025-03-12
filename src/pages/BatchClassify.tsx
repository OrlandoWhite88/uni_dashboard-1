
import React, { useState, useRef } from "react";
import Layout from "@/components/Layout";
import CustomButton from "@/components/ui/CustomButton";
import { Textarea } from "@/components/ui/textarea";
import QuestionFlow from "@/components/QuestionFlow";
import { CheckCircle2, Download, FileText, UploadCloud, Clipboard, ArrowRight, Loader2, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  description: string;
}

interface Question {
  id: string;
  text: string;
  options?: string[];
}

interface ClassificationResult {
  id: number;
  description: string;
  hsCode: string;
  confidence: number;
}

const BatchClassify = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"input" | "questions" | "results">("input");
  const [inputMethod, setInputMethod] = useState<"text" | "csv" | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productText, setProductText] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: "material",
    text: "What is the primary material of these products?",
    options: ["Metal", "Textile", "Plastic", "Wood", "Mixed/Other"],
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);

  // Sample questions for the flow
  const questions: Question[] = [
    {
      id: "material",
      text: "What is the primary material of these products?",
      options: ["Metal", "Textile", "Plastic", "Wood", "Mixed/Other"],
    },
    {
      id: "purpose",
      text: "What is the main purpose or intended use of these products?",
      options: ["Consumer/Retail", "Industrial", "Medical", "Food Related", "Other"],
    },
    {
      id: "processing",
      text: "Have these products undergone any specific processing or treatment?",
      options: ["Yes", "No", "Varies by product"],
    },
    {
      id: "origin",
      text: "What is the country of origin for most of these products?",
    },
  ];

  const handleProductTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProductText(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const parseProducts = () => {
    if (inputMethod === "text" && productText.trim()) {
      const lines = productText.split('\n').filter(line => line.trim());
      const parsedProducts = lines.map((line, index) => ({
        id: index + 1,
        description: line.trim()
      }));
      setProducts(parsedProducts);
      setView("questions");
    } else if (inputMethod === "csv" && csvFile) {
      // In a real app, you would parse the CSV file
      // For now, we'll just simulate it with sample data
      const sampleProducts = [
        { id: 1, description: "Yellow Pike Fillet" },
        { id: 2, description: "Men's Cotton T-Shirt" },
        { id: 3, description: "Plastic Water Bottle" },
        { id: 4, description: "Ceramic Coffee Mug" },
        { id: 5, description: "Smartphone USB Charger" },
      ];
      setProducts(sampleProducts);
      setView("questions");
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setIsLoading(true);
    
    // Save the answer
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setTimeout(() => {
      setIsLoading(false);
      
      // Move to next question or results
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(questionIndex + 1);
        setCurrentQuestion(questions[questionIndex + 1]);
      } else {
        // Generate mock results
        const mockResults = products.map(product => ({
          ...product,
          hsCode: ["0304.49.01", "6109.10.00", "3923.30.00", "6911.10.10", "8504.40.00"][Math.floor(Math.random() * 5)],
          confidence: Math.floor(Math.random() * 25) + 75,
        }));
        setResults(mockResults);
        setView("results");
      }
    }, 1000);
  };

  const handleDownloadResults = () => {
    const csv = [
      ["Product ID", "Description", "HS Code", "Confidence"],
      ...results.map(result => [
        result.id,
        result.description,
        result.hsCode,
        `${result.confidence}%`
      ])
    ].map(row => row.join(",")).join("\n");
    
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

  const resetProcess = () => {
    setView("input");
    setInputMethod(null);
    setProducts([]);
    setProductText("");
    setCsvFile(null);
    setQuestionIndex(0);
    setCurrentQuestion(questions[0]);
    setAnswers({});
    setResults([]);
  };

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Batch Classification</h1>
          <p className="text-muted-foreground">
            Classify multiple products at once by answering a few targeted questions.
          </p>
        </div>

        {view === "input" && (
          <div className="space-y-6">
            {!inputMethod ? (
              <div className="glass-card p-8 rounded-xl animate-slide-up">
                <h2 className="text-xl font-medium mb-6 text-center">How would you like to input your products?</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setInputMethod("text")}
                    className="p-6 border border-border rounded-lg hover:bg-secondary/50 transition-colors flex flex-col items-center"
                  >
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Clipboard className="text-primary" size={24} />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Text Input</h3>
                    <p className="text-muted-foreground text-center text-sm">
                      Type or paste product descriptions directly
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setInputMethod("csv")}
                    className="p-6 border border-border rounded-lg hover:bg-secondary/50 transition-colors flex flex-col items-center"
                  >
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="text-primary" size={24} />
                    </div>
                    <h3 className="text-lg font-medium mb-2">CSV Upload</h3>
                    <p className="text-muted-foreground text-center text-sm">
                      Upload a CSV file with product descriptions
                    </p>
                  </button>
                </div>
              </div>
            ) : inputMethod === "text" ? (
              <div className="glass-card p-6 rounded-xl animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium">Enter Product Descriptions</h2>
                  <button 
                    onClick={() => setInputMethod(null)}
                    className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  Enter each product description on a new line. Be as specific as possible for accurate classification.
                </p>
                
                <Textarea
                  value={productText}
                  onChange={handleProductTextChange}
                  placeholder="Yellow Pike Fillet&#10;Men's Cotton T-Shirt&#10;Plastic Water Bottle&#10;..."
                  className="min-h-[200px] mb-6"
                />
                
                <div className="flex justify-end">
                  <CustomButton 
                    onClick={parseProducts}
                    disabled={!productText.trim()}
                  >
                    Continue <ArrowRight size={16} className="ml-1" />
                  </CustomButton>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 rounded-xl animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium">Upload CSV File</h2>
                  <button 
                    onClick={() => setInputMethod(null)}
                    className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-6">
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <UploadCloud className="text-muted-foreground" size={28} />
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Drag and drop your CSV file here, or click to browse. File should have a column for product descriptions.
                    </p>
                    
                    <input
                      type="file"
                      id="csv-upload"
                      ref={fileInputRef}
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={handleBrowseClick} 
                      className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      Browse Files
                    </button>
                    
                    {csvFile && (
                      <div className="mt-4 p-3 bg-secondary rounded-lg">
                        <div className="flex items-center text-sm">
                          <FileText size={14} className="mr-2" />
                          <span>{csvFile.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <CustomButton 
                    onClick={parseProducts}
                    disabled={!csvFile}
                  >
                    Continue <ArrowRight size={16} className="ml-1" />
                  </CustomButton>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "questions" && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Products to Classify ({products.length})</h2>
                <button 
                  onClick={resetProcess}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Start Over
                </button>
              </div>
              
              <div className="overflow-x-auto max-h-48 overflow-y-auto mb-4 border border-border rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="py-2 px-4 text-left text-sm font-medium text-muted-foreground">ID</th>
                      <th className="py-2 px-4 text-left text-sm font-medium text-muted-foreground">Product Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2 px-4 text-sm">{product.id}</td>
                        <td className="py-2 px-4 text-sm">{product.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MessageCircle size={14} />
                <span>Answer the following questions to classify all products at once</span>
              </div>
              
              <div className="w-full bg-secondary/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out-expo"
                  style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                <span>Question {questionIndex + 1} of {questions.length}</span>
                <span>{Math.round(((questionIndex + 1) / questions.length) * 100)}% Complete</span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Processing your answer...</p>
              </div>
            ) : (
              <QuestionFlow 
                question={currentQuestion}
                onAnswer={handleAnswer}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {view === "results" && (
          <div className="glass-card p-6 rounded-xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CheckCircle2 size={20} className="text-green-600 mr-2" />
                <h2 className="text-xl font-medium">Classification Results</h2>
              </div>
              
              <div className="flex gap-2">
                <CustomButton variant="outline" size="sm" onClick={resetProcess}>
                  Classify More
                </CustomButton>
                <CustomButton onClick={handleDownloadResults} size="sm">
                  <Download size={14} className="mr-2" /> Export CSV
                </CustomButton>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Product Description</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">HS Code</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Confidence</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">{result.description}</td>
                      <td className="py-3 px-4 font-medium">{result.hsCode}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className={
                            result.confidence > 85 ? "text-green-600" :
                            result.confidence > 70 ? "text-amber-600" :
                            "text-red-600"
                          }>
                            {result.confidence}%
                          </span>
                          <div className="ml-2 h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                result.confidence > 85 ? "bg-green-600" :
                                result.confidence > 70 ? "bg-amber-600" :
                                "bg-red-600"
                              }`}
                              style={{ width: `${result.confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                          Explain
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BatchClassify;
