import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Note: In production, these should be environment variables
const supabaseUrl = 'https://ygqlejrhuukkrvgrsrjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncWxlanJodXVra3J2Z3Jzcmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzk1NjMsImV4cCI6MjA3NzI1NTU2M30.oOgBv9QH12jolkmCtqnTe9qAIDrvHcHf5Fy4Bu1eaJ0';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false  // Disable automatic URL detection
  }
});

export default supabase;
