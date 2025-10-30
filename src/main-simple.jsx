import React from 'react'
import ReactDOM from 'react-dom/client'

const SimpleApp = () => {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#8b5cf6',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { fontSize: '3rem', marginBottom: '1rem' }
    }, '🎮 Emmy\'s Learning Adventure'),
    React.createElement('p', {
      key: 'subtitle',
      style: { fontSize: '1.5rem', marginBottom: '2rem' }
    }, 'React is working! App is loading successfully.'),
    React.createElement('button', {
      key: 'button',
      style: {
        backgroundColor: 'white',
        color: '#8b5cf6',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer'
      },
      onClick: () => alert('Button clicked! React is working.')
    }, 'Test Button'),
    React.createElement('div', {
      key: 'info',
      style: { marginTop: '2rem', fontSize: '1rem', opacity: 0.8 }
    }, 'If you can see this and click the button, React is working correctly.')
  ]);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(SimpleApp)
  )
);