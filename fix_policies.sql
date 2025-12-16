
-- Allow Owners/Teachers to create courses, cohorts, etc.
create policy "Enable insert for authenticated users only" on "public"."courses"
as PERMISSIVE for INSERT
to authenticated
with check (true);

create policy "Enable insert for authenticated users only" on "public"."cohorts"
as PERMISSIVE for INSERT
to authenticated
with check (true);

create policy "Enable insert for authenticated users only" on "public"."cohort_teachers"
as PERMISSIVE for INSERT
to authenticated
with check (true);

-- Allow reading all courses/cohorts for now (so we can debug)
create policy "Enable read access for all users" on "public"."courses"
as PERMISSIVE for SELECT
to public
using (true);

create policy "Enable read access for all users" on "public"."cohorts"
as PERMISSIVE for SELECT
to public
using (true);
