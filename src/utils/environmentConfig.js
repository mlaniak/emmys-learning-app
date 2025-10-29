/**
 * Environment Configuration Utility
 * 
 * Provides environment detection and dynamic configuration for OAuth and other
 * environment-specific settings in Emmy's Learning App.
 */

/**
 * Detects if the application is running in development mode
 * @returns {boolean} True if in development, false if in production
 */
export const isDevelopment = () => {
  // Check for Vite development mode (safely handle import.meta.env)
  try {
    if (import.meta.env && import.meta.env.DEV) {
      return true;
    }
  } catch (error) {
    // import.meta.env not available (e.g., in Node.js testing)
  }
  
  // Check for localhost or development URLs
  const hostname = window.location.hostname;
  const isDev = hostname === 'localhost' || 
                hostname === '127.0.0.1' || 
                hostname.startsWith('192.168.') ||
                hostname.endsWith('.local');
  
  return isDev;
};

/**
 * Detects if the application is running in production mode
 * @returns {boolean} True if in production, false if in development
 */
export const isProduction = () => {
  return !isDevelopment();
};

/**
 * Gets the current environment name
 * @returns {string} 'development' or 'production'
 */
export const getEnvironment = () => {
  return isDevelopment() ? 'development' : 'production';
};

/**
 * Gets the base URL for the current environment
 * @returns {string} The base URL including protocol and domain
 */
export const getBaseUrl = () => {
  if (isDevelopment()) {
    // For local development, use the current origin
    return window.location.origin;
  } else {
    // For production (GitHub Pages), use the configured homepage
    return 'https://mlaniak.github.io';
  }
};

/**
 * Gets the full application URL including the base path
 * @returns {string} The complete application URL
 */
export const getAppUrl = () => {
  const baseUrl = getBaseUrl();
  
  if (isDevelopment()) {
    // Local development doesn't need the /emmys-learning-app path
    return baseUrl;
  } else {
    // Production uses the GitHub Pages path
    return `${baseUrl}/emmys-learning-app`;
  }
};

/**
 * Gets OAuth configuration for the current environment
 * @returns {object} OAuth configuration object
 */
export const getOAuthConfig = () => {
  const appUrl = getAppUrl();
  
  return {
    // Dynamic redirect URL based on environment
    redirectTo: `${appUrl}/auth/callback`,
    
    // OAuth query parameters
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
    
    // Additional OAuth options
    options: {
      // Skip confirmation for development
      skipBrowserRedirect: false,
      
      // Provider-specific settings
      scopes: 'email profile',
    }
  };
};

/**
 * Gets environment-specific configuration
 * @returns {object} Configuration object for the current environment
 */
export const getEnvironmentConfig = () => {
  const env = getEnvironment();
  const baseUrl = getBaseUrl();
  const appUrl = getAppUrl();
  
  return {
    environment: env,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    baseUrl,
    appUrl,
    
    // OAuth configuration
    oauth: getOAuthConfig(),
    
    // API endpoints (if needed in the future)
    api: {
      baseUrl: appUrl,
    },
    
    // Feature flags based on environment
    features: {
      // Enable debug logging in development
      debugLogging: isDevelopment(),
      
      // Enable developer mode access
      developerMode: isDevelopment(),
      
      // Enable service worker in production
      serviceWorker: isProduction(),
    },
    
    // Environment-specific settings
    settings: {
      // Shorter timeouts in development for faster testing
      authTimeout: isDevelopment() ? 5000 : 10000,
      
      // More verbose error messages in development
      verboseErrors: isDevelopment(),
      
      // Auto-refresh intervals
      sessionRefreshInterval: isDevelopment() ? 30000 : 60000, // 30s dev, 60s prod
      
      // Error recovery settings
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
      fallbackTimeout: 30000, // 30 seconds before showing fallback options
    }
  };
};

/**
 * Logs environment information to console (development only)
 */
export const logEnvironmentInfo = () => {
  if (!isDevelopment()) return;
  
  const config = getEnvironmentConfig();
  console.group('🌍 Environment Configuration');
  console.log('Environment:', config.environment);
  console.log('Base URL:', config.baseUrl);
  console.log('App URL:', config.appUrl);
  console.log('OAuth Redirect:', config.oauth.redirectTo);
  console.log('Features:', config.features);
  console.groupEnd();
};

// Export default configuration
export default getEnvironmentConfig();