-- Allow authenticated users (students) to look up cohort codes
-- This is necessary for the "Join Class" flow where a student finds a class by its code.

-- 1. Policies for cohort_codes
-- Drop existing restrictive policies if necessary, or just add a permissive one.
DROP POLICY IF EXISTS "Authenticated users can select cohort_codes" ON cohort_codes;

CREATE POLICY "Authenticated users can select cohort_codes" 
ON cohort_codes FOR SELECT 
TO authenticated 
USING (true);

-- 2. Policies for cohorts
-- Students need to see cohort details (name, course title) confirms the class before joining.
-- We allow authenticated users to view basic cohort info.
DROP POLICY IF EXISTS "Authenticated users can view cohorts" ON cohorts;

CREATE POLICY "Authenticated users can view cohorts" 
ON cohorts FOR SELECT 
TO authenticated 
USING (true);

-- 3. Policies for courses
-- Ensure courses are also viewable (since we join on courses(title))
DROP POLICY IF EXISTS "Authenticated users can view courses" ON courses;

CREATE POLICY "Authenticated users can view courses" 
ON courses FOR SELECT 
TO authenticated 
USING (true);
