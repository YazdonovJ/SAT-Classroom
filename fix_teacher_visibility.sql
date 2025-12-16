-- Allow teachers to view enrollments in their cohorts
create policy "Teachers view class enrollments"
on public.enrollments
for select
using (
  exists (
    select 1 from public.cohort_teachers
    where cohort_id = enrollments.cohort_id
    and user_id = auth.uid()
  )
);

-- Allow teachers to view all users (students) in their classes
create policy "Teachers view students in their classes"
on public.users
for select
using (
  exists (
    select 1 
    from public.enrollments e
    join public.cohort_teachers ct on ct.cohort_id = e.cohort_id
    where e.user_id = users.id
    and ct.user_id = auth.uid()
  )
  OR auth.uid() = users.id -- Users can always see themselves
);
