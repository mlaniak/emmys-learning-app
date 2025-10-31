import React, { useState, useEffect } from 'react';
import { pushNotificationManager } from '../utils/pushNotifications';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotificationStatus();
    }
  }, [isOpen]);

  const loadNotificationStatus = async () => {
    try {
      await pushNotificationManager.initialize();
      const status = pushNotificationManager.getSubscriptionStatus();
      const prefs = pushNotificationManager.getReminderPreferences();
      
      setSubscriptionStatus(status);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification status:', error);
      setError('Failed to load notification settings');
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await pushNotificationManager.requestPermission();
      
      if (result.success) {
        // Enable reminders with current preferences
        await pushNotificationManager.scheduleLearningReminders({
          ...preferences,
          enabled: true
        });
        
        // Reload status
        await loadNotificationStatus();
        
        // Show success message
        setError(null);
      } else {
        setError(result.reason === 'permission_denied' 
          ? 'Notifications were blocked. Please enable them in your browser settings.'
          : 'Failed to enable notifications. Please try again.'
        );
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationManager.unsubscribe();
      
      // Update preferences
      const updatedPrefs = { ...preferences, enabled: false };
      setPreferences(updatedPrefs);
      localStorage.setItem('emmy-reminder-preferences', JSON.stringify(updatedPrefs));
      
      // Reload status
      await loadNotificationStatus();
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      setError('Failed to disable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    
    // Save preferences
    localStorage.setItem('emmy-reminder-preferences', JSON.stringify(updatedPrefs));
    
    // If notifications are enabled, update the schedule
    if (subscriptionStatus?.isSubscribed && updatedPrefs.enabled) {
      try {
        await pushNotificationManager.scheduleLearningReminders(updatedPrefs);
      } catch (error) {
        console.error('Failed to update reminder schedule:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Learning Reminders</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!subscriptionStatus?.isSupported ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Notifications Not Supported
            </h3>
            <p className="text-gray-600">
              Your browser doesn't support push notifications. You can still use all learning features!
            </p>
          </div>
        ) : !subscriptionStatus?.isSubscribed ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Enable Learning Reminders
            </h3>
            <p className="text-gray-600 mb-6">
              Get friendly reminders to keep your learning streak going! We'll send you:
            </p>
            
            <div className="text-left mb-6 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-purple-500">📚</span>
                <span className="text-sm text-gray-700">Daily learning reminders</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-500">🎯</span>
                <span className="text-sm text-gray-700">Weekly progress check-ins</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-500">🔥</span>
                <span className="text-sm text-gray-700">Streak maintenance alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-500">🏆</span>
                <span className="text-sm text-gray-700">Achievement celebrations</span>
              </div>
            </div>

            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Enabling...' : 'Enable Reminders'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-green-800">Reminders Enabled</div>
                  <div className="text-sm text-green-600">You'll receive learning notifications</div>
                </div>
              </div>
              <button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Disable
              </button>
            </div>

            {preferences && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Reminder Settings</h3>
                
                {/* Daily Reminder */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Daily Learning Reminder</div>
                    <div className="text-sm text-gray-600">Get reminded to practice every day</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.dailyReminder}
                      onChange={(e) => handlePreferenceChange('dailyReminder', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Reminder Time */}
                {preferences.dailyReminder && (
                  <div className="ml-4">
                    <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 mb-1">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      id="reminder-time"
                      name="reminderTime"
                      value={preferences.reminderTime}
                      onChange={(e) => handlePreferenceChange('reminderTime', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Weekly Goal */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Weekly Progress Check</div>
                    <div className="text-sm text-gray-600">Review your weekly learning progress</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.weeklyGoal}
                      onChange={(e) => handlePreferenceChange('weeklyGoal', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Streak Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Streak Reminders</div>
                    <div className="text-sm text-gray-600">Don't break your learning streak!</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.streakReminders}
                      onChange={(e) => handlePreferenceChange('streakReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Achievement Celebrations */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Achievement Celebrations</div>
                    <div className="text-sm text-gray-600">Celebrate when you earn new badges</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.achievementCelebrations}
                      onChange={(e) => handlePreferenceChange('achievementCelebrations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            You can change these settings anytime. Notifications help you stay consistent with learning!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;