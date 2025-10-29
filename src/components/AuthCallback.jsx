import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { isDevelopment, getEnvironmentConfig } from '../utils/environmentConfig';
import { oauthErrorRecovery } from '../utils/oauthErrorRecovery';
import { logOAuthEvent, logOAuthError, logOAuthPerformance, completeOAuthFlow, OAUTH_STAGES } from '../utils/oauthLogger';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [processingState, setProcessingState] = useState({
    status: 'processing', // 'processing', 'success', 'error', 'timeout'
    message: 'Completing sign-in...',
    error: null,
    timeoutId: null
  });

  useEffect(() => {
    const config = getEnvironmentConfig();
    const authTimeout = config.settings.authTimeout;

    const handleAuthCallback = async () => {
      // Get OAuth flow ID from session storage
      const flowId = sessionStorage.getItem('oauthFlowId');
      const callbackStartTime = Date.now();
      
      if (flowId) {
        logOAuthEvent(flowId, 'callback_processing_started', {
          stage: OAUTH_STAGES.CALLBACK,
          url: window.location.href
        });
      }
      
      if (isDevelopment()) {
        console.log('🔐 AuthCallback: Starting OAuth callback processing...');
        console.log('🔗 Current URL:', window.location.href);
        console.log('🆔 Flow ID:', flowId);
      }

      // Set up timeout handling for slow authentication processes
      const timeoutId = setTimeout(() => {
        if (isDevelopment()) {
          console.warn('⏰ AuthCallback: Authentication timeout reached');
        }
        setProcessingState({
          status: 'timeout',
          message: 'Sign-in is taking longer than expected',
          error: 'Authentication timeout. This might be due to a slow connection.',
          timeoutId: null
        });

        // Set up auto-redirect after showing timeout message
        setTimeout(() => {
          oauthErrorRecovery.cleanupOAuthUrl();
          navigate('/?fallback=timeout', { replace: true });
        }, 10000);
      }, authTimeout);

      setProcessingState(prev => ({ ...prev, timeoutId }));

      try {
        // Use Supabase's built-in session detection instead of manual URL parsing
        if (isDevelopment()) {
          console.log('🔍 AuthCallback: Using Supabase session detection...');
        }

        // Check for OAuth errors in URL first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const oauthError = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (oauthError) {
          clearTimeout(timeoutId);
          
          // Log OAuth error
          if (flowId) {
            const error = new Error(errorDescription || oauthError);
            error.code = oauthError;
            logOAuthError(flowId, error, {
              stage: OAUTH_STAGES.CALLBACK,
              errorDescription,
              url: window.location.href
            });
          }
          
          if (isDevelopment()) {
            console.error('🚨 AuthCallback: OAuth error detected:', oauthError, errorDescription);
          }

          // Handle specific OAuth error types
          let userFriendlyMessage = 'Sign-in failed. Please try again.';
          
          switch (oauthError) {
            case 'access_denied':
              userFriendlyMessage = 'Sign-in was cancelled. You can try again if you\'d like.';
              break;
            case 'invalid_request':
              userFriendlyMessage = 'Invalid sign-in request. Please contact support if this continues.';
              break;
            case 'server_error':
              userFriendlyMessage = 'Server error during sign-in. Please try again in a moment.';
              break;
            case 'temporarily_unavailable':
              userFriendlyMessage = 'Sign-in service is temporarily unavailable. Please try again later.';
              break;
            default:
              if (errorDescription) {
                userFriendlyMessage = `Sign-in error: ${errorDescription}`;
              }
          }

          setProcessingState({
            status: 'error',
            message: userFriendlyMessage,
            error: oauthError,
            timeoutId: null
          });

          // Complete OAuth flow as failed
          if (flowId) {
            completeOAuthFlow(flowId, false, {
              error: oauthError,
              errorDescription,
              userMessage: userFriendlyMessage
            });
          }

          // Redirect to login with error after showing message
          setTimeout(() => {
            // Clean up URL before redirecting
            oauthErrorRecovery.cleanupOAuthUrl();
            navigate(`/?error=${encodeURIComponent(oauthError)}`, { replace: true });
          }, 3000);
          return;
        }

        // Update user feedback
        setProcessingState(prev => ({
          ...prev,
          message: 'Verifying your authentication...'
        }));

        // Use Supabase's built-in session handling with retry logic
        let session = null;
        let sessionError = null;
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries && !session && !sessionError) {
          if (isDevelopment() && retryCount > 0) {
            console.log(`🔄 AuthCallback: Retry attempt ${retryCount}/${maxRetries}`);
          }

          const { data, error } = await supabase.auth.getSession();
          session = data.session;
          sessionError = error;

          if (!session && !sessionError && retryCount < maxRetries - 1) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          }
          
          retryCount++;
        }

        if (sessionError) {
          clearTimeout(timeoutId);
          
          // Log session error
          if (flowId) {
            logOAuthError(flowId, sessionError, {
              stage: OAUTH_STAGES.SESSION_ESTABLISHMENT,
              retryCount,
              url: window.location.href
            });
          }
          
          if (isDevelopment()) {
            console.error('🚨 AuthCallback: Session error:', sessionError);
          }

          let userFriendlyMessage = 'Failed to establish your session. Please try signing in again.';
          
          if (sessionError.message?.includes('network') || sessionError.message?.includes('fetch')) {
            userFriendlyMessage = 'Network error during sign-in. Please check your connection and try again.';
          } else if (sessionError.message?.includes('invalid') || sessionError.message?.includes('expired')) {
            userFriendlyMessage = 'Your sign-in session has expired. Please try signing in again.';
          }

          setProcessingState({
            status: 'error',
            message: userFriendlyMessage,
            error: sessionError.message,
            timeoutId: null
          });

          // Complete OAuth flow as failed
          if (flowId) {
            completeOAuthFlow(flowId, false, {
              error: sessionError.message,
              errorType: 'session_error',
              userMessage: userFriendlyMessage,
              retryCount
            });
          }

          setTimeout(() => {
            // Clean up URL before redirecting
            oauthErrorRecovery.cleanupOAuthUrl();
            navigate('/?error=session_error', { replace: true });
          }, 3000);
          return;
        }

        if (!session) {
          clearTimeout(timeoutId);
          
          // Log no session error
          if (flowId) {
            const noSessionError = new Error('No session established after OAuth callback');
            logOAuthError(flowId, noSessionError, {
              stage: OAUTH_STAGES.SESSION_ESTABLISHMENT,
              retryCount,
              url: window.location.href
            });
          }
          
          if (isDevelopment()) {
            console.warn('⚠️ AuthCallback: No session found after OAuth callback');
          }

          setProcessingState({
            status: 'error',
            message: 'No active session found. Please try signing in again.',
            error: 'No session established',
            timeoutId: null
          });

          // Complete OAuth flow as failed
          if (flowId) {
            completeOAuthFlow(flowId, false, {
              error: 'No session established',
              errorType: 'no_session',
              userMessage: 'No active session found. Please try signing in again.',
              retryCount
            });
          }

          setTimeout(() => {
            // Clean up URL before redirecting
            oauthErrorRecovery.cleanupOAuthUrl();
            navigate('/?error=no_session', { replace: true });
          }, 3000);
          return;
        }

        // Success! Session established
        clearTimeout(timeoutId);
        
        // Log successful session establishment
        if (flowId) {
          logOAuthEvent(flowId, 'session_established', {
            stage: OAUTH_STAGES.SESSION_ESTABLISHMENT,
            userId: session.user.id,
            retryCount,
            url: window.location.href
          });
          
          // Log performance metrics
          logOAuthPerformance(flowId, 'callback_processing_duration', Date.now() - callbackStartTime, {
            stage: OAUTH_STAGES.CALLBACK,
            retryCount,
            success: true
          });
        }
        
        if (isDevelopment()) {
          console.log('✅ AuthCallback: Session established successfully:', session.user.id);
        }

        setProcessingState({
          status: 'success',
          message: 'Sign-in successful! Redirecting to your dashboard...',
          error: null,
          timeoutId: null
        });

        // Clean up URL using the centralized OAuth cleanup utility
        oauthErrorRecovery.cleanupOAuthUrl();

        // Set developer mode and redirect to game
        localStorage.setItem('developerMode', 'true');
        
        // Complete OAuth flow as successful
        if (flowId) {
          completeOAuthFlow(flowId, true, {
            userId: session.user.id,
            provider: session.user.app_metadata?.provider,
            retryCount,
            callbackDuration: Date.now() - callbackStartTime
          });
          
          // Clean up session storage
          sessionStorage.removeItem('oauthFlowId');
        }
        
        // Redirect after a brief success message
        setTimeout(() => {
          const appUrl = isDevelopment() 
            ? `${window.location.origin}/#/game`
            : `${window.location.origin}/emmys-learning-app/#/game`;
          window.location.href = appUrl;
        }, 1500);

      } catch (error) {
        clearTimeout(timeoutId);
        
        // Log unexpected error
        if (flowId) {
          logOAuthError(flowId, error, {
            stage: OAUTH_STAGES.CALLBACK,
            type: 'unexpected_error',
            url: window.location.href,
            callbackDuration: Date.now() - callbackStartTime
          });
        }
        
        if (isDevelopment()) {
          console.error('🚨 AuthCallback: Unexpected error:', error);
        }

        let userFriendlyMessage = 'An unexpected error occurred during sign-in. Please try again.';
        
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          userFriendlyMessage = 'Network error during sign-in. Please check your connection and try again.';
        } else if (error.message?.includes('timeout')) {
          userFriendlyMessage = 'Sign-in timed out. Please try again.';
        }

        setProcessingState({
          status: 'error',
          message: userFriendlyMessage,
          error: error.message,
          timeoutId: null
        });

        // Complete OAuth flow as failed
        if (flowId) {
          completeOAuthFlow(flowId, false, {
            error: error.message,
            errorType: 'unexpected_error',
            userMessage: userFriendlyMessage,
            callbackDuration: Date.now() - callbackStartTime
          });
        }

        setTimeout(() => {
          // Clean up URL before redirecting
          oauthErrorRecovery.cleanupOAuthUrl();
          navigate('/?error=unexpected', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();

    // Cleanup timeout on unmount
    return () => {
      if (processingState.timeoutId) {
        clearTimeout(processingState.timeoutId);
      }
    };
  }, [navigate]);

  // Render different UI based on processing state
  const renderContent = () => {
    switch (processingState.status) {
      case 'processing':
        return (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-xl mb-2">{processingState.message}</div>
            <div className="text-sm opacity-75">Please wait while we process your authentication</div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center text-white">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-xl mb-2">{processingState.message}</div>
            <div className="text-sm opacity-75">Taking you to your dashboard...</div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center text-white">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-xl mb-2">{processingState.message}</div>
            <div className="text-sm opacity-75">Redirecting you back to the login page...</div>
            {isDevelopment() && processingState.error && (
              <div className="mt-4 p-3 bg-red-900 bg-opacity-50 rounded-lg text-xs">
                <div className="font-semibold mb-1">Debug Info:</div>
                <div className="text-left">{processingState.error}</div>
              </div>
            )}
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center text-white">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xl mb-2">{processingState.message}</div>
            <div className="text-sm opacity-75 mb-4">This might be due to a slow connection.</div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/?fallback=timeout', { replace: true })}
                className="px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-colors duration-200 text-sm"
              >
                Use Different Sign-in Method
              </button>
              <div className="text-xs opacity-60">or wait a moment and the page will redirect automatically</div>
            </div>
            {isDevelopment() && processingState.error && (
              <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 rounded-lg text-xs">
                <div className="font-semibold mb-1">Debug Info:</div>
                <div className="text-left">{processingState.error}</div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-xl">Processing...</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthCallback;
