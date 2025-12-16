-- Fix Infinite Recursion with SECURITY DEFINER function

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER means this runs with the privileges of the creator (superuser)
-- and bypasses RLS for the query inside it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the policy to use the safe function
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;

CREATE POLICY "Admins can manage all profiles"
ON public.users
FOR ALL
USING ( is_admin() )
WITH CHECK ( is_admin() );

-- 3. Also fix the student/teacher policy if it exists to avoid similar issues
-- (Optional cleanup, ensuring basic self-access still works)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING ( auth.uid() = id );
