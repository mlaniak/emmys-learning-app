import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const AuthForm = ({ isSignUp = false, onSuccess }) => {
  const { signIn, signUp, error, setError } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    parentEmail: '',
    isChild: false
  });
  const [isLoading, setIsLoading] = useState(false);

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
    </div>
  );
};

export default AuthForm;
