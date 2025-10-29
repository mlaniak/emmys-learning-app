import React from 'react';

// Error Boundary Component to catch React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-lg mb-6">Don't worry, Emmy's Learning App is still here!</p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/emmys-learning-app';
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors ml-4"
              >
                🏠 Start Fresh
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left bg-black bg-opacity-20 p-4 rounded-lg">
                <summary className="cursor-pointer font-bold">Debug Info</summary>
                <pre className="text-xs mt-2 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
