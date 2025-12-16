-- Grant Admins Full Access to All Content Tables

-- 1. Units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all units" ON public.units;
CREATE POLICY "Admins can manage all units"
ON public.units
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
CREATE POLICY "Admins can manage all courses"
ON public.courses
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Admins can manage all lessons"
ON public.lessons
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all tests" ON public.tests;
CREATE POLICY "Admins can manage all tests"
ON public.tests
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
CREATE POLICY "Admins can manage all questions"
ON public.questions
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all materials" ON public.materials;
CREATE POLICY "Admins can manage all materials"
ON public.materials
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Question Options (if separate table) or other related tables
-- Assuming options are JSONB in questions table. 

-- 8. Test Attempts (Admins might want to see all attempts)
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.test_attempts;
CREATE POLICY "Admins can view all attempts"
ON public.test_attempts
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
