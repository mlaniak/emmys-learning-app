import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Note: In production, these should be environment variables
const supabaseUrl = 'https://ygqlejrhuukkrvgrsrjw.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false  // Disable automatic URL detection
  }
});

export default supabase;
