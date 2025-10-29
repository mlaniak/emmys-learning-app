import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import ErrorRecoveryModal from './ErrorRecoveryModal';

const AuthForm = ({ isSignUp = false, onSuccess }) => {
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    signInWithApple, 
    loginAsGuest, 
    loginAsDeveloper, 
    error, 
    errorRecovery,
    setError,
    clearErrorRecovery,
    retryAuthentication
  } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    parentEmail: '',
    isChild: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorRecovery, setShowErrorRecovery] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match!');
          setIsLoading(false);
          return;
        }
        
        await signUp(
          formData.email, 
          formData.password, 
          formData.displayName,
          {
            parentEmail: formData.parentEmail,
            isChild: formData.isChild
          }
        );
      } else {
        await signIn(formData.email, formData.password);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error('Google sign in error:', error);
      // Show error recovery modal if error recovery data is available
      if (errorRecovery) {
        setShowErrorRecovery(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithApple();
      onSuccess?.();
    } catch (error) {
      console.error('Apple sign in error:', error);
      // Show error recovery modal if error recovery data is available
      if (errorRecovery) {
        setShowErrorRecovery(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setError(null);
    clearErrorRecovery();
    loginAsGuest();
    onSuccess?.();
  };

  // Error recovery handlers
  const handleErrorRecoveryClose = () => {
    setShowErrorRecovery(false);
    clearErrorRecovery();
  };

  const handleRetryAuthentication = async () => {
    setIsLoading(true);
    try {
      // Determine which provider to retry based on error recovery context
      const provider = errorRecovery?.context?.provider || 'google';
      await retryAuthentication(provider);
      setShowErrorRecovery(false);
      onSuccess?.();
    } catch (error) {
      console.error('Retry authentication failed:', error);
      // Keep the modal open to show updated error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleFallbackAuth = (fallbackOptions) => {
    setShowErrorRecovery(false);
    clearErrorRecovery();
    // The fallback options will be handled by the modal component
    // For now, just close the modal and let user try different methods
  };

  const handleGuestModeFromRecovery = () => {
    setShowErrorRecovery(false);
    handleGuestLogin();
  };

  const handleContactSupport = (supportInfo) => {
    setShowErrorRecovery(false);
    clearErrorRecovery();
    // In a real app, this would open a support ticket or contact form
    alert(`Support needed for error: ${supportInfo.errorId}\n\nPlease contact support with this error ID.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isSignUp ? 'Join Emmy\'s Adventure!' : 'Welcome Back!'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Create your learning account' : 'Sign in to continue learning'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What should we call you? 👋
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address 📧
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password 🔒
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              placeholder="Create a password"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password 🔒
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  placeholder="Confirm your password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent's Email (Optional) 👨‍👩‍👧‍👦
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  placeholder="parent@email.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This helps parents track your progress
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isChild"
                  checked={formData.isChild}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  I'm a kid (this helps us make the app better for you!)
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              <>
                {isSignUp ? '🚀 Start Learning!' : '🎯 Continue Learning!'}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleAppleSignIn}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91 1.65.17 2.99 1.02 3.94 2.4-3.23 1.93-2.7 7.32.15 7.26zm-8.71-14.5c0 1.25-.45 2.41-1.2 3.25-.75.84-1.77 1.32-2.85 1.32-.05-1.25.45-2.41 1.2-3.25.75-.84 1.77-1.32 2.85-1.32z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

    {/* Guest Login */}
    <div className="mt-4">
      <button
        onClick={handleGuestLogin}
        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
      >
        <span className="text-lg mr-2">👤</span>
        Try as Guest (No Account Needed)
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        Guest progress is saved locally and can be transferred to an account later
      </p>
    </div>

    {/* Skip Authentication - Development Only */}
    <div className="mt-4">
      <button
        onClick={loginAsDeveloper}
        className="w-full bg-yellow-100 text-yellow-800 py-3 px-4 rounded-xl font-semibold hover:bg-yellow-200 transition-colors flex items-center justify-center"
      >
        <span className="text-lg mr-2">🚀</span>
        Skip Authentication (Dev Mode)
      </button>
      <p className="text-xs text-yellow-600 text-center mt-2">
        Development only - bypasses authentication to work on content
      </p>
    </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => window.location.reload()} // Simple toggle for demo
              className="ml-2 text-purple-600 hover:text-purple-800 font-semibold"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* Error Recovery Modal */}
      <ErrorRecoveryModal
        isOpen={showErrorRecovery}
        onClose={handleErrorRecoveryClose}
        errorAnalysis={errorRecovery}
        onRetry={handleRetryAuthentication}
        onFallback={handleFallbackAuth}
        onGuestMode={handleGuestModeFromRecovery}
        onContactSupport={handleContactSupport}
      />
    </div>
  );
};

export default AuthForm;
