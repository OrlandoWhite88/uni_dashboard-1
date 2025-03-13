
import React, { useState } from "react";
import Layout from "@/components/Layout";
import CustomButton from "@/components/ui/CustomButton";
import { CheckCircle2, Download, FileText, MessageCircle } from "lucide-react";

const sampleProducts = [
  { id: 1, description: "Yellow Pike Fillet" },
  { id: 2, description: "Men's Cotton T-Shirt" },
  { id: 3, description: "Plastic Water Bottle" },
  { id: 4, description: "Ceramic Coffee Mug" },
  { id: 5, description: "Smartphone USB Charger" },
];

interface Question {
  id: string;
  text: string;
  options?: string[];
}

const BatchClassify = () => {
  const [currentStep, setCurrentStep] = useState<"questions" | "results">("questions");
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: "processing",
    text: "Have these products undergone any specific processing or treatment?",
    options: ["Yes", "No", "Varies by product"],
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{ id: number, description: string, hsCode: string, confidence: number }>>([]);

  const handleAnswerQuestion = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    // Simulate moving to the next question or results
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep("results");
      
      // Mock results
      setResults(sampleProducts.map(product => ({
        ...product,
        hsCode: ["0304.49.01", "6109.10.00", "3923.30.00", "6911.10.10", "8504.40.00"][Math.floor(Math.random() * 5)],
        confidence: Math.floor(Math.random() * 25) + 75,
      })));
    }, 2000);
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

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Batch Classification</h1>
          <p className="text-muted-foreground">
            Answer a few questions about your products to get accurate HS code classifications for all items.
          </p>
        </div>

        <div className="glass-card p-6 rounded-xl mb-6">
          <h2 className="text-xl font-medium mb-4">Imported Products ({sampleProducts.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground rounded-tl-lg">ID</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground rounded-tr-lg">Product Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sampleProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 px-4 text-sm">{product.id}</td>
                    <td className="py-2.5 px-4 text-sm">{product.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {currentStep === "questions" && (
          <div className="glass-card p-6 rounded-xl relative animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
              <div className="h-full bg-primary w-1/4 animate-pulse"></div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 mt-1">
                <MessageCircle size={17} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <h3 className="font-medium">Product Classification Assistant</h3>
                  <div className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded ml-2">
                    Batch Processing
                  </div>
                </div>
                
                {isProcessing ? (
                  <div className="py-8 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4"></div>
                    <p className="text-muted-foreground">Processing your answers...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground leading-relaxed mb-4">{currentQuestion.text}</p>
                    
                    <div className="space-y-2.5 mb-4">
                      {currentQuestion.options?.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAnswerQuestion(option)}
                          className="w-full text-left p-3.5 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                        >
                          <span>{option}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === "results" && (
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
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Product Description</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">HS Code</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Confidence</th>
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
