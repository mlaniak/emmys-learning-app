import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithAuth from './AppWithAuth.jsx'
import App from './App.jsx'
import './index.css'
import { setupDebugUtils, setupDebugKeyboardShortcuts, logDebugInfo } from './utils/debugUtils'

// For now, always use the main App to avoid authentication complexity
// This will allow the app to work without requiring OAuth setup
const MainApp = App;

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
            <div className="text-2xl mb-4">🎮 Emmy's Learning App</div>
            <div className="text-lg mb-4">Loading the app...</div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <button 
              onClick={() => {
                // Clear any cached data and reload
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }} 
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Start Fresh
            </button>
            <div className="text-xs mt-4 opacity-50">
              If you see this, try the "Start Fresh" button
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

