import React, { useEffect } from 'react';
import { AccessibilityProvider, useAccessibility } from './AccessibilityProvider';
import SkipLinks from './SkipLinks';
import AriaLiveRegion from './AriaLiveRegion';
import AccessibilitySettings from './AccessibilitySettings';
import { useState } from 'react';

/**
 * AccessibleApp - Wrapper component that adds accessibility infrastructure to the main app
 */
const AccessibleAppContent = ({ children }) => {
  const { announcePageChange, preferences } = useAccessibility();
  const [showA11ySettings, setShowA11ySettings] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');

  // Add landmark roles and IDs to main sections
  useEffect(() => {
    // Add main content landmark
    const mainContent = document.querySelector('.main-content, main');
    if (mainContent) {
      mainContent.setAttribute('role', 'main');
      mainContent.id = 'main-content';
    }

    // Add navigation landmark
    const navigation = document.querySelector('.navigation, nav, .nav-menu');
    if (navigation) {
      navigation.setAttribute('role', 'navigation');
      navigation.id = 'navigation';
      navigation.setAttribute('aria-label', 'Main navigation');
    }

    // Add game area landmark
    const gameArea = document.querySelector('.game-area, .game-container');
    if (gameArea) {
      gameArea.setAttribute('role', 'application');
      gameArea.id = 'game-area';
      gameArea.setAttribute('aria-label', 'Learning game');
    }

    // Announce app ready
    if (preferences.announcements) {
      announcePageChange("Emmy's Learning Adventure");
    }
  }, [announcePageChange, preferences.announcements]);

  // Handle accessibility settings toggle
  const toggleA11ySettings = () => {
    setShowA11ySettings(!showA11ySettings);
    setCurrentAnnouncement(showA11ySettings ? '' : 'Accessibility settings opened');
  };

  // Add keyboard shortcut for accessibility settings
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + A to open accessibility settings
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        toggleA11ySettings();
      }
      
      // Escape to close accessibility settings
      if (e.key === 'Escape' && showA11ySettings) {
        setShowA11ySettings(false);
        setCurrentAnnouncement('Accessibility settings closed');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showA11ySettings]);

  return (
    <>
      {/* Skip Links */}
      <SkipLinks />
      
      {/* Accessibility Settings Button */}
      <button
        className="accessibility-settings-button"
        onClick={toggleA11ySettings}
        aria-label="Open accessibility settings (Alt+A)"
        title="Accessibility Settings (Alt+A)"
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9998,
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        ♿
      </button>

      {/* Main App Content */}
      <div role="application" aria-label="Emmy's Learning Adventure">
        {children}
      </div>

      {/* Accessibility Settings Modal */}
      <AccessibilitySettings 
        isOpen={showA11ySettings}
        onClose={() => {
          setShowA11ySettings(false);
          setCurrentAnnouncement('Accessibility settings closed');
        }}
      />

      {/* ARIA Live Region for Announcements */}
      <AriaLiveRegion message={currentAnnouncement} />
    </>
  );
};

const AccessibleApp = ({ children }) => {
  return (
    <AccessibilityProvider>
      <AccessibleAppContent>
        {children}
      </AccessibleAppContent>
    </AccessibilityProvider>
  );
};

export default AccessibleApp;