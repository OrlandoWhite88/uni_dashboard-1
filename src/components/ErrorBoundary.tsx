import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // Log error to console
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto p-6 glass-card rounded-xl mt-8">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive mb-2">Something went wrong</h3>
              <p className="text-muted-foreground mb-2">The application encountered an unexpected error.</p>
              
              <div className="bg-secondary/50 p-4 rounded-md mb-4 overflow-auto max-h-80 text-xs font-mono">
                <p>{this.state.error?.toString()}</p>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
              
              <button 
                className="flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                onClick={this.handleReset}
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;