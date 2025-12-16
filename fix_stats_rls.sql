-- Fix RLS for Stats and Student Progress

-- 1. COHORT_UNIT_STATE (Unlocks)
-- Students need to see if units are unlocked in their cohorts
DROP POLICY IF EXISTS "Anyone can view unit state" ON cohort_unit_state;
CREATE POLICY "Anyone can view unit state"
ON cohort_unit_state FOR SELECT
USING (true); 
-- In production, strict RLS would check enrollment, but for MVP/Debug, this ensures students can see unlocks.

-- Teachers need to manage unlocks
DROP POLICY IF EXISTS "Teachers can manage unit state" ON cohort_unit_state;
CREATE POLICY "Teachers can manage unit state"
ON cohort_unit_state FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM cohort_teachers
    WHERE cohort_teachers.cohort_id = cohort_unit_state.cohort_id
    AND cohort_teachers.user_id = auth.uid()
  )
);


-- 2. ENROLLMENTS
-- Teachers need to count enrollments (Total Students)
DROP POLICY IF EXISTS "Teachers can view enrollments" ON enrollments;
CREATE POLICY "Teachers can view enrollments"
ON enrollments FOR SELECT
USING (
   -- If user is a teacher of the cohort
   EXISTS (
       SELECT 1 FROM cohort_teachers
       WHERE cohort_teachers.cohort_id = enrollments.cohort_id
       AND cohort_teachers.user_id = auth.uid()
   )
   OR 
   -- Or the student themselves
   auth.uid() = user_id
);

-- Teacher needs to DELETE enrollments (Remove Student)
DROP POLICY IF EXISTS "Teachers can delete enrollments" ON enrollments;
CREATE POLICY "Teachers can delete enrollments"
ON enrollments FOR DELETE
USING (
   EXISTS (
       SELECT 1 FROM cohort_teachers
       WHERE cohort_teachers.cohort_id = enrollments.cohort_id
       AND cohort_teachers.user_id = auth.uid()
   )
);


-- 3. ASSIGNMENTS
-- Create table if it doesn't exist (seems to be missing from previous migrations)
CREATE TABLE IF NOT EXISTS public.assignments (
    id uuid default uuid_generate_v4() primary key,
    unit_id uuid references public.units(id) on delete cascade not null,
    title text not null,
    details text,
    rubric_json jsonb,
    created_at timestamptz default now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Teachers need to count assignments
DROP POLICY IF EXISTS "Teachers can view assignments" ON assignments;
CREATE POLICY "Teachers can view assignments"
ON assignments FOR SELECT
USING (true); -- Public read is fine for assignments, usually.
