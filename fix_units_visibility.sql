-- Allow teachers to view units for courses in their cohorts
create policy "Teachers view course units"
on public.units
for select
using (
  exists (
    select 1 
    from public.cohorts c
    join public.cohort_teachers ct on ct.cohort_id = c.id
    where c.course_id = units.course_id
    and ct.user_id = auth.uid()
  )
);

-- Allow students to view units for courses they're enrolled in
create policy "Students view enrolled course units"
on public.units
for select
using (
  exists (
    select 1 
    from public.enrollments e
    join public.cohorts c on c.id = e.cohort_id
    where c.course_id = units.course_id
    and e.user_id = auth.uid()
  )
);

-- Allow teachers to view lessons in units they have access to
create policy "Teachers view lessons"
on public.lessons
for select
using (
  exists (
    select 1 
    from public.units u
    join public.cohorts c on c.course_id = u.course_id
    join public.cohort_teachers ct on ct.cohort_id = c.id
    where u.id = lessons.unit_id
    and ct.user_id = auth.uid()
  )
);

-- Allow students to view lessons in units they have access to
create policy "Students view lessons"
on public.lessons
for select
using (
  exists (
    select 1 
    from public.units u
    join public.cohorts c on c.course_id = u.course_id
    join public.enrollments e on e.cohort_id = c.id
    where u.id = lessons.unit_id
    and e.user_id = auth.uid()
  )
);
