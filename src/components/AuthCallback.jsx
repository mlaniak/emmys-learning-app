import React, { useEffect } from 'react';
import { supabase } from '../supabase/config';

const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Clear the hash and reload the page
          window.location.hash = '';
          window.location.reload();
          return;
        }

        if (data.session) {
          // User is authenticated, clear the hash and reload
          window.location.hash = '';
          window.location.reload();
        } else {
          // No session, clear the hash and reload
          window.location.hash = '';
          window.location.reload();
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        window.location.hash = '';
        window.location.reload();
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <div className="text-xl">Completing sign-in...</div>
      </div>
    </div>
  );
};

export default AuthCallback;
