import React from 'react';
import { useAccessibility } from './AccessibilityProvider';

const AccessibilitySettings = ({ isOpen, onClose }) => {
  const { preferences, updatePreference, announce } = useAccessibility();

  if (!isOpen) return null;

  const handleToggle = (key, value, announcement) => {
    updatePreference(key, value);
    if (announcement) {
      announce(announcement);
    }
  };

  const handleTextScaleChange = (scale) => {
    updatePreference('textScaling', scale);
    const scaleNames = {
      0.875: 'small',
      1: 'normal',
      1.2: 'large', 
      1.5: 'extra large',
      2: 'maximum'
    };
    announce(`Text size set to ${scaleNames[scale] || 'custom'}`);
  };

  return (
    <div 
      className="accessibility-settings-overlay"
      role="dialog"
      aria-labelledby="accessibility-settings-title"
      aria-modal="true"
      data-focus-trap="true"
    >
      <div className="accessibility-settings-modal">
        <div className="accessibility-settings-header">
          <h2 id="accessibility-settings-title">Accessibility Settings</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            ×
          </button>
        </div>

        <div className="accessibility-settings-content">
          <div className="setting-group">
            <h3>Visual Settings</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => handleToggle('highContrast', e.target.checked, 
                    e.target.checked ? 'High contrast mode enabled' : 'High contrast mode disabled')}
                  aria-describedby="high-contrast-desc"
                />
                <span>High Contrast Mode</span>
              </label>
              <p id="high-contrast-desc" className="setting-description">
                Increases color contrast for better visibility
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(e) => handleToggle('reducedMotion', e.target.checked,
                    e.target.checked ? 'Reduced motion enabled' : 'Reduced motion disabled')}
                  aria-describedby="reduced-motion-desc"
                />
                <span>Reduce Motion</span>
              </label>
              <p id="reduced-motion-desc" className="setting-description">
                Minimizes animations and transitions
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label" id="text-size-label">
                <span>Text Size</span>
              </label>
              <p className="setting-description">
                Adjust text size for better readability. Changes apply to all text content.
              </p>
              <div className="text-scale-options" role="radiogroup" aria-labelledby="text-size-label">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="textScale"
                    value="0.875"
                    checked={preferences.textScaling === 0.875}
                    onChange={() => handleTextScaleChange(0.875)}
                    aria-describedby="text-small-desc"
                  />
                  <span>Small</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="textScale"
                    value="1"
                    checked={preferences.textScaling === 1}
                    onChange={() => handleTextScaleChange(1)}
                    aria-describedby="text-normal-desc"
                  />
                  <span>Normal</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="textScale"
                    value="1.2"
                    checked={preferences.textScaling === 1.2}
                    onChange={() => handleTextScaleChange(1.2)}
                    aria-describedby="text-large-desc"
                  />
                  <span>Large</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="textScale"
                    value="1.5"
                    checked={preferences.textScaling === 1.5}
                    onChange={() => handleTextScaleChange(1.5)}
                    aria-describedby="text-xl-desc"
                  />
                  <span>Extra Large</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="textScale"
                    value="2"
                    checked={preferences.textScaling === 2}
                    onChange={() => handleTextScaleChange(2)}
                    aria-describedby="text-max-desc"
                  />
                  <span>Maximum</span>
                </label>
              </div>
              <div className="text-scale-descriptions">
                <p id="text-small-desc" className="sr-only">87.5% of normal text size</p>
                <p id="text-normal-desc" className="sr-only">100% normal text size</p>
                <p id="text-large-desc" className="sr-only">120% of normal text size</p>
                <p id="text-xl-desc" className="sr-only">150% of normal text size</p>
                <p id="text-max-desc" className="sr-only">200% of normal text size</p>
              </div>
            </div>
          </div>

          <div className="setting-group">
            <h3>Navigation Settings</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.focusIndicators || preferences.enhancedFocus}
                  onChange={(e) => {
                    handleToggle('focusIndicators', e.target.checked);
                    handleToggle('enhancedFocus', e.target.checked,
                      e.target.checked ? 'Enhanced focus indicators enabled' : 'Enhanced focus indicators disabled');
                  }}
                  aria-describedby="focus-indicators-desc"
                />
                <span>Enhanced Focus Indicators</span>
              </label>
              <p id="focus-indicators-desc" className="setting-description">
                Shows WCAG AA compliant focus outlines with high contrast borders when navigating with keyboard
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.keyboardNavigation}
                  onChange={(e) => handleToggle('keyboardNavigation', e.target.checked,
                    e.target.checked ? 'Keyboard navigation enhanced' : 'Keyboard navigation standard')}
                  aria-describedby="keyboard-nav-desc"
                />
                <span>Enhanced Keyboard Navigation</span>
              </label>
              <p id="keyboard-nav-desc" className="setting-description">
                Enables arrow key navigation and keyboard shortcuts
              </p>
            </div>
          </div>

          <div className="setting-group">
            <h3>Screen Reader Settings</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.announcements}
                  onChange={(e) => handleToggle('announcements', e.target.checked,
                    e.target.checked ? 'Screen reader announcements enabled' : 'Screen reader announcements disabled')}
                  aria-describedby="announcements-desc"
                />
                <span>Screen Reader Announcements</span>
              </label>
              <p id="announcements-desc" className="setting-description">
                Announces page changes and important updates to assistive technology
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.screenReaderMode}
                  onChange={(e) => handleToggle('screenReaderMode', e.target.checked,
                    e.target.checked ? 'Screen reader optimizations enabled' : 'Screen reader optimizations disabled')}
                  aria-describedby="screen-reader-mode-desc"
                />
                <span>Screen Reader Optimizations</span>
              </label>
              <p id="screen-reader-mode-desc" className="setting-description">
                Optimizes interface for screen reader users by removing decorative elements and enhancing semantic structure
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={preferences.alternativeText}
                  onChange={(e) => handleToggle('alternativeText', e.target.checked,
                    e.target.checked ? 'Alternative text display enabled' : 'Alternative text display disabled')}
                  aria-describedby="alt-text-desc"
                />
                <span>Show Alternative Text</span>
              </label>
              <p id="alt-text-desc" className="setting-description">
                Displays alternative text descriptions for images and interactive elements when available
              </p>
            </div>
          </div>
        </div>

        <div className="accessibility-settings-footer">
          <button
            className="primary-button"
            onClick={onClose}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;