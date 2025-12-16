-- Create Admin Account
-- Run this in Supabase SQL Editor

-- Step 1: Create the admin user in auth.users
-- IMPORTANT: You need to do this via Supabase Dashboard or using this SQL with service role

-- Option A: Via Supabase Dashboard (RECOMMENDED)
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: admin@gmail.com
-- 4. Password: ADMIN1600
-- 5. Confirm password: ADMIN1600
-- 6. Click "Create User"

-- Option B: Via SQL with service role key (if you have it)
-- This requires service_role key, run in a backend script:
/*
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@gmail.com',
  password: 'ADMIN1600',
  email_confirm: true,
  user_metadata: {
    full_name: 'System Administrator'
  }
})
*/

-- Step 2: After creating auth user, set role to admin in public.users
-- Find the user ID first
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@gmail.com';

-- Then update the role (replace YOUR_USER_ID with the actual ID from above)
UPDATE public.users
SET role = 'admin',
    full_name = 'System Administrator'
WHERE email = 'admin@gmail.com';

-- Step 3: Verify admin account
SELECT id, email, full_name, role, created_at
FROM public.users
WHERE role = 'admin';

-- You should see:
-- admin@gmail.com | System Administrator | admin | (timestamp)

-- MANUAL STEPS IF SQL DOESN'T WORK:
-- 1. Go to Supabase Dashboard
-- 2. Authentication > Users
-- 3. Click "Add User" (top right)
-- 4. Enter:
--    Email: admin@gmail.com
--    Password: ADMIN1600
--    Auto Confirm User: YES
-- 5. Click "Create User"
-- 6. Then run this SQL to set role:
--    UPDATE public.users SET role = 'admin', full_name = 'System Administrator' 
--    WHERE email = 'admin@gmail.com';
