import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/config';
import { getOAuthConfig, isDevelopment } from '../utils/environmentConfig';
import { handleOAuthError, oauthErrorRecovery } from '../utils/oauthErrorRecovery';
import { startOAuthFlow, logOAuthEvent, logOAuthError, logOAuthPerformance, completeOAuthFlow, OAUTH_PROVIDERS, OAUTH_STAGES } from '../utils/oauthLogger';

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
  const [errorRecovery, setErrorRecovery] = useState(null);

  // Create user profile in Supabase
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) {
      if (isDevelopment()) {
        console.warn('⚠️ createUserProfile called without user');
      }
      return;
    }

    // Skip Supabase if RLS issues detected
    if (localStorage.getItem('supabaseDisabled') === 'true') {
      if (isDevelopment()) {
        console.log('🚫 Supabase disabled due to RLS issues, skipping profile creation');
      }
      return;
    }

    try {
      if (isDevelopment()) {
        console.log('👤 Creating user profile for:', user.id);
      }

      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Handle the case where no profile exists (expected for new users)
      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected for new users
        throw selectError;
      }

      if (!existingProfile) {
        const { displayName, email } = user.user_metadata || {};
        const createdAt = new Date().toISOString();
        
        const profileData = {
          id: user.id,
          display_name: displayName || email || 'User',
          email: email || user.email,
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
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert(profileData);

        if (insertError) {
          throw insertError;
        }

        if (isDevelopment()) {
          console.log('✅ User profile created successfully');
        }
      } else {
        if (isDevelopment()) {
          console.log('👤 User profile already exists');
        }
      }
    } catch (error) {
      const errorMessage = `Failed to create user profile: ${error.message}`;
      
      if (isDevelopment()) {
        console.error('🚨 Error creating user profile:', {
          error: error.message,
          code: error.code,
          details: error.details,
          userId: user.id
        });
      }
      
      // Set a user-friendly error message
      let userFriendlyMessage = 'Failed to set up your profile. You can still use the app.';
      
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        userFriendlyMessage = 'Profile setup encountered a database issue. Using default settings.';
        // Mark Supabase as disabled for this session
        localStorage.setItem('supabaseDisabled', 'true');
      }
      
      setError(userFriendlyMessage);
      
      // Don't throw the error - allow the user to continue with a default profile
      if (isDevelopment()) {
        console.warn('⚠️ Continuing without profile creation due to error');
      }
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

  // Sign in with Google with enhanced error recovery
  const signInWithGoogle = async (recoveryOptions = {}) => {
    // Start OAuth flow logging
    const flowId = startOAuthFlow(OAUTH_PROVIDERS.GOOGLE, {
      redirectUrl: getOAuthConfig().redirectTo,
      isRetry: recoveryOptions.isRetry || false
    });
    
    const startTime = Date.now();
    
    try {
      setError(null);
      setErrorRecovery(null);
      
      // Get environment-aware OAuth configuration
      const oauthConfig = getOAuthConfig();
      
      // Log configuration event
      logOAuthEvent(flowId, 'configuration_loaded', {
        stage: OAUTH_STAGES.INITIATION,
        redirectTo: oauthConfig.redirectTo,
        queryParams: oauthConfig.queryParams
      });
      
      if (isDevelopment()) {
        console.log('🔐 Google OAuth Configuration:', {
          redirectTo: oauthConfig.redirectTo,
          queryParams: oauthConfig.queryParams
        });
      }
      
      // Log OAuth initiation
      logOAuthEvent(flowId, 'oauth_initiation_started', {
        stage: OAUTH_STAGES.INITIATION,
        provider: OAUTH_PROVIDERS.GOOGLE
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthConfig.redirectTo,
          queryParams: oauthConfig.queryParams,
        }
      });
      
      // Log performance metric for initiation time
      logOAuthPerformance(flowId, 'initiation_duration', Date.now() - startTime, {
        stage: OAUTH_STAGES.INITIATION
      });
      
      if (error) {
        // Log OAuth error
        logOAuthError(flowId, error, {
          stage: OAUTH_STAGES.INITIATION,
          provider: OAUTH_PROVIDERS.GOOGLE,
          redirectTo: oauthConfig.redirectTo
        });
        
        // Enhanced error handling with recovery mechanisms
        const enhancedError = new Error(error.message);
        enhancedError.code = error.code;
        enhancedError.status = error.status;
        enhancedError.details = error.details;
        
        // Log detailed error information in development
        if (isDevelopment()) {
          console.error('🚨 Google OAuth Error Details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.details,
            redirectTo: oauthConfig.redirectTo
          });
        }
        
        // Handle OAuth error with recovery mechanisms
        const errorAnalysis = await handleOAuthError(enhancedError, {
          provider: 'google',
          redirectTo: oauthConfig.redirectTo,
          userId: user?.id,
          flowId
        }, {
          ...recoveryOptions,
          retryCallback: () => signInWithGoogle({ ...recoveryOptions, isRetry: true })
        });
        
        // Set error recovery state for UI to handle
        setErrorRecovery(errorAnalysis);
        
        // Set user-friendly error message
        setError(errorAnalysis.userMessage);
        
        // Complete flow as failed
        completeOAuthFlow(flowId, false, {
          error: error.message,
          errorType: errorAnalysis.errorType,
          recoveryStrategy: errorAnalysis.recoveryStrategy
        });
        
        throw enhancedError;
      }
      
      // Reset retry counts on successful OAuth initiation
      oauthErrorRecovery.resetAllRetryCounts();
      
      // Log successful initiation
      logOAuthEvent(flowId, 'oauth_redirect_initiated', {
        stage: OAUTH_STAGES.REDIRECT,
        provider: OAUTH_PROVIDERS.GOOGLE
      });
      
      if (isDevelopment()) {
        console.log('✅ Google OAuth initiated successfully:', data);
      }
      
      // Note: Flow completion will be handled in AuthCallback component
      // Store flowId for callback processing
      sessionStorage.setItem('oauthFlowId', flowId);
      
      return data;
    } catch (error) {
      // Catch any unexpected errors
      const errorMessage = error.message || 'An unexpected error occurred during Google sign-in';
      
      // Log unexpected error
      logOAuthError(flowId, error, {
        stage: OAUTH_STAGES.INITIATION,
        provider: OAUTH_PROVIDERS.GOOGLE,
        type: 'unexpected_error'
      });
      
      if (isDevelopment()) {
        console.error('🚨 Unexpected Google sign-in error:', error);
      }
      
      // If error recovery hasn't been set, handle it as an unexpected error
      if (!errorRecovery) {
        const errorAnalysis = await handleOAuthError(error, {
          provider: 'google',
          type: 'unexpected_error',
          userId: user?.id,
          flowId
        }, recoveryOptions);
        
        setErrorRecovery(errorAnalysis);
        setError(errorAnalysis.userMessage);
      }
      
      // Complete flow as failed
      completeOAuthFlow(flowId, false, {
        error: errorMessage,
        errorType: 'unexpected_error'
      });
      
      throw error;
    }
  };

  // Sign in with Apple with enhanced error recovery
  const signInWithApple = async (recoveryOptions = {}) => {
    // Start OAuth flow logging
    const flowId = startOAuthFlow(OAUTH_PROVIDERS.APPLE, {
      redirectUrl: getOAuthConfig().redirectTo,
      isRetry: recoveryOptions.isRetry || false
    });
    
    const startTime = Date.now();
    
    try {
      setError(null);
      setErrorRecovery(null);
      
      // Get environment-aware OAuth configuration
      const oauthConfig = getOAuthConfig();
      
      // Log configuration event
      logOAuthEvent(flowId, 'configuration_loaded', {
        stage: OAUTH_STAGES.INITIATION,
        redirectTo: oauthConfig.redirectTo
      });
      
      if (isDevelopment()) {
        console.log('🍎 Apple OAuth Configuration:', {
          redirectTo: oauthConfig.redirectTo
        });
      }
      
      // Log OAuth initiation
      logOAuthEvent(flowId, 'oauth_initiation_started', {
        stage: OAUTH_STAGES.INITIATION,
        provider: OAUTH_PROVIDERS.APPLE
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: oauthConfig.redirectTo
        }
      });
      
      // Log performance metric for initiation time
      logOAuthPerformance(flowId, 'initiation_duration', Date.now() - startTime, {
        stage: OAUTH_STAGES.INITIATION
      });
      
      if (error) {
        // Log OAuth error
        logOAuthError(flowId, error, {
          stage: OAUTH_STAGES.INITIATION,
          provider: OAUTH_PROVIDERS.APPLE,
          redirectTo: oauthConfig.redirectTo
        });
        
        // Enhanced error handling with recovery mechanisms
        const enhancedError = new Error(error.message);
        enhancedError.code = error.code;
        enhancedError.status = error.status;
        enhancedError.details = error.details;
        
        if (isDevelopment()) {
          console.error('🚨 Apple OAuth Error Details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.details,
            redirectTo: oauthConfig.redirectTo
          });
        }
        
        // Handle OAuth error with recovery mechanisms
        const errorAnalysis = await handleOAuthError(enhancedError, {
          provider: 'apple',
          redirectTo: oauthConfig.redirectTo,
          userId: user?.id,
          flowId
        }, {
          ...recoveryOptions,
          retryCallback: () => signInWithApple({ ...recoveryOptions, isRetry: true })
        });
        
        // Set error recovery state for UI to handle
        setErrorRecovery(errorAnalysis);
        
        // Set user-friendly error message
        setError(errorAnalysis.userMessage);
        
        // Complete flow as failed
        completeOAuthFlow(flowId, false, {
          error: error.message,
          errorType: errorAnalysis.errorType,
          recoveryStrategy: errorAnalysis.recoveryStrategy
        });
        
        throw enhancedError;
      }
      
      // Reset retry counts on successful OAuth initiation
      oauthErrorRecovery.resetAllRetryCounts();
      
      // Log successful initiation
      logOAuthEvent(flowId, 'oauth_redirect_initiated', {
        stage: OAUTH_STAGES.REDIRECT,
        provider: OAUTH_PROVIDERS.APPLE
      });
      
      if (isDevelopment()) {
        console.log('✅ Apple OAuth initiated successfully:', data);
      }
      
      // Note: Flow completion will be handled in AuthCallback component
      // Store flowId for callback processing
      sessionStorage.setItem('oauthFlowId', flowId);
      
      return data;
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred during Apple sign-in';
      
      // Log unexpected error
      logOAuthError(flowId, error, {
        stage: OAUTH_STAGES.INITIATION,
        provider: OAUTH_PROVIDERS.APPLE,
        type: 'unexpected_error'
      });
      
      if (isDevelopment()) {
        console.error('🚨 Unexpected Apple sign-in error:', error);
      }
      
      // If error recovery hasn't been set, handle it as an unexpected error
      if (!errorRecovery) {
        const errorAnalysis = await handleOAuthError(error, {
          provider: 'apple',
          type: 'unexpected_error',
          userId: user?.id,
          flowId
        }, recoveryOptions);
        
        setErrorRecovery(errorAnalysis);
        setError(errorAnalysis.userMessage);
      }
      
      // Complete flow as failed
      completeOAuthFlow(flowId, false, {
        error: errorMessage,
        errorType: 'unexpected_error'
      });
      
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

  // Clear error recovery state
  const clearErrorRecovery = () => {
    setErrorRecovery(null);
    setError(null);
  };

  // Retry authentication with error recovery
  const retryAuthentication = async (provider = 'google', options = {}) => {
    try {
      clearErrorRecovery();
      
      if (provider === 'google') {
        return await signInWithGoogle({ ...options, isRetry: true });
      } else if (provider === 'apple') {
        return await signInWithApple({ ...options, isRetry: true });
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      if (isDevelopment()) {
        console.error('🚨 Retry authentication failed:', error);
      }
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
      // Create a fallback demo user if nothing else worked
      if (!user && !userProfile) {
        console.log('UserContext: Creating fallback demo user due to timeout');
        const fallbackUser = {
          id: 'fallback-user-123',
          email: 'fallback@emmyslearning.com'
        };
        const fallbackProfile = {
          id: 'fallback-user-123',
          display_name: 'Student',
          email: 'fallback@emmyslearning.com',
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
          is_child: true,
          is_guest: false,
          is_fallback: true
        };
        setUser(fallbackUser);
        setUserProfile(fallbackProfile);
      }
      setLoading(false);
    }, 3000); // 3 second timeout (reduced from 10 seconds)
    
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
          // For development/demo mode, create a default user
          if (isDevelopment() || window.location.hash.includes('#/game')) {
            console.log('UserContext: Creating default demo user');
            const demoUser = {
              id: 'demo-user-123',
              email: 'demo@emmyslearning.com'
            };
            const demoProfile = {
              id: 'demo-user-123',
              display_name: 'Demo User',
              email: 'demo@emmyslearning.com',
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
              is_child: true,
              is_guest: false,
              is_demo: true
            };
            setUser(demoUser);
            setUserProfile(demoProfile);
          }
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
        if (isDevelopment()) {
          console.log('🔄 Auth state change:', event, session?.user?.id);
        }
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            if (isDevelopment()) {
              console.log('✅ SIGNED_IN event - User authenticated:', session.user.id);
            }
            
            setUser(session.user);
            setError(null); // Clear any previous errors
            
            try {
              if (isDevelopment()) {
                console.log('👤 Loading user profile...');
              }
              
              const profile = await getUserProfile(session.user.id);
              
              if (profile) {
                setUserProfile(profile);
                if (isDevelopment()) {
                  console.log('✅ User profile loaded successfully');
                }
              } else {
                // Create a default profile if none exists
                const defaultProfile = {
                  id: session.user.id,
                  display_name: session.user.user_metadata?.display_name || session.user.email || 'User',
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
                
                // Try to create the profile in the background
                createUserProfile(session.user).catch(error => {
                  if (isDevelopment()) {
                    console.warn('⚠️ Background profile creation failed:', error.message);
                  }
                });
                
                if (isDevelopment()) {
                  console.log('👤 Using default profile');
                }
              }
            } catch (profileError) {
              if (isDevelopment()) {
                console.error('🚨 Error loading user profile:', profileError);
              }
              
              // Set error but don't block the user
              setError('Profile loading failed. Using default settings.');
              
              // Set a minimal default profile
              const minimalProfile = {
                id: session.user.id,
                display_name: session.user.user_metadata?.display_name || session.user.email || 'User',
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
              
              setUserProfile(minimalProfile);
            }
            
            // Clear guest data when real user signs in
            localStorage.removeItem('isGuest');
            localStorage.removeItem('guestProfile');
            
          } else if (event === 'SIGNED_OUT') {
            if (isDevelopment()) {
              console.log('👋 User signed out');
            }
            
            setUser(null);
            setUserProfile(null);
            setError(null);
            
            // Clear OAuth tokens from URL if present
            if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
              if (isDevelopment()) {
                console.log('🧹 Clearing OAuth tokens from URL');
              }
              window.history.replaceState(null, '', window.location.pathname);
            }
            
          } else if (event === 'INITIAL_SESSION' && session?.user) {
            if (isDevelopment()) {
              console.log('🔄 Initial session detected:', session.user.id);
            }
            
            setUser(session.user);
            
            try {
              const profile = await getUserProfile(session.user.id);
              setUserProfile(profile);
            } catch (error) {
              if (isDevelopment()) {
                console.error('🚨 Error loading initial session profile:', error);
              }
              setError('Profile loading failed. Using default settings.');
            }
            
            // Clear guest data if an initial session is found
            localStorage.removeItem('isGuest');
            localStorage.removeItem('guestProfile');
            
          } else if (event === 'TOKEN_REFRESHED') {
            if (isDevelopment()) {
              console.log('🔄 Token refreshed');
            }
            // No action needed, just log for debugging
            
          } else {
            if (isDevelopment()) {
              console.log('🔄 Auth event:', event, session ? 'with session' : 'no session');
            }
            
            // For other events without a user, clear the state
            if (!session?.user) {
              setUser(null);
              setUserProfile(null);
            }
          }
        } catch (error) {
          if (isDevelopment()) {
            console.error('🚨 Error in auth state change handler:', error);
          }
          
          setError('Authentication error occurred. Please try signing in again.');
        } finally {
          // Always ensure loading is set to false
          setLoading(false);
          clearTimeout(loadingTimeout);
          
          if (isDevelopment()) {
            console.log('✅ Loading set to false for event:', event);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    errorRecovery,
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
    setError,
    clearErrorRecovery,
    retryAuthentication
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};