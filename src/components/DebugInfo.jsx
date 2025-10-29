import React from 'react';
import { useUser } from '../contexts/UserContext';

// Debug component to help identify issues
const DebugInfo = () => {
  const { user, userProfile, loading, error } = useUser();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🐛 Debug Info</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Profile: {userProfile ? '✅' : '❌'}</div>
        <div>Error: {error || 'none'}</div>
        <div>URL: {window.location.href}</div>
        <div>Hash: {window.location.hash}</div>
        <div>Supabase Disabled: {localStorage.getItem('supabaseDisabled') || 'false'}</div>
      </div>
    </div>
  );
};

export default DebugInfo;
