
import React, { ReactNode, Component } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { ChatRoom } from './components/ChatRoom';
import { AppProvider, useApp } from './context/AppContext';

// Define Props and State for ErrorBoundary to ensure TS correctly identifies them
interface ErrorBoundaryProps {
  // Explicitly defining children as required to satisfy React component type expectations in JSX
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Fixed ErrorBoundary: Use React.Component to ensure props and state properties are correctly inherited
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Initialize state directly as a class property
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  // Removed 'override' keyword as inheritance detection was failing in the current environment
  render() {
    // Correctly access state from the base React.Component class
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-6 bg-red-50 text-red-900 text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong 😓</h1>
          <p className="mb-4">We encountered an unexpected error.</p>
          <pre className="bg-red-100 p-3 rounded text-xs overflow-auto max-w-full text-left mb-4">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg"
          >
            Reset App
          </button>
        </div>
      );
    }
    // Correctly access props to return children, resolving the 'props' property error
    return this.props.children;
  }
}

const AppContent = () => {
  const { currentRoom } = useApp();

  return (
    <Layout>
      {currentRoom ? <ChatRoom /> : <Home />}
    </Layout>
  );
};

const App = () => {
  return (
    /* Wrap the AppProvider with ErrorBoundary to catch failures in children */
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
