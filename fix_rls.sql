
-- Fix Missing RLS Policy
-- This allows users to see their own role in the organization.
create policy "Members can view their own membership" 
on public.org_members 
for select 
using (auth.uid() = user_id);
