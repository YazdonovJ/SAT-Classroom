
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS (Profiles)
create table public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;

-- ORGANIZATIONS
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
alter table public.organizations enable row level security;

-- ORG MEMBERS
create type app_role as enum ('owner', 'admin', 'teacher', 'student');
create table public.org_members (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role app_role not null default 'student',
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);
alter table public.org_members enable row level security;

-- COURSES
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now()
);
alter table public.courses enable row level security;

-- TRACKS (e.g. 'A', 'B')
create table public.tracks (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null, -- 'A', 'B'
  created_at timestamptz default now()
);
alter table public.tracks enable row level security;

-- UNITS
create table public.units (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz default now()
);
alter table public.units enable row level security;

-- COHORTS
create table public.cohorts (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);
alter table public.cohorts enable row level security;

-- LESSONS
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  unit_id uuid references public.units(id) on delete cascade not null,
  track_id uuid references public.tracks(id), -- If null, visible to all? Use specific tracks for now.
  title text not null,
  content text, 
  order_index int not null default 0,
  created_at timestamptz default now()
);
alter table public.lessons enable row level security;

-- ENROLLMENTS
create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  track_id uuid references public.tracks(id),
  starting_unit_id uuid references public.units(id),
  created_at timestamptz default now(),
  unique(cohort_id, user_id)
);
alter table public.enrollments enable row level security;

-- COHORT TEACHERS
create table public.cohort_teachers (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(cohort_id, user_id)
);
alter table public.cohort_teachers enable row level security;

-- COHORT UNIT STATE (Unlock logic)
create table public.cohort_unit_state (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  is_unlocked boolean default false,
  unlocked_at timestamptz,
  created_at timestamptz default now(),
  unique(cohort_id, unit_id)
);
alter table public.cohort_unit_state enable row level security;

-- ASSIGNMENTS
create table public.assignments (
    id uuid default uuid_generate_v4() primary key,
    unit_id uuid references public.units(id) on delete cascade not null,
    title text not null,
    details text,
    rubric_json jsonb,
    created_at timestamptz default now()
);
alter table public.assignments enable row level security;

-- SUBMISSIONS
create table public.submissions (
    id uuid default uuid_generate_v4() primary key,
    assignment_id uuid references public.assignments(id) on delete cascade not null,
    student_id uuid references public.users(id) on delete cascade not null,
    content_url text,
    grade_json jsonb,
    score int,
    submitted_at timestamptz default now(),
    graded_at timestamptz
);
alter table public.submissions enable row level security;

-- NOTIFICATIONS (Simple table)
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) not null,
    title text not null,
    message text,
    is_read boolean default false,
    created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users manage own notifications" on public.notifications using (auth.uid() = user_id);

-- RLS: USERS
create policy "Public profiles are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- RLS: ORGANIZATIONS (Public read for now, create restricted later via functions)
create policy "Orgs are viewable by everyone" on public.organizations for select using (true);

-- ... (Detailed RLS will be added in a separate iteration/file or refined here if I have time. For MVP init, this structure is key)

-- Publication for Realtime default
alter publication supabase_realtime add table public.cohort_unit_state;
alter publication supabase_realtime add table public.notifications;
