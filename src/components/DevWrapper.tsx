import React, { createContext, useContext } from 'react';

// Mock user data for development
const mockUser = {
  id: 'dev-user-123',
  emailAddress: 'dev@example.com',
  firstName: 'Development',
  lastName: 'User'
};

// Create context for development auth
const DevAuthContext = createContext({
  user: mockUser,
  isSignedIn: true,
  isLoaded: true
});

export const useDevAuth = () => useContext(DevAuthContext);

// Development wrapper that provides mock authentication
export const DevWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  if (!isDevelopment) {
    return <>{children}</>;
  }

  return (
    <DevAuthContext.Provider value={{
      user: mockUser,
      isSignedIn: true,
      isLoaded: true
    }}>
      {children}
    </DevAuthContext.Provider>
  );
};

// Mock Clerk components for development
export const MockSignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  return isDevelopment ? <>{children}</> : null;
};

export const MockSignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  return isDevelopment ? null : <>{children}</>;
};
