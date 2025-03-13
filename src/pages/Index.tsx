import React from "react";
import Layout from "@/components/Layout";
import { useSimpleClassifier } from "@/lib/useSimpleClassifier";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle, Loader2, RefreshCw } from "lucide-react";

// Simple wrapper component to ensure any errors are contained
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Error caught by boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-md mx-auto mt-10 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-700 text-lg font-medium mb-2">Application Error</h2>
          <p className="text-red-600 mb-4">Something went wrong with the application.</p>
          <pre className="p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">
            {this.state.error?.toString()}
          </pre>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// The main application
const Index = () => {
  const { state, classify, continueWithAnswer, reset } = useSimpleClassifier();
  const [productInput, setProductInput] = React.useState("");
  const [userAnswer, setUserAnswer] = React.useState("");

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productInput.trim()) {
      classify(productInput.trim());
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userAnswer.trim()) {
      continueWithAnswer(userAnswer.trim());
      setUserAnswer("");
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    continueWithAnswer(option);
  };

  return (
    <ErrorBoundary>
      <Layout className="pt-28 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Status indicator */}
          <div className="mb-6 flex items-center justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center ${
              state.status === 'idle' ? 'bg-blue-100 text-blue-800' :
              state.status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
              state.status === 'question' ? 'bg-purple-100 text-purple-800' :
              state.status === 'result' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {state.status === 'idle' && <AlertCircle className="h-4 w-4 mr-2" />}
              {state.status === 'loading' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {state.status === 'question' && <AlertTriangle className="h-4 w-4 mr-2" />}
              {state.status === 'result' && <CheckCircle className="h-4 w-4 mr-2" />}
              {state.status === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
              Status: {state.status}
            </div>
          </div>

          {/* Initial product input */}
          {state.status === 'idle' && (
            <div className="glass-card p-6 rounded-lg">
              <h2 className="text-xl font-medium mb-4">Enter Product Description</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md mb-4"
                  rows={4}
                  placeholder="Describe your product in detail..."
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
                  disabled={!productInput.trim()}
                >
                  Classify Product <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Loading state */}
          {state.status === 'loading' && (
            <div className="glass-card p-8 rounded-lg flex flex-col items-center justify-center h-60">
              <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Processing your request...</p>
            </div>
          )}

          {/* Question state */}
          {state.status === 'question' && (
            <div className="glass-card p-6 rounded-lg">
              <h2 className="text-xl font-medium mb-4">Additional Information Needed</h2>
              <p className="mb-4">{state.question}</p>
              
              {state.options && state.options.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {state.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className="w-full p-3 border border-gray-300 rounded-md text-left hover:bg-gray-50"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleAnswerSubmit}>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md mb-4"
                    placeholder="Your answer..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    disabled={!userAnswer.trim()}
                  >
                    Submit Answer
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Result state */}
          {state.status === 'result' && (
            <div className="glass-card p-6 rounded-lg">
              <h2 className="text-xl font-medium mb-4">Classification Result</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <div className="text-2xl font-bold mb-2">{state.code}</div>
                <div className="text-gray-700">{state.description}</div>
                {state.path && (
                  <div className="mt-2 text-sm text-gray-500">
                    Classification Path: {state.path}
                  </div>
                )}
              </div>
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-600 text-white rounded-md flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Start New Classification
              </button>
            </div>
          )}

          {/* Error state */}
          {state.status === 'error' && (
            <div className="glass-card p-6 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-600 mb-2">Error</h3>
                  <p className="text-gray-700 mb-2">{state.message}</p>
                  
                  {state.details && (
                    <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-md overflow-auto max-h-40 text-xs font-mono">
                      {state.details}
                    </div>
                  )}
                  
                  <button
                    onClick={reset}
                    className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default Index;