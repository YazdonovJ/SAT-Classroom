-- Allow Admins to UPDATE public.users (to assign roles)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;

CREATE POLICY "Admins can update all profiles"
ON public.users
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
