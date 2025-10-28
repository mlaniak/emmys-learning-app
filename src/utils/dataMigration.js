import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

// Data migration utility for existing users
export const useDataMigration = () => {
  const { userProfile, updateProgress } = useUser();

  // Check if user has existing local data
  const hasExistingData = () => {
    const localData = localStorage.getItem('emmyLearningData');
    return localData !== null;
  };

  // Get existing local data
  const getExistingData = () => {
    try {
      const localData = localStorage.getItem('emmyLearningData');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error parsing existing data:', error);
    }
    return null;
  };

  // Migrate local data to user account
  const migrateData = async () => {
    if (!userProfile || !hasExistingData()) return false;

    try {
      const existingData = getExistingData();
      if (!existingData) return false;

      // Map old data structure to new progress structure
      const migratedProgress = {
        score: existingData.score || 0,
        learningStreak: existingData.learningStreak || 0,
        completedLessons: existingData.completedLessons || [],
        achievements: existingData.achievements || [],
        lastActive: new Date()
      };

      // Update user progress with migrated data
      await updateProgress(migratedProgress);

      // Mark migration as complete
      localStorage.setItem('dataMigrationComplete', 'true');
      
      // Optionally keep a backup
      localStorage.setItem('emmyLearningDataBackup', JSON.stringify(existingData));

      console.log('Data migration completed successfully');
      return true;
    } catch (error) {
      console.error('Error during data migration:', error);
      return false;
    }
  };

  // Check if migration is needed
  const needsMigration = () => {
    return hasExistingData() && !localStorage.getItem('dataMigrationComplete');
  };

  // Clear old local data after successful migration
  const cleanupOldData = () => {
    localStorage.removeItem('emmyLearningData');
    localStorage.setItem('dataMigrationComplete', 'true');
  };

  return {
    hasExistingData,
    getExistingData,
    migrateData,
    needsMigration,
    cleanupOldData
  };
};

// Migration prompt component
export const MigrationPrompt = ({ onComplete }) => {
  const { migrateData, needsMigration, getExistingData } = useDataMigration();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  if (!needsMigration()) return null;

  const existingData = getExistingData();

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const success = await migrateData();
      if (success) {
        setMigrationComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome Back!
          </h2>
          <p className="text-gray-600 mb-6">
            We found your previous learning progress! Would you like to migrate it to your new account?
          </p>

          {existingData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Your Previous Progress:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>⭐ {existingData.score || 0} points earned</div>
                <div>🔥 {existingData.learningStreak || 0} day streak</div>
                <div>📚 {existingData.completedLessons?.length || 0} lessons completed</div>
                <div>🏆 {existingData.achievements?.length || 0} achievements unlocked</div>
              </div>
            </div>
          )}

          {migrationComplete ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Migration Complete!
              </h3>
              <p className="text-gray-600">
                Your progress has been saved to your account. You can now access it from any device!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {isMigrating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Migrating...
                  </div>
                ) : (
                  '🚀 Migrate My Progress!'
                )}
              </button>
              
              <button
                onClick={onComplete}
                disabled={isMigrating}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Skip Migration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to automatically handle migration
export const useAutoMigration = () => {
  const { needsMigration, migrateData } = useDataMigration();
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);

  useEffect(() => {
    if (needsMigration()) {
      setShowMigrationPrompt(true);
    }
  }, [needsMigration]);

  const handleMigrationComplete = () => {
    setShowMigrationPrompt(false);
  };

  return {
    showMigrationPrompt,
    handleMigrationComplete
  };
};
