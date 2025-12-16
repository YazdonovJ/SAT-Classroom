-- Comprehensive check of DB state for Join Class flow

-- 1. Check cohort_codes RLS
select tablename, policyname, roles, cmd, qual 
from pg_policies 
where tablename = 'cohort_codes';

-- 2. Check cohorts RLS
select tablename, policyname, roles, cmd, qual 
from pg_policies 
where tablename = 'cohorts';

-- 3. Check courses RLS
select tablename, policyname, roles, cmd, qual 
from pg_policies 
where tablename = 'courses';

-- 4. Check the specific code 'DHLKRR' and its relationships
-- We want to see if we can resolve the join manually
select 
  cc.code,
  cc.cohort_id,
  c.name as cohort_name,
  co.title as course_title
from cohort_codes cc
left join cohorts c on cc.cohort_id = c.id
left join courses co on c.course_id = co.id
where cc.code = 'DHLKRR';

-- 5. Check foreign key definitions (crucial for Supabase joins)
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'cohort_codes';
