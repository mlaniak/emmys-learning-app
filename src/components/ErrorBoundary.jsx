import React from 'react';
import SimpleFallback from './SimpleFallback';

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
      // Use simple fallback component
      return (
        <SimpleFallback 
          message="Something went wrong with the app"
          showRetry={true}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
