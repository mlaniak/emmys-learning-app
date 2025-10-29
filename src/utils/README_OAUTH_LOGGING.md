# OAuth Error Logging and Monitoring System

This document describes the comprehensive OAuth error logging and monitoring system implemented for Emmy's Learning App.

## Overview

The OAuth logging system provides detailed tracking, error monitoring, and performance analysis for OAuth authentication flows. It includes:

- **Comprehensive Flow Tracking**: Every OAuth flow is tracked from initiation to completion
- **Detailed Error Logging**: All errors are categorized, logged, and analyzed
- **Performance Monitoring**: Timing metrics for all OAuth operations
- **Debug Dashboard**: Visual interface for reviewing OAuth logs and statistics
- **Development-Friendly**: Enhanced debugging information in development mode

## Components

### 1. OAuth Logger (`src/utils/oauthLogger.js`)

The core logging system that tracks OAuth flows:

```javascript
import { startOAuthFlow, logOAuthEvent, logOAuthError, completeOAuthFlow } from './utils/oauthLogger';

// Start tracking an OAuth flow
const flowId = startOAuthFlow('google', { redirectUrl: 'https://...' });

// Log events during the flow
logOAuthEvent(flowId, 'configuration_loaded', { stage: 'initiation' });

// Log errors with context
logOAuthError(flowId, error, { stage: 'callback', provider: 'google' });

// Complete the flow
completeOAuthFlow(flowId, true, { userId: 'user123' });
```

### 2. OAuth Debug Dashboard (`src/components/OAuthDebugDashboard.jsx`)

A comprehensive dashboard for viewing OAuth logs and statistics (development mode only):

- **Overview Tab**: Summary statistics and key metrics
- **Flows Tab**: Detailed view of individual OAuth flows
- **Errors Tab**: Error analysis and categorization
- **Performance Tab**: Timing metrics and performance analysis
- **Debug Tab**: Tools for exporting and managing logs

### 3. Debug Utilities (`src/utils/debugUtils.js`)

Development utilities for easy access to OAuth debugging:

```javascript
// Available in browser console (development mode only)
window.emmyDebug.showOAuthDashboard();  // Open debug dashboard
window.emmyDebug.getOAuthStats();       // Get statistics
window.emmyDebug.exportOAuthLogs();     // Export logs
window.emmyDebug.clearOAuthLogs();      // Clear all logs
```

## Integration Points

### UserContext Integration

The OAuth methods in `UserContext.jsx` are enhanced with comprehensive logging:

- Flow initiation tracking
- Configuration logging
- Error categorization and logging
- Performance metrics collection
- Recovery attempt tracking

### AuthCallback Integration

The `AuthCallback.jsx` component includes:

- Callback processing tracking
- Session establishment monitoring
- Error handling with detailed logging
- Performance timing for callback operations

### Error Recovery Integration

The `oauthErrorRecovery.js` utility is enhanced with:

- Recovery strategy logging
- Error analysis tracking
- Retry attempt monitoring

## Usage in Development

### Accessing the Debug Dashboard

1. **Keyboard Shortcut**: Press `Ctrl+Shift+O` to open the OAuth debug dashboard
2. **Console Command**: Run `emmyDebug.showOAuthDashboard()` in browser console
3. **Event Trigger**: The dashboard automatically appears for OAuth debugging

### Console Debugging

In development mode, detailed OAuth information is logged to the console:

```
🔐 OAuth Flow Started: google
🔍 OAuth Event [google]: configuration_loaded
⚡ OAuth Performance [google]: initiation_duration 150ms
✅ OAuth Flow Completed: google
```

### Debug Commands

Available console commands in development mode:

```javascript
// View OAuth statistics
emmyDebug.getOAuthStats()

// Generate debug report
emmyDebug.generateDebugReport()

// Export logs to file
emmyDebug.exportOAuthLogs()

// Clear all logs
emmyDebug.clearOAuthLogs()
```

## Error Categories

The system categorizes OAuth errors into specific types:

- **REDIRECT_MISMATCH**: URL redirect configuration issues
- **PROVIDER_ERROR**: OAuth provider-specific errors
- **SESSION_ESTABLISHMENT**: Session creation failures
- **TOKEN_EXCHANGE**: Token exchange problems
- **CALLBACK_PROCESSING**: Callback handling issues
- **CONFIGURATION_ERROR**: OAuth configuration problems
- **NETWORK_ERROR**: Network connectivity issues
- **TIMEOUT_ERROR**: Operation timeout errors
- **USER_CANCELLED**: User-initiated cancellations
- **POPUP_BLOCKED**: Popup blocking issues

## Performance Metrics

The system tracks various performance metrics:

- **Initiation Duration**: Time to start OAuth flow
- **Callback Processing Duration**: Time to process OAuth callback
- **Total Flow Duration**: Complete OAuth flow time
- **Retry Counts**: Number of retry attempts
- **Success Rates**: Percentage of successful flows

## Data Storage

OAuth logs are stored in localStorage with the following structure:

```javascript
{
  sessionLogs: Map<flowId, flowData>,
  performanceMetrics: Array<performanceEntry>,
  errorCounts: Map<errorType, count>,
  lastUpdated: timestamp
}
```

## Production Considerations

- **Development Only**: Debug dashboard and detailed logging are only active in development mode
- **Performance Impact**: Minimal performance impact in production (logging disabled)
- **Privacy**: All data is stored locally, no external transmission
- **Storage Management**: Automatic cleanup of old logs to prevent storage bloat

## Troubleshooting OAuth Issues

### Common Issues and Solutions

1. **Redirect URL Mismatch**
   - Check OAuth configuration in Supabase dashboard
   - Verify environment-specific redirect URLs
   - Review logs for actual vs expected URLs

2. **Session Establishment Failures**
   - Check network connectivity
   - Verify Supabase configuration
   - Review callback processing logs

3. **Provider-Specific Errors**
   - Check OAuth provider console (Google, Apple)
   - Verify client ID and secret configuration
   - Review provider-specific error codes

### Using the Debug Dashboard

1. Open the dashboard using `Ctrl+Shift+O`
2. Check the **Overview** tab for general statistics
3. Review **Flows** tab for specific flow details
4. Analyze **Errors** tab for error patterns
5. Check **Performance** tab for timing issues
6. Use **Debug** tab to export logs for analysis

## Best Practices

1. **Regular Monitoring**: Check OAuth logs regularly during development
2. **Error Analysis**: Use error categorization to identify patterns
3. **Performance Optimization**: Monitor timing metrics for slow operations
4. **Log Management**: Export and clear logs periodically
5. **Testing**: Test OAuth flows across different environments and browsers

## Future Enhancements

Potential improvements to the OAuth logging system:

- Real-time error alerting
- Advanced analytics and reporting
- Integration with external monitoring services
- Automated error recovery suggestions
- Cross-browser compatibility analysis