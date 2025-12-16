
-- 1. Enable Extensions
create extension if not exists "uuid-ossp";

-- 2. Create Tables (Idempotent)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;

create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
alter table public.organizations enable row level security;

create type app_role as enum ('owner', 'admin', 'teacher', 'student');
create table if not exists public.org_members (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role app_role not null default 'student',
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);
alter table public.org_members enable row level security;

create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now()
);
alter table public.courses enable row level security;

create table if not exists public.tracks (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);
alter table public.tracks enable row level security;

create table if not exists public.units (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz default now()
);
alter table public.units enable row level security;

create table if not exists public.cohorts (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);
alter table public.cohorts enable row level security;

create table if not exists public.lessons (
  id uuid default uuid_generate_v4() primary key,
  unit_id uuid references public.units(id) on delete cascade not null,
  track_id uuid references public.tracks(id),
  title text not null,
  content text, 
  order_index int not null default 0,
  created_at timestamptz default now()
);
alter table public.lessons enable row level security;

create table if not exists public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  track_id uuid references public.tracks(id),
  starting_unit_id uuid references public.units(id),
  created_at timestamptz default now(),
  unique(cohort_id, user_id)
);
alter table public.enrollments enable row level security;

create table if not exists public.cohort_teachers (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(cohort_id, user_id)
);
alter table public.cohort_teachers enable row level security;

create table if not exists public.cohort_unit_state (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  is_unlocked boolean default false,
  unlocked_at timestamptz,
  created_at timestamptz default now(),
  unique(cohort_id, unit_id)
);
alter table public.cohort_unit_state enable row level security;

-- 3. RLS Policies (Idempotent-ish via DO block checks or simple recreation)
drop policy if exists "Public profiles are viewable by everyone" on public.users;
create policy "Public profiles are viewable by everyone" on public.users for select using (true);

drop policy if exists "Orgs are viewable by everyone" on public.organizations;
create policy "Orgs are viewable by everyone" on public.organizations for select using (true);

drop policy if exists "Members can view their own membership" on public.org_members;
create policy "Members can view their own membership" on public.org_members for select using (auth.uid() = user_id);

-- 4. LOGIC: Sync User & Assign Owner
do $$
declare
  u_id uuid;
  u_email text := 'jamo1iddingrozniy@gmail.com';
  o_id uuid;
begin
  -- Get Auth User ID
  select id into u_id from auth.users where email = u_email;
  
  if u_id is not null then
    -- A. CREATE PUBLIC USER IF MISSING (The Missing Link!)
    insert into public.users (id, email, full_name)
    values (u_id, u_email, 'Owner')
    on conflict (id) do nothing;

    -- B. Ensure Org
    insert into organizations (name, slug) values ('My SAT Prep', 'my-sat-prep')
    on conflict (slug) do update set name = excluded.name
    returning id into o_id;

    -- C. Make Owner
    insert into org_members (org_id, user_id, role)
    values (o_id, u_id, 'owner')
    on conflict (org_id, user_id) do update set role = 'owner';
    
    raise notice 'Success! User synced and assigned as Owner.';
  else
    raise notice 'User not found in Auth. Please Sign Up first.';
  end if;
end $$;
