import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading Emmy\'s Learning Adventure...');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: 'Loading learning content...' },
      { progress: 40, text: 'Preparing interactive activities...' },
      { progress: 60, text: 'Setting up offline features...' },
      { progress: 80, text: 'Optimizing for your device...' },
      { progress: 100, text: 'Ready to learn!' }
    ];

    let currentStep = 0;
    const stepInterval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;
      } else {
        clearInterval(stepInterval);
        // Wait a moment before hiding splash screen
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 300); // Wait for fade out animation
        }, 500);
      }
    }, 400);

    return () => clearInterval(stepInterval);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center z-50 transition-opacity duration-300 ${!isVisible ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center text-white p-8 max-w-md">
        {/* App Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-4xl">🎮</span>
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-3xl font-bold mb-2">Emmy's Learning Adventure</h1>
        <p className="text-lg opacity-90 mb-8">Interactive Learning for Young Minds</p>

        {/* Loading Progress */}
        <div className="mb-6">
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-4">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm opacity-80">{loadingText}</p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-xs opacity-50">
          Version 2.0.0 • Enhanced with PWA Features
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;