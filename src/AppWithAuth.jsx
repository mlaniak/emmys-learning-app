import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import AuthForm from './components/AuthForm';
import ProfileManager from './components/ProfileManager';
import ProgressTracker from './components/ProgressTracker';
import ParentDashboard from './components/ParentDashboard';
import OfflineManager from './components/OfflineManager';
import OAuthDebugDashboard from './components/OAuthDebugDashboard';
import { isDevelopment } from './utils/environmentConfig';

// Main App Component with Authentication
const AppWithAuth = () => {
  const { user, userProfile, loading, logout } = useUser();
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showOAuthDebugDashboard, setShowOAuthDebugDashboard] = useState(false);

  // Listen for debug dashboard events
  useEffect(() => {
    const handleShowOAuthDashboard = () => {
      if (isDevelopment()) {
        setShowOAuthDebugDashboard(true);
      }
    };

    window.addEventListener('showOAuthDashboard', handleShowOAuthDashboard);
    return () => window.removeEventListener('showOAuthDashboard', handleShowOAuthDashboard);
  }, []);

  console.log('AppWithAuth: Current state - loading:', loading, 'user:', user, 'userProfile:', userProfile);
  
  if (loading) {
    console.log('AppWithAuth: Rendering loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Loading Emmy's Learning App...</div>
          <div className="text-sm mt-2 opacity-75">Debug: loading={loading.toString()}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        {isDevelopment() && (
          <OAuthDebugDashboard 
            isOpen={showOAuthDebugDashboard}
            onClose={() => setShowOAuthDebugDashboard(false)}
          />
        )}
      </>
    );
  }

  // After successful login, redirect to the main quiz app
  useEffect(() => {
    if (user && userProfile) {
      console.log('AppWithAuth: User logged in, redirecting to main app');
      // Use a timeout to prevent React error during render
      setTimeout(() => {
        window.location.href = `${window.location.origin}/emmys-learning-app/#/game`;
      }, 100);
    }
  }, [user, userProfile]);

  // Show loading while redirecting
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Welcome back, {userProfile?.display_name || 'User'}!</div>
          <div className="text-sm mt-2 opacity-75">Redirecting to Emmy's Learning App...</div>
        </div>
      </div>
      {isDevelopment() && (
        <OAuthDebugDashboard 
          isOpen={showOAuthDebugDashboard}
          onClose={() => setShowOAuthDebugDashboard(false)}
        />
      )}
    </>
  );
};

// Root App Component with Providers
const App = () => {
  return (
    <UserProvider>
      <AppWithAuth />
    </UserProvider>
  );
};

export default App;
