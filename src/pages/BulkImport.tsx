
import React, { useState } from "react";
import Layout from "@/components/Layout";
import CustomButton from "@/components/ui/CustomButton";
import { FileText, Upload, Clipboard, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BulkImport = () => {
  const [importMethod, setImportMethod] = useState<"csv" | "paste" | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pastedData, setPastedData] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    // In a real application, you would process the data here
    // For now, we'll just navigate to a batch classification page
    navigate("/batch-classify");
  };

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Bulk Import</h1>
          <p className="text-muted-foreground">
            Import multiple products for bulk HS code classification. Upload a CSV file or paste your data directly.
          </p>
        </div>

        {!importMethod && (
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-xl font-medium mb-6 text-center">Select Import Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setImportMethod("csv")}
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
              
              <button
                onClick={() => setImportMethod("paste")}
                className="p-6 border border-border rounded-lg hover:bg-secondary/50 transition-colors flex flex-col items-center"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clipboard className="text-primary" size={24} />
                </div>
                <h3 className="text-lg font-medium mb-2">Paste Data</h3>
                <p className="text-muted-foreground text-center text-sm">
                  Copy and paste product data directly
                </p>
              </button>
            </div>
          </div>
        )}

        {importMethod === "csv" && (
          <div className="glass-card p-8 rounded-xl animate-slide-up">
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setImportMethod(null)}
                className="mr-2 p-1 rounded-full hover:bg-secondary/80 transition-colors"
              >
                <ArrowRight className="rotate-180" size={16} />
              </button>
              <h2 className="text-xl font-medium">CSV Upload</h2>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-6">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Upload className="text-muted-foreground" size={28} />
                </div>
                
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Drag and drop your CSV file here, or click to browse. File should have a column for product descriptions.
                </p>
                
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="csv-upload">
                  <div className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
                    Browse Files
                  </div>
                </label>
                
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
                onClick={handleSubmit}
                disabled={!csvFile}
              >
                Continue <ArrowRight size={16} className="ml-1" />
              </CustomButton>
            </div>
          </div>
        )}

        {importMethod === "paste" && (
          <div className="glass-card p-8 rounded-xl animate-slide-up">
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setImportMethod(null)}
                className="mr-2 p-1 rounded-full hover:bg-secondary/80 transition-colors"
              >
                <ArrowRight className="rotate-180" size={16} />
              </button>
              <h2 className="text-xl font-medium">Paste Data</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                Paste your product data below. Each line should contain a separate product description.
              </p>
              
              <textarea
                className="w-full min-h-[200px] p-4 rounded-lg border border-border bg-transparent focus:ring-2 focus:ring-primary/30 focus-visible:outline-none"
                placeholder="Paste your product descriptions here, one per line..."
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <CustomButton 
                onClick={handleSubmit}
                disabled={!pastedData.trim()}
              >
                Continue <ArrowRight size={16} className="ml-1" />
              </CustomButton>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BulkImport;
