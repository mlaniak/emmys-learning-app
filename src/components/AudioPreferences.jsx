/**
 * AudioPreferences - Component for managing audio settings
 * 
 * Features:
 * - Volume control slider
 * - Mute/unmute toggle
 * - Haptic feedback toggle
 * - Audio status display
 * - Test sound buttons
 */

import React, { useState, useEffect } from 'react';
import audioManager from '../utils/audioManager';

const AudioPreferences = ({ isOpen, onClose }) => {
  const [audioStatus, setAudioStatus] = useState(audioManager.getStatus());
  const [volume, setVolume] = useState(audioManager.getVolume());
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [hapticEnabled, setHapticEnabled] = useState(audioManager.isHapticEnabled());
  const [isTestingSound, setIsTestingSound] = useState(false);

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      setAudioStatus(audioManager.getStatus());
      setVolume(audioManager.getVolume());
      setIsMuted(audioManager.isMuted);
      setHapticEnabled(audioManager.isHapticEnabled());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio on first interaction
  const initializeAudio = async () => {
    if (!audioStatus.isInitialized) {
      await audioManager.initialize();
      setAudioStatus(audioManager.getStatus());
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
    
    // Play a test sound to demonstrate volume
    if (!isMuted) {
      audioManager.playSound('click', { volume: newVolume });
    }
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioManager.setMuted(newMuted);
    
    // Play unmute sound if unmuting
    if (!newMuted) {
      setTimeout(() => {
        audioManager.playSound('click');
      }, 100);
    }
  };

  const handleHapticToggle = () => {
    const newHapticEnabled = !hapticEnabled;
    setHapticEnabled(newHapticEnabled);
    audioManager.setHapticEnabled(newHapticEnabled);
    
    // Test haptic feedback
    if (newHapticEnabled) {
      audioManager.triggerHaptic('click');
    }
  };

  const testSound = async (soundType) => {
    setIsTestingSound(true);
    await initializeAudio();
    await audioManager.playSound(soundType);
    setTimeout(() => setIsTestingSound(false), 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🔊 Audio Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Audio Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Audio Status</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Audio Support:</span>
                <span className={audioStatus.isSupported ? 'text-green-600' : 'text-red-600'}>
                  {audioStatus.isSupported ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Initialized:</span>
                <span className={audioStatus.isInitialized ? 'text-green-600' : 'text-yellow-600'}>
                  {audioStatus.isInitialized ? '✓ Ready' : '⏳ Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Haptic Support:</span>
                <span className={audioStatus.hasHapticSupport ? 'text-green-600' : 'text-gray-500'}>
                  {audioStatus.hasHapticSupport ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-700">Volume</label>
              <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                disabled={isMuted}
              />
              <span className="text-lg">🔊</span>
            </div>
          </div>

          {/* Mute Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-semibold text-gray-700">Sound Effects</label>
              <p className="text-sm text-gray-500">Enable audio feedback for interactions</p>
            </div>
            <button
              onClick={handleMuteToggle}
              className={`w-12 h-6 rounded-full transition-colors ${
                !isMuted ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                !isMuted ? 'translate-x-6' : 'translate-x-0.5'
              }`}></div>
            </button>
          </div>

          {/* Haptic Feedback Toggle */}
          {audioStatus.hasHapticSupport && (
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-gray-700">Haptic Feedback</label>
                <p className="text-sm text-gray-500">Vibration feedback on mobile devices</p>
              </div>
              <button
                onClick={handleHapticToggle}
                className={`w-12 h-6 rounded-full transition-colors ${
                  hapticEnabled ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  hapticEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}></div>
              </button>
            </div>
          )}

          {/* Test Sounds */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Test Sounds</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => testSound('correct')}
                disabled={isTestingSound || isMuted}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                ✓ Correct
              </button>
              <button
                onClick={() => testSound('incorrect')}
                disabled={isTestingSound || isMuted}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                ✗ Incorrect
              </button>
              <button
                onClick={() => testSound('complete')}
                disabled={isTestingSound || isMuted}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                🎉 Complete
              </button>
              <button
                onClick={() => testSound('achievement')}
                disabled={isTestingSound || isMuted}
                className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                🏆 Achievement
              </button>
            </div>
          </div>

          {/* Initialize Button */}
          {!audioStatus.isInitialized && (
            <button
              onClick={initializeAudio}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
            >
              🎵 Enable Audio
            </button>
          )}
        </div>
      </div>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default AudioPreferences;