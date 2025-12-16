-- Enable RLS on cohort_codes (just to be safe/sure)
ALTER TABLE cohort_codes ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Teachers to INSERT/UPDATE/SELECT their own class codes
DROP POLICY IF EXISTS "Teachers can manage their cohort codes" ON cohort_codes;

CREATE POLICY "Teachers can manage their cohort codes"
ON cohort_codes
FOR ALL
USING (
  -- Check if auth user is a teacher for this cohort
  EXISTS (
    SELECT 1 FROM cohort_teachers
    WHERE cohort_teachers.cohort_id = cohort_codes.cohort_id
    AND cohort_teachers.user_id = auth.uid()
  )
  OR
  -- Check if auth user is an Global Admin (optional, but good practice)
  EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'owner')
  )
);
