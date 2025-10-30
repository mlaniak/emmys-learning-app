// Math Component - Lazy Loaded
import React from 'react';

const MathComponent = ({ gameSettings = {} }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto text-center text-white">
        <div className="text-6xl mb-4">🔢</div>
        <h1 className="text-4xl font-bold mb-4">Math Adventure</h1>
        <p className="text-xl">This component will be implemented with the existing math functionality.</p>
      </div>
    </div>
  );
};

export default MathComponent;