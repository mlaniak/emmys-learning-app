# OAuth Setup Guide for Supabase

## Google OAuth Setup

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 2. Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console

## Apple OAuth Setup

### 1. Apple Developer Setup
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create a new App ID (if you don't have one)
3. Create a Service ID for Sign in with Apple
4. Configure the Service ID:
   - Add your domain and redirect URL
   - Enable "Sign in with Apple"

### 2. Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable Apple provider
4. Add your Apple credentials:
   - Client ID: Your Service ID
   - Client Secret: Generated JWT token

## Testing OAuth

### Development Testing
1. Start your app: `npm run dev`
2. Click "Continue with Google" or "Continue with Apple"
3. Complete the OAuth flow
4. Verify user is created in Supabase → Authentication → Users

### Production Deployment
1. Update redirect URLs in OAuth providers
2. Set production domain in Supabase settings
3. Test OAuth flow in production environment

## Troubleshooting

### Common Issues
- **"Invalid redirect URI"**: Check redirect URLs in OAuth provider settings
- **"Client ID not found"**: Verify credentials are correctly entered in Supabase
- **"Domain not verified"**: Ensure domain is verified in OAuth provider console

### Debug Steps
1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Test with different browsers/devices
4. Check OAuth provider logs

## Security Notes
- Never expose OAuth secrets in client-side code
- Use environment variables for production
- Regularly rotate OAuth credentials
- Monitor OAuth usage and set up alerts
