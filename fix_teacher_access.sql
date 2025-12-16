-- Allow teachers to view their own cohort assignments
create policy "Teachers can view their cohort assignments" 
on public.cohort_teachers 
for select 
using (auth.uid() = user_id);

-- Allow teachers to read cohort unit states for their cohorts
create policy "Teachers can view unit states for their cohorts"
on public.cohort_unit_state
for select
using (
  cohort_id in (
    select cohort_id from public.cohort_teachers where user_id = auth.uid()
  )
);

-- Allow teachers to update unit states for their cohorts
create policy "Teachers can update unit states for their cohorts"
on public.cohort_unit_state
for all
using (
  cohort_id in (
    select cohort_id from public.cohort_teachers where user_id = auth.uid()
  )
);
