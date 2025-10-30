import React from 'react';
import SimpleFallback from './SimpleFallback';
import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from '../utils/errorHandling.jsx';

// Enhanced Error Boundary Component with comprehensive error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error with comprehensive context
    const errorEntry = errorHandler.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'ErrorBoundary',
      boundaryLevel: this.props.level || 'component',
      userId: this.props.userId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorEntry.id
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorEntry);
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Log retry attempt
    errorHandler.logError(new Error('Error boundary retry attempt'), {
      originalErrorId: this.state.errorId,
      retryCount: newRetryCount,
      boundaryName: this.props.name || 'ErrorBoundary'
    });

    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: newRetryCount
    });

    // Call onRetry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry(newRetryCount);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use SimpleFallback
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error, 
          this.state.errorInfo, 
          this.handleRetry,
          this.state.retryCount
        );
      }

      return (
        <SimpleFallback 
          message={this.props.message || "Something went wrong with this part of the app"}
          showRetry={this.props.showRetry !== false}
          onRetry={this.handleRetry}
          error={this.state.error}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different contexts
export class NetworkErrorBoundary extends ErrorBoundary {
  componentDidCatch(error, errorInfo) {
    // Add network-specific context
    const networkError = {
      ...error,
      isNetworkError: true,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      onLine: navigator.onLine
    };
    
    super.componentDidCatch(networkError, errorInfo);
  }
}

export class AsyncErrorBoundary extends ErrorBoundary {
  componentDidCatch(error, errorInfo) {
    // Add async-specific context
    const asyncError = {
      ...error,
      isAsyncError: true,
      promiseRejection: error.name === 'UnhandledPromiseRejectionWarning'
    };
    
    super.componentDidCatch(asyncError, errorInfo);
  }
}

export default ErrorBoundary;
