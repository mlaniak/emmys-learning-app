import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const ParentDashboard = () => {
  const { userProfile, getChildren } = useUser();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userProfile?.email) {
      loadChildren();
    }
  }, [userProfile]);

  const loadChildren = async () => {
    setIsLoading(true);
    try {
      const childrenData = await getChildren(userProfile.email);
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalProgress = () => {
    if (!children.length) return { totalScore: 0, totalLessons: 0, totalStreak: 0 };
    
    return children.reduce((totals, child) => ({
      totalScore: totals.totalScore + (child.progress?.score || 0),
      totalLessons: totals.totalLessons + (child.progress?.completed_lessons?.length || 0),
      totalStreak: Math.max(totals.totalStreak, child.progress?.learning_streak || 0)
    }), { totalScore: 0, totalLessons: 0, totalStreak: 0 });
  };

  const getRecentActivity = () => {
    const allActivity = children.flatMap(child => 
      (child.progress?.completed_lessons || []).map(lesson => ({
        childName: child.display_name,
        lesson,
        timestamp: child.progress?.last_active || new Date()
      }))
    );
    
    return allActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your children's progress...</div>
        </div>
      </div>
    );
  }

  const totalProgress = getTotalProgress();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard 👨‍👩‍👧‍👦</h1>
              <p className="text-gray-600 mt-1">Track your children's learning progress</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Welcome back,</div>
              <div className="font-semibold text-gray-900">{userProfile?.displayName}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Children Found</h2>
            <p className="text-gray-600 mb-6">
              Children need to sign up with your email as their parent email to appear here.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-blue-900 mb-2">How to add children:</h3>
              <ol className="text-sm text-blue-800 text-left space-y-1">
                <li>1. Have your child create an account</li>
                <li>2. Use your email as the "Parent Email"</li>
                <li>3. Check the "I'm a kid" box</li>
                <li>4. They'll appear here automatically!</li>
              </ol>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">👶</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{children.length}</div>
                    <div className="text-sm text-gray-600">Children</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⭐</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalProgress.totalScore}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📚</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalProgress.totalLessons}</div>
                    <div className="text-sm text-gray-600">Lessons Completed</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🔥</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalProgress.totalStreak}</div>
                    <div className="text-sm text-gray-600">Best Streak</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Children List */}
            <div className="bg-white rounded-xl shadow-sm mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Your Children 👨‍👩‍👧‍👦</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map(child => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedChild?.id === child.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <div className="text-2xl mr-3">
                          {child.avatar === 'girl' ? '👧' : 
                           child.avatar === 'boy' ? '👦' : 
                           child.avatar === 'princess' ? '👸' : 
                           child.avatar === 'superhero' ? '🦸' : 
                           child.avatar === 'robot' ? '🤖' : 
                           child.avatar === 'unicorn' ? '🦄' : 
                           child.avatar === 'dinosaur' ? '🦕' : '👤'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{child.display_name}</div>
                          <div className="text-sm text-gray-600">{child.email}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-purple-600">{child.progress?.score || 0}</div>
                          <div className="text-gray-500">Points</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{child.progress?.learning_streak || 0}</div>
                          <div className="text-gray-500">Streak</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Child Details */}
            {selectedChild && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedChild.display_name}'s Progress
                    </h2>
                    <div className="text-sm text-gray-500">
                      Last active: {selectedChild.progress?.last_active ? 
                        new Date(selectedChild.progress.last_active).toLocaleDateString() : 
                        'Never'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {selectedChild.progress?.score || 0}
                      </div>
                      <div className="text-gray-600">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {selectedChild.progress?.learning_streak || 0}
                      </div>
                      <div className="text-gray-600">Learning Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {selectedChild.progress?.completed_lessons?.length || 0}
                      </div>
                      <div className="text-gray-600">Lessons Completed</div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements 🏆</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedChild.progress?.achievements?.map(achievement => (
                        <div key={achievement.id} className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl mb-1">{achievement.emoji}</div>
                          <div className="text-sm font-semibold text-yellow-800">{achievement.name}</div>
                        </div>
                      )) || (
                        <div className="col-span-full text-center text-gray-500 py-4">
                          No achievements yet. Keep learning! 🌟
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences ⚙️</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700">Difficulty</div>
                        <div className="text-lg text-purple-600 capitalize">
                          {selectedChild.preferences?.difficulty || 'medium'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700">Sound</div>
                        <div className="text-lg text-green-600">
                          {selectedChild.preferences?.sound_enabled ? '🔊' : '🔇'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700">Music</div>
                        <div className="text-lg text-blue-600">
                          {selectedChild.preferences?.music_enabled ? '🎵' : '🔇'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700">Theme</div>
                        <div className="text-lg text-orange-600 capitalize">
                          {selectedChild.preferences?.theme || 'light'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm mt-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity 📈</h2>
              </div>
              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center">
                          <div className="text-green-500 mr-3">✓</div>
                          <div>
                            <div className="font-medium text-gray-900">{activity.childName}</div>
                            <div className="text-sm text-gray-600">Completed: {activity.lesson}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">📚</div>
                    <div>No recent activity. Encourage your children to start learning!</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
