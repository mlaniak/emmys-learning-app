import React, { useState } from 'react';

const AppMinimalNoCSS = () => {
  const [currentScreen, setCurrentScreen] = useState('home');

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a855f7, #ec4899, #ef4444)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    },
    content: {
      textAlign: 'center',
      color: 'white',
      padding: '2rem'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    subtitle: {
      fontSize: '1.25rem',
      marginBottom: '2rem'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      maxWidth: '400px',
      margin: '0 auto'
    },
    button: {
      backgroundColor: 'white',
      color: '#7c3aed',
      padding: '1rem 1.5rem',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    backButton: {
      backgroundColor: 'white',
      color: '#7c3aed',
      padding: '1rem 2rem',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    }
  };

  if (currentScreen === 'home') {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎮</div>
          <h1 style={styles.title}>Emmy's Learning Adventure</h1>
          <p style={styles.subtitle}>Interactive Learning for First Grade</p>
          
          <div style={styles.buttonGrid}>
            <button 
              style={styles.button}
              onClick={() => navigateTo('phonics')}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              📚 Phonics
            </button>
            <button 
              style={styles.button}
              onClick={() => navigateTo('math')}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              🔢 Math
            </button>
            <button 
              style={styles.button}
              onClick={() => navigateTo('reading')}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              📖 Reading
            </button>
            <button 
              style={styles.button}
              onClick={() => navigateTo('spelling')}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
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
    <div style={{
      ...styles.container,
      background: 'linear-gradient(135deg, #3b82f6, #7c3aed, #ec4899)'
    }}>
      <div style={styles.content}>
        <h1 style={styles.title}>
          {currentScreen === 'phonics' && '📚 Phonics'}
          {currentScreen === 'math' && '🔢 Math'}
          {currentScreen === 'reading' && '📖 Reading'}
          {currentScreen === 'spelling' && '✏️ Spelling'}
        </h1>
        <p style={styles.subtitle}>Learning module coming soon!</p>
        
        <button 
          style={styles.backButton}
          onClick={() => navigateTo('home')}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default AppMinimalNoCSS;