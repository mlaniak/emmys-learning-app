import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      // Show onboarding for first-time installed users
      const hasSeenOnboarding = localStorage.getItem('emmy-pwa-onboarding-seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt recently
      const lastDismissed = localStorage.getItem('emmy-install-prompt-dismissed');
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Show onboarding for newly installed app
      setShowOnboarding(true);
      
      // Track installation
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'App Installed'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Track user choice
    if (window.gtag) {
      window.gtag('event', 'pwa_install_prompt_response', {
        event_category: 'PWA',
        event_label: outcome
      });
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissPrompt = () => {
    setShowInstallPrompt(false);
    // Remember dismissal for 24 hours
    localStorage.setItem('emmy-install-prompt-dismissed', Date.now().toString());
    
    // Track dismissal
    if (window.gtag) {
      window.gtag('event', 'pwa_install_prompt_dismissed', {
        event_category: 'PWA'
      });
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('emmy-pwa-onboarding-seen', 'true');
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('emmy-pwa-onboarding-seen', 'true');
  };

  const onboardingSteps = [
    {
      title: "Welcome to Emmy's Learning App! 🎉",
      content: "You've successfully installed the app! Now you can learn anytime, anywhere - even without internet.",
      icon: "🎮"
    },
    {
      title: "Learn Offline 📱",
      content: "All your favorite subjects and questions are now available offline. Perfect for car rides or anywhere without WiFi!",
      icon: "📚"
    },
    {
      title: "Track Your Progress 📊",
      content: "Your learning progress is automatically saved and synced when you're back online. Never lose your achievements!",
      icon: "🏆"
    },
    {
      title: "Get Learning Reminders 🔔",
      content: "Want daily learning reminders? We can send you friendly notifications to keep your learning streak going!",
      icon: "⏰"
    }
  ];

  // Install Prompt Component
  if (showInstallPrompt && !isInstalled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Install Emmy's Learning App
            </h3>
            <p className="text-gray-600 mb-6">
              Get the full app experience! Install Emmy's Learning Adventure for:
            </p>
            
            <div className="text-left mb-6 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-700">Works offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-700">Faster loading</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-700">Home screen access</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-700">Learning reminders</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Install App
              </button>
              <button
                onClick={handleDismissPrompt}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding Component
  if (showOnboarding && isInstalled) {
    const currentStep = onboardingSteps[onboardingStep];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">{currentStep.icon}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {currentStep.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentStep.content}
            </p>
            
            {/* Progress indicator */}
            <div className="flex justify-center space-x-2 mb-6">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === onboardingStep ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex space-x-3">
              {onboardingStep < onboardingSteps.length - 1 ? (
                <>
                  <button
                    onClick={handleOnboardingSkip}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleOnboardingNext}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </>
              ) : (
                <button
                  onClick={handleOnboardingNext}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Start Learning!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;