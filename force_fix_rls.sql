-- Force enable RLS on cohort_codes just in case
ALTER TABLE cohort_codes ENABLE ROW LEVEL SECURITY;

-- Grant access to everyone (for debugging)
DROP POLICY IF EXISTS "Anyone can read codes" ON cohort_codes;
CREATE POLICY "Anyone can read codes" ON cohort_codes FOR SELECT USING (true);
