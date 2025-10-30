import React from 'react';

const TestSimple = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🎮 Emmy's Learning Adventure
      </h1>
      <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>
        React is working! The app is loading...
      </p>
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#8b5cf6', 
        color: 'white', 
        borderRadius: '8px',
        cursor: 'pointer'
      }} onClick={() => alert('Button clicked!')}>
        Test Button
      </div>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
        If you see this, React is working correctly.
      </div>
    </div>
  );
};

export default TestSimple;