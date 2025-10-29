import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithAuth from './AppWithAuth.jsx'
import OriginalApp from './App.jsx'
import './index.css'

// Check if we're in developer mode (URL contains #/game)
const isDeveloperMode = window.location.hash.includes('#/game') || 
                       localStorage.getItem('developerMode') === 'true';

const App = isDeveloperMode ? OriginalApp : AppWithAuth;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/emmys-learning-app/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

