# Emmy's Learning App - Supabase Setup Guide

## Overview
This guide will help you set up Supabase for Emmy's Learning App, providing better pricing, more flexible queries, and easier parent-child relationship management than Firebase.

## Why Supabase?
✅ **Better Pricing** - More generous free tier and predictable monthly pricing  
✅ **SQL Database** - More flexible queries for complex parent dashboards  
✅ **Row Level Security** - Easier to implement parent-child access controls  
✅ **Real-time Features** - Built-in subscriptions for live progress updates  
✅ **Open Source** - Full control and transparency  

## Setup Instructions

### 1. Create Supabase Project

1. **Sign up for Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" and sign up
   - Create a new organization if needed

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - Name: "emmys-learning-app"
     - Database Password: Generate a strong password
     - Region: Choose closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 1-2 minutes
   - You'll see a progress indicator

### 2. Get Project Credentials

1. **Go to Project Settings**
   - Click the gear icon in the left sidebar
   - Select "API" from the settings menu

2. **Copy Credentials**
   - Copy the "Project URL"
   - Copy the "anon public" key
   - Keep these secure - you'll need them for the app

3. **Update Configuration**
   - Open `src/supabase/config.js`
   - Replace the placeholder values:

```javascript
const supabaseUrl = 'https://ygqlejrhuukkrvgrsrjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncWxlanJodXVra3J2Z3Jzcmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzk1NjMsImV4cCI6MjA3NzI1NTU2M30.oOgBv9QH12jolkmCtqnTe9qAIDrvHcHf5Fy4Bu1eaJ0';
```

### 3. Database Schema Setup

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar TEXT DEFAULT 'default',
  preferences JSONB DEFAULT '{
    "difficulty": "medium",
    "sound_enabled": true,
    "music_enabled": true,
    "theme": "light"
  }',
  progress JSONB DEFAULT '{
    "score": 0,
    "learning_streak": 0,
    "completed_lessons": [],
    "achievements": [],
    "last_active": null
  }',
  parent_email TEXT,
  is_child BOOLEAN DEFAULT false
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for parents to view children's profiles
CREATE POLICY "Parents can view children's profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users parent
      WHERE parent.id = auth.uid()
      AND parent.email = users.parent_email
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_users_parent_email ON public.users(parent_email);
CREATE INDEX idx_users_is_child ON public.users(is_child);
CREATE INDEX idx_users_email ON public.users(email);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Row Level Security (RLS) Policies

The SQL above creates these security policies:

- **Users can only access their own data** - Prevents users from seeing other users' profiles
- **Parents can view children's profiles** - Allows parents to see their children's progress
- **Automatic profile creation** - Creates user profile when someone signs up

### 5. Authentication Setup

1. **Configure Authentication**
   - Go to "Authentication" → "Settings" in Supabase dashboard
   - Configure email settings:
     - Site URL: `http://localhost:5173` (for development)
     - Redirect URLs: Add your production domain
   - Enable email confirmations if desired

2. **Email Templates (Optional)**
   - Customize signup, password reset, and confirmation emails
   - Add your branding and messaging

### 6. Environment Variables (Recommended)

For production, use environment variables:

1. **Create `.env` file:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Update `src/supabase/config.js`:**
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 7. Testing the Setup

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Test User Registration:**
   - Open the app in your browser
   - Click "Sign Up"
   - Create a test account
   - Check Supabase Dashboard → Authentication → Users

3. **Test Data Storage:**
   - Complete some activities in the app
   - Check Supabase Dashboard → Table Editor → users
   - Verify user profile is created with progress data

4. **Test Parent-Child Relationship:**
   - Create a parent account
   - Create a child account with parent's email
   - Verify parent can see child in dashboard

## Database Schema Reference

### Users Table Structure

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  display_name TEXT NOT NULL,             -- User's display name
  email TEXT UNIQUE NOT NULL,             -- User's email
  created_at TIMESTAMP WITH TIME ZONE,    -- Account creation time
  avatar TEXT DEFAULT 'default',          -- Selected avatar
  preferences JSONB,                      -- User preferences
  progress JSONB,                         -- Learning progress
  parent_email TEXT,                      -- Parent's email (for children)
  is_child BOOLEAN DEFAULT false          -- Whether user is a child
);
```

### Preferences JSON Structure
```json
{
  "difficulty": "medium",
  "sound_enabled": true,
  "music_enabled": true,
  "theme": "light"
}
```

### Progress JSON Structure
```json
{
  "score": 0,
  "learning_streak": 0,
  "completed_lessons": [],
  "achievements": [],
  "last_active": "2024-01-01T00:00:00Z"
}
```

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use RLS policies** for all data access
3. **Validate data** on both client and server
4. **Monitor usage** and set up billing alerts
5. **Regular backups** of user data

## Troubleshooting

### Common Issues

1. **"Invalid API key" errors**
   - Verify Supabase URL and anon key are correct
   - Check that the project is active

2. **"Row Level Security" errors**
   - Ensure RLS policies are created correctly
   - Check that user is authenticated

3. **"Permission denied" errors**
   - Verify RLS policies allow the operation
   - Check user authentication status

4. **Data not syncing**
   - Check browser console for errors
   - Verify Supabase project is not paused
   - Check network connectivity

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('supabase.debug', 'true');
```

## Migration from Firebase

If migrating from Firebase:

1. **Export Firebase data** using Firebase Admin SDK
2. **Transform data** to match Supabase schema
3. **Import data** using Supabase API
4. **Update client code** to use Supabase instead of Firebase

## Production Deployment

1. **Update Site URL** in Supabase settings
2. **Add production domain** to redirect URLs
3. **Set up custom domain** (optional)
4. **Configure SSL** certificates
5. **Set up monitoring** and alerts

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

Happy learning! 🎓✨
