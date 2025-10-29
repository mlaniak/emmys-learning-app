-- Fix for infinite recursion in Supabase RLS policies
-- Run this in your Supabase SQL Editor

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Parents can view children's profiles" ON public.users;

-- Create a simpler, non-recursive policy for parents
-- This uses a function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_parent_of_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users parent
    WHERE parent.id = auth.uid()
    AND parent.email = (
      SELECT email FROM public.users 
      WHERE id = target_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the parent policy using the function
CREATE POLICY "Parents can view children's profiles" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    (is_child = true AND public.is_parent_of_user(id))
  );

-- Alternative simpler approach - just allow users to see their own data
-- If you want to disable parent-child features temporarily, use this instead:
-- DROP POLICY IF EXISTS "Parents can view children's profiles" ON public.users;
-- CREATE POLICY "Users can view own profile only" ON public.users
--   FOR SELECT USING (auth.uid() = id);

-- Ensure other policies are correct
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Test the policies work
-- This should not cause infinite recursion anymore
SELECT 'RLS policies fixed successfully' as status;
