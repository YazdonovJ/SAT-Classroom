-- Add cohort_codes table for class enrollment
create table if not exists public.cohort_codes (
  id uuid primary key default uuid_generate_v4(),
  cohort_id uuid references public.cohorts(id) on delete cascade not null unique,
  code text unique not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.cohort_codes enable row level security;

-- Allow anyone to read codes (for validation)
create policy "Anyone can view codes"
on public.cohort_codes
for select
using (true);

-- Only teachers can create/update codes
create policy "Teachers create codes"
on public.cohort_codes
for insert
with check (
  exists (
    select 1 from public.cohort_teachers
    where cohort_id = cohort_codes.cohort_id
    and user_id = auth.uid()
  )
);

-- Generate codes for existing cohorts
do $$
declare
  cohort_record record;
  new_code text;
begin
  for cohort_record in select id from public.cohorts loop
    -- Generate a 6-character code
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Insert if doesn't exist
    insert into public.cohort_codes (cohort_id, code)
    values (cohort_record.id, new_code)
    on conflict (cohort_id) do nothing;
  end loop;
end $$;
