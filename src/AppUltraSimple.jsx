import React from 'react';

const AppUltraSimple = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#8b5cf6',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🎮 Emmy's Learning Adventure
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
        React is working! App is loading successfully.
      </p>
      <button 
        style={{
          backgroundColor: 'white',
          color: '#8b5cf6',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked! React is working.')}
      >
        Test Button
      </button>
      <div style={{ marginTop: '2rem', fontSize: '1rem', opacity: 0.8 }}>
        If you can see this and click the button, React is working correctly.
      </div>
    </div>
  );
};

export default AppUltraSimple;