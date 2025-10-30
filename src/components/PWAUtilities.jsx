import React, { useState, useEffect } from 'react';
import { setupInstallPrompt } from '../utils/pwaUtils';

// PWA Install Button Component
export const PWAInstallButton = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    
    // Setup install prompt
    const setup = setupInstallPrompt();
    setInstallPrompt(setup);
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = () => {
      setShowInstallButton(true);
    };
    
    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.install();
    }
  };
  
  if (isInstalled || !showInstallButton) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstall}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors"
      >
        <span>📱</span>
        <span>Install App</span>
      </button>
    </div>
  );
};

// PWA Status Indicator
export const PWAStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
        {isInstalled && ' • Installed'}
      </span>
    </div>
  );
};

// PWA Update Notification
export const PWAUpdateNotification = ({ registration, onUpdate, onDismiss }) => {
  const [showUpdate, setShowUpdate] = useState(false);
  
  useEffect(() => {
    if (registration) {
      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        }
      };
      
      registration.addEventListener('updatefound', handleUpdateFound);
      
      return () => {
        registration.removeEventListener('updatefound', handleUpdateFound);
      };
    }
  }, [registration]);
  
  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    if (onUpdate) onUpdate();
    window.location.reload();
  };
  
  const handleDismiss = () => {
    setShowUpdate(false);
    if (onDismiss) onDismiss();
  };
  
  if (!showUpdate) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <span className="text-xl">🔄</span>
        <div className="flex-1">
          <div className="font-bold">Update Available!</div>
          <div className="text-sm opacity-90 mb-3">A new version with improvements is ready.</div>
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="bg-blue-400 hover:bg-blue-500 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white hover:text-gray-200 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PWAInstallButton;