import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import AuthForm from './components/AuthForm';
import ProfileManager from './components/ProfileManager';
import ProgressTracker from './components/ProgressTracker';
import ParentDashboard from './components/ParentDashboard';
import OfflineManager from './components/OfflineManager';
import AuthCallback from './components/AuthCallback';

// Main App Component with Authentication
const AppWithAuth = () => {
  const { user, userProfile, loading, logout } = useUser();
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);

  // Check if we're on the auth callback route
  useEffect(() => {
    const handleAuthCallback = () => {
      const hash = window.location.hash;
      if (hash.includes('access_token') || hash.includes('error')) {
        // We're on the auth callback, let the AuthCallback component handle it
        return;
      }
    };

    handleAuthCallback();
  }, []);

  // Show auth callback component if we're on the callback route
  if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
    return <AuthCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Loading Emmy's Learning App...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Check if user is a parent (has children)
  const isParent = userProfile?.email && !userProfile?.is_child;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🎓</div>
              <h1 className="text-xl font-bold text-gray-900">Emmy's Learning Adventure</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="flex items-center">
                <div className="text-2xl mr-2">
                  {userProfile?.avatar === 'girl' ? '👧' : 
                   userProfile?.avatar === 'boy' ? '👦' : 
                   userProfile?.avatar === 'princess' ? '👸' : 
                   userProfile?.avatar === 'superhero' ? '🦸' : 
                   userProfile?.avatar === 'robot' ? '🤖' : 
                   userProfile?.avatar === 'unicorn' ? '🦄' : 
                   userProfile?.avatar === 'dinosaur' ? '🦕' : '👤'}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{userProfile?.display_name}</div>
                  <div className="text-gray-500">{userProfile?.progress?.score || 0} points</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowProgressTracker(!showProgressTracker)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  📊 Progress
                </button>
                
                <button
                  onClick={() => setShowProfileManager(true)}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  ⚙️ Profile
                </button>
                
                {isParent && (
                  <button
                    onClick={() => window.location.href = '/parent-dashboard'}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    👨‍👩‍👧‍👦 Parent View
                  </button>
                )}

                <button
                  onClick={() => {
                    if (userProfile?.is_guest) {
                      // Clear guest data
                      localStorage.removeItem('isGuest');
                      localStorage.removeItem('guestProfile');
                      window.location.reload();
                    } else {
                      // Logout authenticated user
                      logout();
                    }
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {userProfile?.is_guest ? '🚪 Exit Guest' : '🚪 Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isParent ? (
          <ParentDashboard />
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {userProfile?.avatar === 'girl' ? '👧' : 
                   userProfile?.avatar === 'boy' ? '👦' : 
                   userProfile?.avatar === 'princess' ? '👸' : 
                   userProfile?.avatar === 'superhero' ? '🦸' : 
                   userProfile?.avatar === 'robot' ? '🤖' : 
                   userProfile?.avatar === 'unicorn' ? '🦄' : 
                   userProfile?.avatar === 'dinosaur' ? '🦕' : '👤'}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {userProfile?.display_name}! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Ready to continue your learning adventure?
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-purple-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {userProfile?.progress?.score || 0}
                    </div>
                    <div className="text-sm text-purple-800">Points</div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {userProfile?.progress?.learning_streak || 0}
                    </div>
                    <div className="text-sm text-green-800">Streak</div>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {userProfile?.progress?.completed_lessons?.length || 0}
                    </div>
                    <div className="text-sm text-blue-800">Lessons</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Newsletters</h3>
                <p className="text-gray-600 mb-4">Read weekly newsletters and learn new things!</p>
                <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  Start Reading
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-4xl mb-4">✏️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Spelling Practice</h3>
                <p className="text-gray-600 mb-4">Practice spelling words and improve your skills!</p>
                <button className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition-colors">
                  Start Spelling
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Field Trips</h3>
                <p className="text-gray-600 mb-4">Go on virtual field trips and explore!</p>
                <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors">
                  Explore Now
                </button>
              </div>
            </div>

            {/* Progress Tracker Modal */}
            {showProgressTracker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">My Progress</h2>
                    <button
                      onClick={() => setShowProgressTracker(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <ProgressTracker />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile Manager Modal */}
      {showProfileManager && (
        <ProfileManager onClose={() => setShowProfileManager(false)} />
      )}

      {/* Offline Manager */}
      <OfflineManager />
    </div>
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
