-- Update Admin Email to admin@makon.com
-- Use this if you already created 'admin@gmail.com' and want to switch, 
-- OR if you just created 'admin@makon.com' and need to make it admin.

-- 1. If you haven't created the user yet, go to Supabase Auth > Users and create:
-- Email: admin@makon.com
-- Password: ADMIN1600

-- 2. Run this to set the role:
UPDATE public.users 
SET role = 'admin', 
    full_name = 'System Administrator'
WHERE email = 'admin@makon.com';

-- 3. (Optional) If you want to remove the old admin:
-- DELETE FROM public.users WHERE email = 'admin@gmail.com';

-- 4. Verify:
SELECT email, role FROM public.users WHERE role = 'admin';
