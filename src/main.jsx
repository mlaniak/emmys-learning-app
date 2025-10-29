import React from 'react'
import ReactDOM from 'react-dom/client'
import TestAppWithoutProvider from './TestAppWithoutProvider.jsx'
import './index.css'

// Use the ultra-minimal test app to isolate React Error #310
const App = TestAppWithoutProvider;

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

