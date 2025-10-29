import React, { useState, useEffect } from 'react';

// Error Types
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
  COMPONENT: 'component',
  API: 'api'
};

// Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error Handler Class
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.listeners = [];
    this.maxErrors = 100; // Keep only last 100 errors
  }

  // Log an error
  logError(error, context = {}) {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: this.categorizeError(error),
      severity: this.determineSeverity(error),
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: context.userId || 'anonymous',
        ...context
      },
      resolved: false
    };

    this.errors.push(errorEntry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify listeners
    this.notifyListeners('errorLogged', errorEntry);

    // Auto-resolve low severity errors
    if (errorEntry.severity === ERROR_SEVERITY.LOW) {
      setTimeout(() => {
        this.resolveError(errorEntry.id);
      }, 5000);
    }

    return errorEntry;
  }

  // Categorize error type
  categorizeError(error) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }
    if (error.name === 'ValidationError') {
      return ERROR_TYPES.VALIDATION;
    }
    if (error.name === 'PermissionError') {
      return ERROR_TYPES.PERMISSION;
    }
    if (error.name === 'TimeoutError') {
      return ERROR_TYPES.TIMEOUT;
    }
    if (error.message.includes('component')) {
      return ERROR_TYPES.COMPONENT;
    }
    if (error.message.includes('API')) {
      return ERROR_TYPES.API;
    }
    return ERROR_TYPES.UNKNOWN;
  }

  // Determine error severity
  determineSeverity(error) {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return ERROR_SEVERITY.MEDIUM; // Can be retried
    }
    if (error.name === 'NetworkError') {
      return ERROR_SEVERITY.MEDIUM; // Network issues are usually temporary
    }
    if (error.name === 'TypeError' && error.message.includes('Cannot read property')) {
      return ERROR_SEVERITY.HIGH; // Usually indicates a bug
    }
    if (error.message.includes('Critical') || error.message.includes('Fatal')) {
      return ERROR_SEVERITY.CRITICAL;
    }
    return ERROR_SEVERITY.LOW;
  }

  // Resolve an error
  resolveError(errorId) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      this.notifyListeners('errorResolved', error);
    }
  }

  // Get errors by type or severity
  getErrors(filter = {}) {
    return this.errors.filter(error => {
      if (filter.type && error.type !== filter.type) return false;
      if (filter.severity && error.severity !== filter.severity) return false;
      if (filter.resolved !== undefined && error.resolved !== filter.resolved) return false;
      return true;
    });
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      unresolved: this.errors.filter(e => !e.resolved).length,
      byType: {},
      bySeverity: {},
      recent: this.errors.filter(e => {
        const errorTime = new Date(e.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorTime > oneHourAgo;
      }).length
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // Subscribe to error events
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  // Clear resolved errors
  clearResolvedErrors() {
    this.errors = this.errors.filter(error => !error.resolved);
  }

  // Clear all errors
  clearAllErrors() {
    this.errors = [];
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorEntry = errorHandler.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown'
    });

    this.setState({
      error,
      errorInfo,
      errorId: errorEntry.id
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback = ({ error, errorInfo, errorId, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleReportError = async () => {
    setIsReporting(true);
    try {
      // In a real app, you'd send this to your error reporting service
      console.log('Reporting error:', { error, errorInfo, errorId });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Error reported successfully! Thank you for helping us improve.');
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      alert('Failed to report error. Please try again later.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Don't worry, your progress is saved!
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Reload Page
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-blue-500 hover:text-blue-600 font-medium py-2 px-4 rounded transition-colors"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded text-left">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Error Details:</h3>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {error && error.toString()}
              </pre>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={handleReportError}
                  disabled={isReporting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors disabled:opacity-50"
                >
                  {isReporting ? 'Reporting...' : 'Report Error'}
                </button>
                
                <button
                  onClick={() => navigator.clipboard.writeText(error?.toString() || '')}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                >
                  Copy Error
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// User Feedback System
export class FeedbackSystem {
  constructor() {
    this.feedback = [];
    this.listeners = [];
    this.maxFeedback = 50;
  }

  // Submit feedback
  submitFeedback(feedback) {
    const feedbackEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type: feedback.type || 'general',
      rating: feedback.rating || 5,
      message: feedback.message || '',
      category: feedback.category || 'general',
      userId: feedback.userId || 'anonymous',
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...feedback.context
      }
    };

    this.feedback.push(feedbackEntry);
    
    // Keep only recent feedback
    if (this.feedback.length > this.maxFeedback) {
      this.feedback.shift();
    }

    // Notify listeners
    this.notifyListeners('feedbackSubmitted', feedbackEntry);

    return feedbackEntry;
  }

  // Get feedback by type or category
  getFeedback(filter = {}) {
    return this.feedback.filter(fb => {
      if (filter.type && fb.type !== filter.type) return false;
      if (filter.category && fb.category !== filter.category) return false;
      if (filter.minRating && fb.rating < filter.minRating) return false;
      return true;
    });
  }

  // Get feedback statistics
  getFeedbackStats() {
    const stats = {
      total: this.feedback.length,
      averageRating: 0,
      byType: {},
      byCategory: {},
      recent: this.feedback.filter(fb => {
        const feedbackTime = new Date(fb.timestamp);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return feedbackTime > oneWeekAgo;
      }).length
    };

    if (this.feedback.length > 0) {
      stats.averageRating = this.feedback.reduce((sum, fb) => sum + fb.rating, 0) / this.feedback.length;
    }

    this.feedback.forEach(fb => {
      stats.byType[fb.type] = (stats.byType[fb.type] || 0) + 1;
      stats.byCategory[fb.category] = (stats.byCategory[fb.category] || 0) + 1;
    });

    return stats;
  }

  // Subscribe to feedback events
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }
}

// Create singleton instance
export const feedbackSystem = new FeedbackSystem();

// Feedback Modal Component
export const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const feedback = feedbackSystem.submitFeedback({
        type: 'user',
        rating,
        message: message.trim(),
        category
      });

      onSubmit?.(feedback);
      onClose();
      
      // Reset form
      setRating(5);
      setMessage('');
      setCategory('general');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Share Your Feedback</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate your experience?
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="content">Content Suggestion</option>
              <option value="ui">UI/UX Improvement</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Global Error Handler
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.logError(new Error(event.reason), {
      type: 'unhandledRejection',
      promise: event.promise
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorHandler.logError(event.error, {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      errorHandler.logError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), {
        type: 'resourceError',
        element: event.target.tagName,
        src: event.target.src || event.target.href
      });
    }
  }, true);
};

export default {
  ErrorHandler,
  ErrorBoundary,
  FeedbackSystem,
  FeedbackModal,
  setupGlobalErrorHandling
};
