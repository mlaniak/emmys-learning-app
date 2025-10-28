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
          redirectTo: `${window.location.origin}${window.location.pathname}auth/callback`
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
          redirectTo: `${window.location.origin}${window.location.pathname}auth/callback`
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
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
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
    // Check for OAuth callback first
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      console.log('UserContext: Checking for OAuth callback, hash:', hash);
      
      if (hash.includes('access_token') || hash.includes('error')) {
        console.log('UserContext: OAuth callback detected, processing...');
        try {
          // Let Supabase handle the OAuth callback
          const { data, error } = await supabase.auth.getSession();
          console.log('UserContext: OAuth session result:', data, error);
          
          if (data.session) {
            console.log('UserContext: OAuth session established:', data.session);
            setUser(data.session.user);
            const profile = await getUserProfile(data.session.user.id);
            setUserProfile(profile);
            // Clear the hash after processing
            window.location.hash = '';
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('UserContext: OAuth callback error:', error);
        }
      }
    };

    // Check for guest user first
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      const guestProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      if (guestProfile.id) {
        setUser({ id: guestProfile.id, email: guestProfile.email });
        setUserProfile(guestProfile);
        setLoading(false);
        return;
      }
    }

    // Handle OAuth callback
    handleOAuthCallback();

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const profile = await getUserProfile(session.user.id);
        setUserProfile(profile);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserContext: Auth state change:', event, session);
        if (session?.user) {
          console.log('UserContext: User authenticated:', session.user);
          setUser(session.user);
          const profile = await getUserProfile(session.user.id);
          console.log('UserContext: User profile loaded:', profile);
          setUserProfile(profile);
          // Clear guest data when real user signs in
          localStorage.removeItem('isGuest');
          localStorage.removeItem('guestProfile');
        } else {
          console.log('UserContext: No user session');
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
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