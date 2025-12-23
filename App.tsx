

import React, { ReactNode, Component } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { ChatRoom } from './components/ChatRoom';
import { AppProvider, useApp } from './context/AppContext';

// Define Props and State for ErrorBoundary to ensure TS correctly identifies them
interface ErrorBoundaryProps {
  /**
   * Making children optional in the interface ensures JSX correctly identifies 
   * this component as a wrapper that expects nested elements.
   */
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary: A component that catches errors in its subtree.
 * Fixed by using explicit React.Component to ensure 'props' and 'children' are 
 * correctly identified by the TypeScript compiler.
 */
// Fix: Extending 'Component' directly from React and using the props interface correctly.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Initialize state directly as a class property
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  // Handle rendering of either the error fallback or the normal children
  render() {
    // Destructure state and props for cleaner access and better TS inference
    const { hasError, error } = this.state;
    // Fix: Accessing this.props is valid as it is typed by the generic parameter.
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-6 bg-red-50 text-red-900 text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong 😓</h1>
          <p className="mb-4">We encountered an unexpected error.</p>
          <pre className="bg-red-100 p-3 rounded text-xs overflow-auto max-w-full text-left mb-4">
            {error?.message}
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
    // Return children from props when no error is caught
    return children;
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
    // Fix: ErrorBoundary now correctly accepts children due to making the prop optional in the interface.
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
