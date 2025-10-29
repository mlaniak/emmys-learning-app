import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithAuth from './AppWithAuth.jsx'
import App from './App.jsx'
import './index.css'
import { setupDebugUtils, setupDebugKeyboardShortcuts, logDebugInfo } from './utils/debugUtils'

// Check if we're in developer mode (URL contains #/game) or if user is already authenticated
const isDeveloperMode = window.location.hash.includes('#/game') || 
                       localStorage.getItem('developerMode') === 'true' ||
                       window.location.hostname === 'localhost';

// Use AppWithAuth for authentication flow, App for the main quiz interface
const MainApp = isDeveloperMode ? App : AppWithAuth;

// Simple error boundary for initialization
class InitErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App initialization error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-2xl mb-4">🚨 App Loading Error</div>
            <div className="text-lg mb-4">Something went wrong while loading the app.</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Reload App
            </button>
            <div className="text-sm mt-4 opacity-75">
              Error: {this.state.error?.message}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InitErrorBoundary>
      <MainApp />
    </InitErrorBoundary>
  </React.StrictMode>,
)

// Setup debug utilities in development mode
setupDebugUtils();
setupDebugKeyboardShortcuts();
logDebugInfo();

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

