import React from 'react';

// Simple fallback component that doesn't rely on complex state
const SimpleFallback = ({ message = "Something went wrong", showRetry = true }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleStartFresh = () => {
    localStorage.clear();
    window.location.href = '/emmys-learning-app';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="text-center text-white p-8 max-w-md">
        <div className="text-6xl mb-4">😅</div>
        <h1 className="text-3xl font-bold mb-4">Oops!</h1>
        <p className="text-lg mb-6">{message}</p>
        <p className="text-sm mb-6 opacity-75">Don't worry, Emmy's Learning App is still here!</p>
        
        {showRetry && (
          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              🔄 Try Again
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors"
            >
              🏠 Start Fresh
            </button>
          </div>
        )}
        
        <div className="mt-6 text-xs opacity-50">
          <p>URL: {window.location.href}</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleFallback;
