// Spelling Component - Lazy Loaded
import React from 'react';

const SpellingComponent = ({ gameSettings = {} }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-4">
      <div className="max-w-4xl mx-auto text-center text-white">
        <div className="text-6xl mb-4">✏️</div>
        <h1 className="text-4xl font-bold mb-4">Spelling Adventure</h1>
        <p className="text-xl">This component will be implemented with the existing spelling functionality.</p>
      </div>
    </div>
  );
};

export default SpellingComponent;