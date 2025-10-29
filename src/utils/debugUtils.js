/**
 * Debug Utilities
 * 
 * Provides development-mode debugging utilities including OAuth debug dashboard access
 */

import { isDevelopment } from './environmentConfig';

/**
 * Setup global debug utilities in development mode
 */
export const setupDebugUtils = () => {
  if (!isDevelopment()) return;

  // Add global debug functions to window for easy access in dev tools
  window.emmyDebug = {
    // OAuth debugging
    showOAuthDashboard: () => {
      const event = new CustomEvent('showOAuthDashboard');
      window.dispatchEvent(event);
    },
    
    // Clear OAuth logs
    clearOAuthLogs: () => {
      const { oauthLogger } = require('./oauthLogger');
      oauthLogger.clearOAuthLogs();
      console.log('OAuth logs cleared');
    },
    
    // Export OAuth logs
    exportOAuthLogs: () => {
      const { oauthLogger } = require('./oauthLogger');
      oauthLogger.exportOAuthLogs();
    },
    
    // Get OAuth statistics
    getOAuthStats: () => {
      const { oauthLogger } = require('./oauthLogger');
      return {
        flows: oauthLogger.getAllOAuthFlows(),
        errors: oauthLogger.getOAuthErrorStats(),
        performance: oauthLogger.getOAuthPerformanceStats()
      };
    },
    
    // Generate debug report
    generateDebugReport: (flowId = null) => {
      const { oauthLogger } = require('./oauthLogger');
      return oauthLogger.generateDebugReport(flowId);
    }
  };

  console.log('🔧 Emmy Debug Utils loaded. Use window.emmyDebug for debugging tools.');
  console.log('Available commands:');
  console.log('- emmyDebug.showOAuthDashboard() - Show OAuth debug dashboard');
  console.log('- emmyDebug.clearOAuthLogs() - Clear all OAuth logs');
  console.log('- emmyDebug.exportOAuthLogs() - Export OAuth logs to file');
  console.log('- emmyDebug.getOAuthStats() - Get OAuth statistics');
  console.log('- emmyDebug.generateDebugReport() - Generate debug report');
};

/**
 * Add keyboard shortcut for OAuth dashboard (Ctrl+Shift+O)
 */
export const setupDebugKeyboardShortcuts = () => {
  if (!isDevelopment()) return;

  document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+O to open OAuth dashboard
    if (event.ctrlKey && event.shiftKey && event.key === 'O') {
      event.preventDefault();
      const dashboardEvent = new CustomEvent('showOAuthDashboard');
      window.dispatchEvent(dashboardEvent);
    }
  });

  console.log('🎹 Debug keyboard shortcuts enabled:');
  console.log('- Ctrl+Shift+O: Open OAuth Debug Dashboard');
};

/**
 * Log environment and debug information
 */
export const logDebugInfo = () => {
  if (!isDevelopment()) return;

  console.group('🔍 Emmy Debug Information');
  console.log('Environment:', 'Development');
  console.log('URL:', window.location.href);
  console.log('User Agent:', navigator.userAgent);
  console.log('Local Storage Keys:', Object.keys(localStorage));
  console.log('Session Storage Keys:', Object.keys(sessionStorage));
  console.groupEnd();
};

export default {
  setupDebugUtils,
  setupDebugKeyboardShortcuts,
  logDebugInfo
};