import React, { useState } from 'react';

const AppMinimal = () => {
  const [currentScreen, setCurrentScreen] = useState('home');

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-8">🎮</div>
          <h1 className="text-4xl font-bold mb-4">Emmy's Learning Adventure</h1>
          <p className="text-xl mb-8">Interactive Learning for First Grade</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button 
              onClick={() => navigateTo('phonics')}
              className="bg-white text-purple-600 px-6 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              📚 Phonics
            </button>
            <button 
              onClick={() => navigateTo('math')}
              className="bg-white text-purple-600 px-6 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              🔢 Math
            </button>
            <button 
              onClick={() => navigateTo('reading')}
              className="bg-white text-purple-600 px-6 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              📖 Reading
            </button>
            <button 
              onClick={() => navigateTo('spelling')}
              className="bg-white text-purple-600 px-6 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              ✏️ Spelling
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simple subject screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-4xl font-bold mb-4">
          {currentScreen === 'phonics' && '📚 Phonics'}
          {currentScreen === 'math' && '🔢 Math'}
          {currentScreen === 'reading' && '📖 Reading'}
          {currentScreen === 'spelling' && '✏️ Spelling'}
        </h1>
        <p className="text-xl mb-8">Learning module coming soon!</p>
        
        <button 
          onClick={() => navigateTo('home')}
          className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default AppMinimal;