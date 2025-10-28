import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const ProfileManager = ({ onClose }) => {
  const { userProfile, updateUserProfile } = useUser();
  const [activeTab, setActiveTab] = useState('avatar');
  const [isLoading, setIsLoading] = useState(false);

  const avatars = [
    { id: 'default', emoji: '👦', name: 'Default' },
    { id: 'girl', emoji: '👧', name: 'Girl' },
    { id: 'boy', emoji: '🧑', name: 'Boy' },
    { id: 'princess', emoji: '👸', name: 'Princess' },
    { id: 'superhero', emoji: '🦸', name: 'Superhero' },
    { id: 'robot', emoji: '🤖', name: 'Robot' },
    { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
    { id: 'dinosaur', emoji: '🦕', name: 'Dinosaur' }
  ];

  const themes = [
    { id: 'light', name: 'Light', color: 'bg-yellow-200', text: 'text-yellow-800' },
    { id: 'dark', name: 'Dark', color: 'bg-gray-800', text: 'text-white' },
    { id: 'ocean', name: 'Ocean', color: 'bg-blue-200', text: 'text-blue-800' },
    { id: 'forest', name: 'Forest', color: 'bg-green-200', text: 'text-green-800' },
    { id: 'sunset', name: 'Sunset', color: 'bg-orange-200', text: 'text-orange-800' }
  ];

  const handleAvatarChange = async (avatarId) => {
    setIsLoading(true);
    try {
      await updateUserProfile({ avatar: avatarId });
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        preferences: {
          ...userProfile.preferences,
          [key]: value
        }
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (themeId) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        preferences: {
          ...userProfile.preferences,
          theme: themeId
        }
      });
    } catch (error) {
      console.error('Error updating theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Profile 🎨</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 mt-2">Customize your learning experience!</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'avatar', name: 'Avatar', emoji: '👤' },
            { id: 'preferences', name: 'Settings', emoji: '⚙️' },
            { id: 'theme', name: 'Theme', emoji: '🎨' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mr-2">{tab.emoji}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'avatar' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Avatar! 🎭</h3>
              <div className="grid grid-cols-4 gap-4">
                {avatars.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarChange(avatar.id)}
                    disabled={isLoading}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    userProfile?.avatar === avatar.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-4xl mb-2">{avatar.emoji}</div>
                    <div className="text-sm font-medium">{avatar.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Learning Preferences 📚</h3>
              
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level 🎯
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'easy', label: 'Easy', emoji: '😊' },
                    { value: 'medium', label: 'Medium', emoji: '🤔' },
                    { value: 'hard', label: 'Hard', emoji: '🧠' }
                  ].map(level => (
                    <button
                      key={level.value}
                      onClick={() => handlePreferenceChange('difficulty', level.value)}
                      disabled={isLoading}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      userProfile?.preferences?.difficulty === level.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-lg mr-2">{level.emoji}</span>
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Sound Effects 🔊
                    </label>
                    <p className="text-xs text-gray-500">Hear fun sounds when you learn!</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('sound_enabled', !userProfile?.preferences?.sound_enabled)}
                    disabled={isLoading}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      userProfile?.preferences?.sound_enabled ? 'bg-purple-500' : 'bg-gray-300'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      userProfile?.preferences?.sound_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Background Music 🎵
                    </label>
                    <p className="text-xs text-gray-500">Play music while learning</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('music_enabled', !userProfile?.preferences?.music_enabled)}
                    disabled={isLoading}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      userProfile?.preferences?.music_enabled ? 'bg-purple-500' : 'bg-gray-300'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      userProfile?.preferences?.music_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Theme! 🌈</h3>
              <div className="grid grid-cols-2 gap-4">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      userProfile?.preferences?.theme === theme.id
                        ? 'border-purple-500'
                        : 'border-gray-200 hover:border-purple-300'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`${theme.color} ${theme.text} p-4 rounded-lg text-center`}>
                      <div className="text-2xl mb-2">🎨</div>
                      <div className="font-semibold">{theme.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Changes are saved automatically! ✨
            </div>
            <button
              onClick={onClose}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Done! 🎉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
