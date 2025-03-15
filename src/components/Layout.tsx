import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  const { isLoaded, userId } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="w-full border-b border-border/40 backdrop-blur-sm bg-background/80 fixed top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <div className="h-5 w-5 rounded-md bg-primary animate-pulse-light"></div>
              </div>
              <h1 className="text-xl font-medium tracking-tight group-hover:text-primary transition-colors">Uni HS Classification</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <SignedIn>
              {/* Show user button for signed in users */}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              {/* Show sign in/up buttons for signed out users */}
              <button 
                onClick={() => navigate("/sign-in")}
                className="px-4 py-2 text-sm font-medium bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate("/sign-up")}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </button>
            </SignedOut>
            
            <Link to="/settings" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <span className="text-xs font-medium">Uni AI</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className={cn("flex-1 pt-16", className)}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
