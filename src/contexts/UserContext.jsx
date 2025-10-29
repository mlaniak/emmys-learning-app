import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/config';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create user profile in Supabase
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;

    // Skip Supabase if RLS issues detected
    if (localStorage.getItem('supabaseDisabled') === 'true') {
      console.log('Supabase disabled due to RLS issues, skipping profile creation');
      return;
    }

    try {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const { displayName, email } = user.user_metadata;
        const createdAt = new Date().toISOString();
        
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            display_name: displayName || email,
            email: email,
            created_at: createdAt,
            avatar: 'default',
            preferences: {
              difficulty: 'medium',
              sound_enabled: true,
              music_enabled: true,
              theme: 'light'
            },
            progress: {
              score: 0,
              learning_streak: 0,
              completed_lessons: [],
              achievements: [],
              last_active: createdAt
            },
            parent_email: additionalData.parentEmail || null,
            is_child: additionalData.isChild || false,
            ...additionalData
          });

        if (error) {
          console.error('Error creating user profile:', error);
          setError('Failed to create user profile');
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      setError('Failed to create user profile');
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, displayName, additionalData = {}) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            ...additionalData
          }
        }
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        await createUserProfile(data.user, { displayName, ...additionalData });
      }

      return data.user;
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
    }
  };

  // Development mode login - bypasses authentication
  const loginAsDeveloper = () => {
    const tempUser = {
      id: 'dev-user-123',
      email: 'developer@test.com'
    };
    const tempProfile = {
      id: 'dev-user-123',
      display_name: 'Developer',
      email: 'developer@test.com',
      avatar: 'default',
      preferences: {
        difficulty: 'medium',
        sound_enabled: true,
        music_enabled: true,
        theme: 'light'
      },
      progress: {
        score: 0,
        learning_streak: 0,
        completed_lessons: [],
        achievements: [],
        last_active: new Date().toISOString()
      },
      is_child: true,  // Set as child to bypass parent dashboard
      is_guest: false,
      is_developer: true  // Flag to show original game interface
    };
    
    setUser(tempUser);
    setUserProfile(tempProfile);
    setError(null);
    setLoading(false);
    
    // Set developer mode flag and redirect to original game
    localStorage.setItem('developerMode', 'true');
    window.location.href = '/emmys-learning-app/#/game';
  };

  // Guest login - creates a temporary local profile
  const loginAsGuest = () => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const guestProfile = {
      id: guestId,
      display_name: 'Guest User',
      email: `${guestId}@guest.local`,
      avatar: 'default',
      preferences: {
        difficulty: 'medium',
        sound_enabled: true,
        music_enabled: true,
        theme: 'light'
      },
      progress: {
        score: 0,
        learning_streak: 0,
        completed_lessons: [],
        achievements: [],
        last_active: new Date().toISOString()
      },
      is_child: false,
      is_guest: true
    };

    // Store guest data in localStorage
    localStorage.setItem('guestProfile', JSON.stringify(guestProfile));
    localStorage.setItem('isGuest', 'true');

    // Set user and profile
    setUser({ id: guestId, email: guestProfile.email });
    setUserProfile(guestProfile);
    setError(null);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/emmys-learning-app`
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/emmys-learning-app`
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Apple sign in error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Update user progress
  const updateProgress = async (progressUpdates) => {
    if (!user) return;

    // Handle guest users
    if (userProfile?.is_guest) {
      const updatedProfile = {
        ...userProfile,
        progress: { ...userProfile.progress, ...progressUpdates }
      };
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('users')
        .update({
          progress: {
            ...userProfile.progress,
            last_active: new Date().toISOString(),
            ...progressUpdates
          }
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        progress: { ...prev.progress, ...progressUpdates }
      }));
    } catch (error) {
      console.error('Update progress error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Get user profile from Supabase
  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Get user profile error:', error);
        
        // If it's an RLS policy error, create a default profile and skip Supabase
        if (error.code === '42P17' || error.message.includes('infinite recursion') || error.code === 'PGRST301') {
          console.log('RLS policy error detected, creating default profile and disabling Supabase sync');
          
          // Create a default profile that doesn't rely on Supabase
          const defaultProfile = {
            id: userId,
            display_name: 'User',
            email: 'user@example.com',
            avatar: 'default',
            preferences: {
              difficulty: 'medium',
              sound_enabled: true,
              music_enabled: true,
              theme: 'light'
            },
            progress: {
              score: 0,
              learning_streak: 0,
              completed_lessons: [],
              achievements: [],
              last_active: new Date().toISOString()
            },
            is_child: false,
            is_guest: false
          };
          
          // Store in localStorage as backup
          localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
          localStorage.setItem('supabaseDisabled', 'true');
          
          return defaultProfile;
        }
        
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      
      // Final fallback - try to get from localStorage
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        console.log('Using stored profile from localStorage');
        return JSON.parse(storedProfile);
      }
      
      return null;
    }
  };

  // Get children for parent account
  const getChildren = async (parentEmail) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('parent_email', parentEmail)
        .eq('is_child', true);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get children error:', error);
      return [];
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('UserContext: useEffect started');
    
    // Safety timeout - ensure loading never gets stuck
    const loadingTimeout = setTimeout(() => {
      console.log('UserContext: Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    // Check for guest user first
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      console.log('UserContext: Guest user detected');
      const guestProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      if (guestProfile.id) {
        setUser({ id: guestProfile.id, email: guestProfile.email });
        setUserProfile(guestProfile);
        setLoading(false);
        console.log('UserContext: Guest profile loaded, loading set to false');
        clearTimeout(loadingTimeout);
        return;
      }
    }

    // Get initial session - Supabase will automatically handle OAuth callbacks
    const getInitialSession = async () => {
      console.log('UserContext: Getting initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('UserContext: Session data:', session);
        console.log('UserContext: Session error:', error);
        
        if (error) {
          console.error('UserContext: Session error:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('UserContext: User found in session:', session.user);
          setUser(session.user);
          
          try {
            console.log('UserContext: Loading user profile...');
            const profile = await getUserProfile(session.user.id);
            console.log('UserContext: Profile loaded:', profile);
            setUserProfile(profile);
          } catch (profileError) {
            console.error('UserContext: Profile loading error:', profileError);
            // Create a minimal profile to prevent React crash
            const minimalProfile = {
              id: session.user.id,
              display_name: session.user.user_metadata?.display_name || session.user.email || 'User',
              email: session.user.email || 'user@example.com',
              avatar: 'default',
              preferences: { difficulty: 'medium', sound_enabled: true, music_enabled: true, theme: 'light' },
              progress: { score: 0, learning_streak: 0, completed_lessons: [], achievements: [], last_active: new Date().toISOString() },
              is_child: false,
              is_guest: false
            };
            console.log('UserContext: Using minimal profile:', minimalProfile);
            setUserProfile(minimalProfile);
          }
        } else {
          console.log('UserContext: No user in session');
        }
      } catch (sessionError) {
        console.error('UserContext: Session error:', sessionError);
      } finally {
        console.log('UserContext: Setting loading to false');
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserContext: Auth state change:', event, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('UserContext: SIGNED_IN event - User authenticated:', session.user);
          setUser(session.user);
          
          try {
            console.log('UserContext: SIGNED_IN - Loading user profile...');
            const profile = await getUserProfile(session.user.id);
            console.log('UserContext: SIGNED_IN - User profile loaded:', profile);
            setUserProfile(profile);
          } catch (profileError) {
            console.error('UserContext: SIGNED_IN - Error loading user profile:', profileError);
            // Set a default profile if profile loading fails
            const defaultProfile = {
              id: session.user.id,
              display_name: session.user.user_metadata?.display_name || session.user.email,
              email: session.user.email,
              avatar: 'default',
              preferences: {
                difficulty: 'medium',
                sound_enabled: true,
                music_enabled: true,
                theme: 'light'
              },
              progress: {
                score: 0,
                learning_streak: 0,
                completed_lessons: [],
                achievements: [],
                last_active: new Date().toISOString()
              },
              is_child: false,
              is_guest: false
            };
            setUserProfile(defaultProfile);
            console.log('UserContext: SIGNED_IN - Using default profile');
          }
          
          // Clear guest data when real user signs in
          localStorage.removeItem('isGuest');
          localStorage.removeItem('guestProfile');
          
          // CRITICAL: Set loading to false after profile is set
          console.log('UserContext: SIGNED_IN - Setting loading to false');
          setLoading(false);
          clearTimeout(loadingTimeout);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('UserContext: User signed out');
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          clearTimeout(loadingTimeout);
          // Ensure hash is cleared on sign out if it contains tokens
          if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
            console.log('UserContext: Clearing hash on SIGNED_OUT event with OAuth params');
            window.history.replaceState(null, '', window.location.pathname);
          }
          
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('UserContext: Initial session detected:', session.user);
          setUser(session.user);
          const profile = await getUserProfile(session.user.id);
          setUserProfile(profile);
          // Clear guest data if an initial session is found
          localStorage.removeItem('isGuest');
          localStorage.removeItem('guestProfile');
          
        } else {
          console.log('UserContext: No user session or other event:', event);
          setUser(null);
          setUserProfile(null);
        }
        
        console.log('UserContext: Setting loading to false for event:', event);
        setLoading(false);
        console.log('UserContext: Loading state should now be false');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    logout,
    loginAsGuest,
    loginAsDeveloper,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    updateUserProfile,
    updateProgress,
    getUserProfile,
    getChildren,
    setError
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};