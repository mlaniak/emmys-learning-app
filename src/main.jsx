import React from 'react'
import ReactDOM from 'react-dom/client'
// import AppWithAuth from './AppWithAuth.jsx'
import App from './App.jsx'
// import TestSimple from './TestSimple.jsx'
// import AppMinimal from './AppMinimal.jsx'
// import AppUltraSimple from './AppUltraSimple.jsx'
// import AppMinimalNoCSS from './AppMinimalNoCSS.jsx'
import './index.css'
// import { setupDebugUtils, setupDebugKeyboardShortcuts, logDebugInfo } from './utils/debugUtils'
// import { initializeMobileOptimizations } from './utils/mobilePerformanceOptimizer'

const MainApp = App;

// Normalize GH Pages URLs BEFORE React mounts to avoid loops and blank screens
(() => {
  try {
    const gameScreens = ['phonics', 'math', 'reading', 'science', 'art', 'geography', 'history', 'spelling'];
    const segments = (window.location.pathname || '').split('/').filter(Boolean);
    const lastSeg = segments[segments.length - 1];
    const expectedHash = lastSeg ? `#/${lastSeg}` : '';
    if (gameScreens.includes(lastSeg) && window.location.hash !== expectedHash) {
      const target = `${window.location.origin}/emmys-learning-app/${expectedHash}`;
      if (window.location.href !== target) {
        window.location.replace(target);
      }
    }
  } catch (e) {
    // no-op: fallback to React boundary
  }
})();

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
  <InitErrorBoundary>
    <MainApp />
  </InitErrorBoundary>
)

// Setup debug utilities in development mode
// setupDebugUtils();
// setupDebugKeyboardShortcuts();
// logDebugInfo();

// Initialize mobile performance optimizations
// initializeMobileOptimizations();

// Initialize PWA functionality with enhanced offline support
// import { initializePWA } from './utils/pwaUtils';
// import serviceWorkerManager from './utils/serviceWorkerManager';
// import { pushNotificationManager } from './utils/pushNotifications';
// import { backgroundSyncManager } from './utils/backgroundSync';

// Initialize performance monitoring
// import { performanceMonitor } from './utils/performanceMonitor';
// import { performanceRegressionDetector } from './utils/performanceRegressionDetector';
// import { userCentricMetrics } from './utils/userCentricMetrics';

// Initialize code splitting and resource preloading
// import codeSplittingManager from './utils/codeSplittingManager';
// import { initializeResourcePreloading } from './utils/resourcePreloader';
// import { preloadAllSubjects } from './components/subjects/LazySubjectComponents';

// Initialize PWA features
/*
window.addEventListener('load', async () => {
  try {
    const pwaFeatures = await initializePWA();
    if (pwaFeatures) {
      console.log('PWA features initialized successfully');
      
      // Initialize service worker manager
      serviceWorkerManager.initialize(pwaFeatures.registration);
      
      // Initialize push notifications
      const pushResult = await pushNotificationManager.initialize();
      console.log('Push notifications initialized:', pushResult);
      
      // Initialize background sync
      const syncResult = await backgroundSyncManager.initialize();
      console.log('Background sync initialized:', syncResult);
      
      // Store PWA features globally for access by components
      window.emmyPWA = {
        ...pwaFeatures,
        pushNotifications: pushNotificationManager,
        backgroundSync: backgroundSyncManager
      };
      window.emmyServiceWorker = serviceWorkerManager;
      
      // Listen for notification clicks from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'NOTIFICATION_CLICKED') {
          console.log('Notification clicked:', event.data);
          // Handle notification click actions
          if (event.data.action === 'start-learning') {
            // Navigate to learning activity
            window.location.hash = '#learning';
          }
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize PWA features:', error);
  }

  // Initialize performance monitoring systems
  try {
    performanceMonitor.initialize();
    userCentricMetrics.initialize();
    
    // Set up performance data recording for regression detection
    const recordPerformanceData = () => {
      const report = performanceMonitor.getPerformanceReport();
      performanceRegressionDetector.recordPerformanceSnapshot(report);
    };

    // Record performance data every 30 seconds
    setInterval(recordPerformanceData, 30000);
    
    // Record initial performance data after 5 seconds
    setTimeout(recordPerformanceData, 5000);

    // Store performance monitoring globally for access by components
    window.emmyPerformance = {
      monitor: performanceMonitor,
      regressionDetector: performanceRegressionDetector,
      userMetrics: userCentricMetrics,
      codeSplitting: codeSplittingManager
    };

    console.log('Performance monitoring initialized successfully');
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }

  // Initialize code splitting and resource preloading
  try {
    // Get user preferences for intelligent preloading
    const userPreferences = JSON.parse(localStorage.getItem('emmy-learning-progress') || '{}');
    
    // Initialize resource preloading
    const preloadResults = await initializeResourcePreloading({
      favoriteSubjects: userPreferences.favoriteSubjects || [],
      recentSubjects: userPreferences.recentSubjects || [],
      settings: userPreferences.settings || {}
    });

    // Preload subject components based on user behavior
    preloadAllSubjects();

    // Store code splitting manager globally
    window.emmyCodeSplitting = codeSplittingManager;

    console.log('Code splitting and resource preloading initialized:', preloadResults);
  } catch (error) {
    console.error('Failed to initialize code splitting:', error);
  }
});
*/

