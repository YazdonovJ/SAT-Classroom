-- Create Tests and Questions tables

-- 1. TESTS
CREATE TABLE IF NOT EXISTS public.tests (
    id uuid default uuid_generate_v4() primary key,
    unit_id uuid references public.units(id) on delete cascade not null,
    title text not null,
    description text,
    time_limit_minutes int,
    passing_score int default 70,
    max_attempts int default 1,
    show_correct_answers boolean default true,
    is_published boolean default false,
    created_by uuid references public.users(id),
    created_at timestamptz default now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- RLS for Tests
DROP POLICY IF EXISTS "Anyone can view published tests" ON tests;
CREATE POLICY "Anyone can view published tests"
ON tests FOR SELECT
USING (is_published = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Teachers can manage tests" ON tests;
CREATE POLICY "Teachers can manage tests"
ON tests FOR ALL
USING (
  -- Check Org Members
  EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid() 
      AND (role = 'teacher' OR role = 'admin' OR role = 'owner')
  )
  OR
  -- Check Public Users Role (Fallback if Org Members isn't used)
  EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'teacher' OR role = 'admin')
  )
);

-- 2. QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
    id uuid default uuid_generate_v4() primary key,
    test_id uuid references public.tests(id) on delete cascade not null,
    question_text text not null,
    question_type text default 'multiple_choice',
    options text[], -- Array of strings for options
    correct_answer text,
    explanation text,
    points int default 1,
    order_index int default 0,
    created_at timestamptz default now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS for Questions
DROP POLICY IF EXISTS "Anyone can view questions for visible tests" ON questions;
CREATE POLICY "Anyone can view questions for visible tests"
ON questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = questions.test_id
        AND (tests.is_published = true OR tests.created_by = auth.uid())
    )
);

DROP POLICY IF EXISTS "Teachers can manage questions" ON questions;
CREATE POLICY "Teachers can manage questions"
ON questions FOR ALL
USING (
  -- Check Org Members
  EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid() 
      AND (role = 'teacher' OR role = 'admin' OR role = 'owner')
  )
  OR
  -- Check Public Users Role
  EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'teacher' OR role = 'admin')
  )
);
