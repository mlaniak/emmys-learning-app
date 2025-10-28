# Emmy's Learning App - Supabase User Account System

## Overview
This guide will help you set up the Supabase user account system for Emmy's Learning App, enabling kids to save their progress across devices and parents to track their children's learning.

## Features Implemented
✅ **User Authentication** - Supabase Auth integration  
✅ **Kid-Friendly UI** - Colorful, engaging login/signup forms  
✅ **Profile Management** - Avatar selection, preferences, themes  
✅ **Progress Tracking** - Cloud sync of scores, streaks, achievements  
✅ **Parent Dashboard** - Track multiple children's progress  
✅ **Offline Support** - Works offline, syncs when online  
✅ **Data Migration** - Migrate existing local data to accounts  
✅ **Device Switching** - Access progress from any device  

## Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project creation (1-2 minutes)
3. Go to Settings → API to get your credentials

### 2. Update Configuration
Open `src/supabase/config.js` and replace with your credentials:

```javascript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';
```

### 3. Set Up Database
Run the SQL schema from `SUPABASE_SETUP.md` in your Supabase SQL Editor.

### 4. Test the System
```bash
npm run dev
```

## Detailed Setup Guide
For complete setup instructions, database schema, and troubleshooting, see:
**[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

## Why Supabase?
- 💰 **Better Pricing** - More generous free tier than Firebase
- 🔒 **Superior Security** - SQL-based Row Level Security policies
- 📊 **SQL Database** - More flexible queries for complex features
- 🔄 **Real-time Features** - Built-in subscriptions
- 🛠️ **Better DX** - Auto-generated APIs and TypeScript support

Happy learning! 🎓✨
