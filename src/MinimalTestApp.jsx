import React, { useState, useEffect } from 'react';
import { useUser } from './contexts/UserContext';

// Minimal test component to isolate React Error #310
const MinimalTestApp = () => {
  const { user, userProfile, loading, error } = useUser();
  const [step, setStep] = useState('initializing');

  useEffect(() => {
    console.log('MinimalTestApp: useEffect started');
    console.log('MinimalTestApp: loading =', loading);
    console.log('MinimalTestApp: user =', user);
    console.log('MinimalTestApp: userProfile =', userProfile);
    console.log('MinimalTestApp: error =', error);

    if (loading) {
      setStep('loading');
    } else if (user && userProfile) {
      setStep('authenticated');
    } else if (error) {
      setStep('error');
    } else {
      setStep('ready');
    }
  }, [loading, user, userProfile, error]);

  console.log('MinimalTestApp: Rendering step =', step);

  // Step 1: Initializing
  if (step === 'initializing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Initializing...</div>
          <div className="text-sm mt-2 opacity-75">Step: {step}</div>
        </div>
      </div>
    );
  }

  // Step 2: Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Loading...</div>
          <div className="text-sm mt-2 opacity-75">Step: {step}</div>
        </div>
      </div>
    );
  }

  // Step 3: Error
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-purple-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl">Error Detected</div>
          <div className="text-sm mt-2 opacity-75">Step: {step}</div>
          <div className="text-xs mt-4 bg-black bg-opacity-20 p-2 rounded">
            {error || 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Authenticated
  if (step === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-xl">Success! User Authenticated</div>
          <div className="text-sm mt-2 opacity-75">Step: {step}</div>
          <div className="text-xs mt-4 bg-black bg-opacity-20 p-2 rounded">
            <div>User: {user?.email || 'Unknown'}</div>
            <div>Profile: {userProfile?.display_name || 'Unknown'}</div>
          </div>
          <button
            onClick={() => setStep('quiz')}
            className="mt-4 bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            🎮 Try Quiz Interface
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Quiz Interface (minimal)
  if (step === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* User Header */}
          <div className="bg-white rounded-full shadow-lg border-2 border-purple-200 p-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👤</div>
                <div>
                  <div className="font-semibold text-gray-900">{userProfile?.display_name || 'User'}</div>
                  <div className="text-gray-500">{userProfile?.progress?.score || 0} points</div>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>

          {/* Simple Quiz Interface */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-purple-600 mb-4">🎉 Success!</h1>
            <p className="text-xl text-gray-700 mb-6">
              The app is working! React Error #310 has been resolved.
            </p>
            <div className="space-y-4">
              <div className="text-lg text-gray-600">
                User: {user?.email || 'Unknown'}
              </div>
              <div className="text-lg text-gray-600">
                Profile: {userProfile?.display_name || 'Unknown'}
              </div>
              <div className="text-lg text-gray-600">
                Loading: {loading ? 'true' : 'false'}
              </div>
            </div>
            <button
              onClick={() => setStep('authenticated')}
              className="mt-6 bg-purple-500 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-600 transition-colors"
            >
              🔄 Back to Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Ready (fallback)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🚀</div>
        <div className="text-xl">Ready to Start</div>
        <div className="text-sm mt-2 opacity-75">Step: {step}</div>
        <button
          onClick={() => setStep('quiz')}
          className="mt-4 bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
        >
          🎮 Start Quiz
        </button>
      </div>
    </div>
  );
};

export default MinimalTestApp;
