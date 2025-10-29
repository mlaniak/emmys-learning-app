import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithAuth from './AppWithAuth.jsx'
import App from './App.jsx'
import './index.css'

// Check if we're in developer mode (URL contains #/game) or if user is already authenticated
const isDeveloperMode = window.location.hash.includes('#/game') || 
                       localStorage.getItem('developerMode') === 'true';

// Use AppWithAuth for authentication flow, App for the main quiz interface
const MainApp = isDeveloperMode ? App : AppWithAuth;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainApp />
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

