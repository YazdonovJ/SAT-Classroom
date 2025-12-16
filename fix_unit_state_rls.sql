-- Allow teachers to manage unit states in their cohorts
create policy "Teachers manage unit states"
on public.cohort_unit_state
for all
using (
  exists (
    select 1 from public.cohort_teachers
    where cohort_id = cohort_unit_state.cohort_id
    and user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cohort_teachers
    where cohort_id = cohort_unit_state.cohort_id
    and user_id = auth.uid()
  )
);

-- Allow students to view unit states for their enrolled cohorts
create policy "Students view unit states"
on public.cohort_unit_state
for select
using (
  exists (
    select 1 from public.enrollments
    where cohort_id = cohort_unit_state.cohort_id
    and user_id = auth.uid()
  )
);
