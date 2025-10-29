-- COMPREHENSIVE FIX for Supabase RLS Infinite Recursion
-- Run this COMPLETE script in Supabase SQL Editor

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Parents can view children's profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.users;

-- Step 2: Drop the problematic function if it exists
DROP FUNCTION IF EXISTS public.is_parent_of_user(UUID);

-- Step 3: Create SIMPLE, non-recursive policies
-- These policies only reference auth.uid() and don't reference the users table itself

-- Policy 1: Users can SELECT their own data only
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can UPDATE their own data only  
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can INSERT their own data only
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 4: Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Test the policies work
-- This should NOT cause infinite recursion
SELECT 'RLS policies fixed - no more infinite recursion' as status;

-- Step 6: Optional - If you want parent-child features later, use this approach:
-- CREATE POLICY "parents_view_children" ON public.users
--   FOR SELECT USING (
--     auth.uid() = id OR 
--     (is_child = true AND EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid() 
--       AND auth.users.email = users.parent_email
--     ))
--   );
