import React from 'react';

// Ultra-minimal test component - no hooks, no context, no complexity
const UltraMinimalTest = () => {
  console.log('UltraMinimalTest: Rendering started');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold mb-4">Ultra Minimal Test</h1>
        <p className="text-xl mb-6">If you see this, React Error #310 is NOT in the component logic</p>
        <div className="text-sm bg-black bg-opacity-20 p-4 rounded">
          <div>Time: {new Date().toLocaleTimeString()}</div>
          <div>URL: {window.location.href}</div>
          <div>React Version: {React.version}</div>
        </div>
        <button
          onClick={() => {
            console.log('UltraMinimalTest: Button clicked');
            alert('Button works! React Error #310 is not in component logic.');
          }}
          className="mt-6 bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
        >
          🧪 Test Button
        </button>
      </div>
    </div>
  );
};

export default UltraMinimalTest;
