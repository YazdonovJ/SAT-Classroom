-- Create Test Attempts Tables
-- Revised to match frontend expectations (JSONB storage for answers) and ensure all columns exist

-- 1. TEST ATTEMPTS
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id uuid default uuid_generate_v4() primary key,
    test_id uuid references public.tests(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    cohort_id uuid references public.cohorts(id),
    score int default 0,
    points_earned int default 0,
    total_points int default 0,
    answers jsonb, 
    time_spent_seconds int default 0,
    attempt_number int default 1,
    started_at timestamptz default now(),
    submitted_at timestamptz,
    status text default 'completed',
    created_at timestamptz default now()
);

-- IMPORTANT: Explicitly add columns if they are missing (for existing tables)
DO $$
BEGIN
    -- answers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'answers') THEN
        ALTER TABLE public.test_attempts ADD COLUMN answers jsonb;
    END IF;

    -- attempt_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'attempt_number') THEN
        ALTER TABLE public.test_attempts ADD COLUMN attempt_number int default 1;
    END IF;

    -- time_spent_seconds
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent_seconds') THEN
        ALTER TABLE public.test_attempts ADD COLUMN time_spent_seconds int default 0;
    END IF;

    -- points_earned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'points_earned') THEN
        ALTER TABLE public.test_attempts ADD COLUMN points_earned int default 0;
    END IF;

    -- total_points
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'total_points') THEN
        ALTER TABLE public.test_attempts ADD COLUMN total_points int default 0;
    END IF;

    -- cohort_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.test_attempts ADD COLUMN cohort_id uuid references public.cohorts(id);
    END IF;

    -- submitted_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'submitted_at') THEN
        ALTER TABLE public.test_attempts ADD COLUMN submitted_at timestamptz;
    END IF;

END $$;


ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS for Attempts
DROP POLICY IF EXISTS "Users can view own attempts" ON test_attempts;
CREATE POLICY "Users can view own attempts"
ON test_attempts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attempts" ON test_attempts;
CREATE POLICY "Users can insert own attempts"
ON test_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attempts" ON test_attempts;
CREATE POLICY "Users can update own attempts"
ON test_attempts FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can view all attempts" ON test_attempts;
CREATE POLICY "Teachers can view all attempts"
ON test_attempts FOR SELECT
USING (
  EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid() 
      AND (role = 'teacher' OR role = 'admin' OR role = 'owner')
  )
  OR
  EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'teacher' OR role = 'admin')
  )
);
