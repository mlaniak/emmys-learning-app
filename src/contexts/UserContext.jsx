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
  const [oauthProcessed, setOauthProcessed] = useState(false);

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
      is_guest: false
    };
    
    setUser(tempUser);
    setUserProfile(tempProfile);
    setError(null);
    setLoading(false);
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
      
      if ((hash.includes('access_token') || hash.includes('error')) && !oauthProcessed) {
        console.log('UserContext: OAuth callback detected, processing...');
        setOauthProcessed(true);
        try {
          // Parse the hash to extract tokens
          // The hash might be in format: #access_token=...&refresh_token=... or #/auth/callback#access_token=...
          let hashContent = hash.substring(1);
          console.log('UserContext: Full hash content:', hashContent);
          
          // If hash contains /auth/callback, extract the part after the second #
          if (hashContent.includes('/auth/callback#')) {
            hashContent = hashContent.split('/auth/callback#')[1];
            console.log('UserContext: Extracted hash content after /auth/callback:', hashContent);
          }
          
          const hashParams = new URLSearchParams(hashContent);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('token_type');
          const expiresIn = hashParams.get('expires_in');
          
          console.log('UserContext: Extracted tokens - Access:', accessToken ? 'YES' : 'NO', 'Refresh:', refreshToken ? 'YES' : 'NO');
          console.log('UserContext: Token details - Type:', tokenType, 'Expires:', expiresIn);
          console.log('UserContext: Access token length:', accessToken ? accessToken.length : 0);
          
          if (accessToken && refreshToken) {
            console.log('UserContext: Attempting to set session manually...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            console.log('UserContext: setSession result:', sessionData, sessionError);
            
            if (sessionError) {
              console.error('UserContext: setSession error:', sessionError);
              throw sessionError;
            }
            
            if (sessionData.session) {
              console.log('UserContext: Manual session established successfully:', sessionData.session);
              setUser(sessionData.session.user);
              
              try {
                console.log('UserContext: Loading user profile...');
                const profile = await getUserProfile(sessionData.session.user.id);
                console.log('UserContext: User profile loaded:', profile);
                setUserProfile(profile);
                setLoading(false);
                console.log('UserContext: Loading set to false');
                
                // Clear hash after successful session establishment
                console.log('UserContext: Clearing hash after successful session establishment');
                window.history.replaceState(null, '', window.location.pathname);
                return;
              } catch (profileError) {
                console.error('UserContext: Error loading user profile:', profileError);
                // Set a default profile if profile loading fails
                const defaultProfile = {
                  id: sessionData.session.user.id,
                  display_name: sessionData.session.user.user_metadata?.display_name || sessionData.session.user.email,
                  email: sessionData.session.user.email,
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
                setLoading(false);
                console.log('UserContext: Using default profile, loading set to false');
                
                // Clear hash after successful session establishment
                console.log('UserContext: Clearing hash after successful session establishment');
                window.history.replaceState(null, '', window.location.pathname);
                return;
              }
            } else {
              console.log('UserContext: setSession did not return a session');
            }
          } else {
            console.log('UserContext: Access token or refresh token missing from hash');
          }
          
          // Always clear the hash if it contains OAuth parameters, even if session setting failed
          console.log('UserContext: Clearing hash after OAuth callback attempt');
          window.history.replaceState(null, '', window.location.pathname);
          
        } catch (error) {
          console.error('UserContext: OAuth callback error during manual session setting:', error);
          // Clear hash on error too
          window.history.replaceState(null, '', window.location.pathname);
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
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('UserContext: SIGNED_IN event - User authenticated:', session.user);
          console.log('UserContext: OAuth already processed manually:', oauthProcessed);
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
          
          // Clean up URL only after successful sign in with delay
          console.log('UserContext: SIGNED_IN - Cleaning up URL after successful SIGNED_IN event');
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
            console.log('UserContext: SIGNED_IN - URL cleaned up');
          }, 500);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('UserContext: User signed out');
          setUser(null);
          setUserProfile(null);
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