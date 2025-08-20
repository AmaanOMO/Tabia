-- =============================================================================
-- TABIA v2 COMPREHENSIVE SECURITY FIX
-- Addresses ALL Supabase Security Advisor issues
-- =============================================================================

-- =============================================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =============================================================================

-- Enable RLS on all tables (this was the main security issue)
alter table users enable row level security;
alter table sessions enable row level security;
alter table tabs enable row level security;
alter table collaborators enable row level security;
alter table invites enable row level security;

-- =============================================================================
-- 2. FIX FUNCTION SECURITY - SET IMMUTABLE SEARCH PATHS
-- =============================================================================

-- Fix auth_uid function with immutable search path
create or replace function auth_uid() returns text
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')
$$;

-- Fix update_updated_at_column function with immutable search path
create or replace function update_updated_at_column()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix get_user_profile function with immutable search path
create or replace function get_user_profile()
returns table (
  uid text,
  email text,
  name text,
  photo_url text,
  created_at timestamptz
)
language sql security definer
set search_path = pg_catalog, public
as $$
  select uid, email, name, photo_url, created_at
  from users
  where uid = auth_uid();
$$;

-- Fix get_session_tabs function with immutable search path
create or replace function get_session_tabs(session_id uuid)
returns table (
  id uuid,
  title text,
  url text,
  tab_index int,
  window_index int
)
language sql security definer
set search_path = pg_catalog, public
as $$
  select 
    t.id,
    t.title,
    t.url,
    t.tab_index,
    t.window_index
  from tabs t
  inner join sessions s on t.session_id = s.id
  where s.id = session_id
    and (
      s.owner_id = auth_uid()
      or exists (
        select 1 from collaborators c 
        where c.session_id = s.id and c.user_id = auth_uid()
      )
    )
  order by t.tab_index, t.window_index;
$$;

-- =============================================================================
-- 3. IMPLEMENT COMPREHENSIVE RLS POLICIES
-- =============================================================================

-- Drop existing policies to recreate them properly
drop policy if exists users_self_select on users;
drop policy if exists users_insert_self on users;
drop policy if exists users_update_self on users;
drop policy if exists sessions_select on sessions;
drop policy if exists sessions_insert_owner on sessions;
drop policy if exists sessions_update_owner on sessions;
drop policy if exists sessions_delete_owner on sessions;
drop policy if exists tabs_select on tabs;
drop policy if exists tabs_write on tabs;
drop policy if exists collab_select on collaborators;
drop policy if exists collab_insert_owner on collaborators;
drop policy if exists collab_delete_owner on collaborators;
drop policy if exists invites_select_owner on invites;
drop policy if exists invites_select_authenticated on invites;
drop policy if exists invites_insert_owner on invites;
drop policy if exists invites_update_owner on invites;

-- =============================================================================
-- USERS POLICIES: Users can only manage their own data
-- =============================================================================

create policy users_self_select on users
for select using (uid = auth_uid());

create policy users_insert_self on users
for insert with check (uid = auth_uid());

create policy users_update_self on users
for update using (uid = auth_uid());

-- =============================================================================
-- SESSIONS POLICIES: Owner + collaborators can read; only owner can modify
-- =============================================================================

-- SELECT: Owner or collaborator can view sessions
create policy sessions_select on sessions
for select using (
  owner_id = auth_uid()
  or exists (
    select 1 from collaborators c 
    where c.session_id = sessions.id and c.user_id = auth_uid()
  )
);

-- INSERT: Only authenticated users can create sessions (they become owner)
create policy sessions_insert_owner on sessions
for insert with check (auth_uid() is not null and owner_id = auth_uid());

-- UPDATE: Only session owner can modify session properties
create policy sessions_update_owner on sessions
for update using (owner_id = auth_uid());

-- DELETE: Only session owner can delete sessions
create policy sessions_delete_owner on sessions
for delete using (owner_id = auth_uid());

-- =============================================================================
-- TABS POLICIES: Visible to session collaborators; write for owner/editor
-- =============================================================================

-- SELECT: Visible to session owner and collaborators
create policy tabs_select on tabs
for select using (
  exists (
    select 1 from sessions s
    left join collaborators c on c.session_id = s.id and c.user_id = auth_uid()
    where s.id = tabs.session_id
      and (s.owner_id = auth_uid() or c.user_id is not null)
  )
);

-- INSERT/UPDATE/DELETE: Owner and editors can modify tabs
create policy tabs_write on tabs
for all using (
  exists (
    select 1 from sessions s
    left join collaborators c on c.session_id = s.id and c.user_id = auth_uid()
    where s.id = tabs.session_id
      and (
        s.owner_id = auth_uid()
        or (c.user_id is not null and c.role in ('EDITOR','OWNER'))
      )
  )
) with check (
  exists (
    select 1 from sessions s
    left join collaborators c on c.session_id = s.id and c.user_id = auth_uid()
    where s.id = tabs.session_id
      and (
        s.owner_id = auth_uid()
        or (c.user_id is not null and c.role in ('EDITOR','OWNER'))
      )
  )
);

-- =============================================================================
-- COLLABORATORS POLICIES: Owner manages; collaborators can read their own
-- =============================================================================

-- SELECT: Session owner can list all collaborators; users can see their own
create policy collab_select on collaborators
for select using (
  exists (
    select 1 from sessions s where s.id = collaborators.session_id
      and (s.owner_id = auth_uid() or collaborators.user_id = auth_uid())
  )
);

-- INSERT: Only session owner can add collaborators
create policy collab_insert_owner on collaborators
for insert with check (
  exists (select 1 from sessions s where s.id = collaborators.session_id and s.owner_id = auth_uid())
);

-- UPDATE: Only session owner can modify collaborator roles
create policy collab_update_owner on collaborators
for update using (
  exists (select 1 from sessions s where s.id = collaborators.session_id and s.owner_id = auth_uid())
);

-- DELETE: Only session owner can remove collaborators
create policy collab_delete_owner on collaborators
for delete using (
  exists (select 1 from sessions s where s.id = collaborators.session_id and s.owner_id = auth_uid())
);

-- =============================================================================
-- INVITES POLICIES: Owner creates/manages; secure acceptance flow
-- =============================================================================

-- SELECT: Session owner can list their invites; users can see invites by code
create policy invites_select_owner on invites
for select using (
  exists (select 1 from sessions s where s.id = invites.session_id and s.owner_id = auth_uid())
);

-- SELECT: Allow authenticated users to read invites by code for acceptance
create policy invites_select_by_code on invites
for select using (
  auth_uid() is not null
  and invite_code is not null
);

-- INSERT: Only session owner can create invites
create policy invites_insert_owner on invites
for insert with check (
  exists (select 1 from sessions s where s.id = invites.session_id and s.owner_id = auth_uid())
);

-- UPDATE: Only session owner can update invites (mark as used, etc.)
create policy invites_update_owner on invites
for update using (
  exists (select 1 from sessions s where s.id = invites.session_id and s.owner_id = auth_uid())
);

-- DELETE: Only session owner can delete invites
create policy invites_delete_owner on invites
for delete using (
  exists (select 1 from sessions s where s.id = invites.session_id and s.owner_id = auth_uid())
);

-- =============================================================================
-- 4. SECURE THE USER_PROFILE VIEW
-- =============================================================================

-- Drop the insecure view
drop view if exists user_profile;

-- Create a secure user profile view
create or replace view user_profile as
select 
  uid,
  email,
  name,
  photo_url,
  created_at
from users
where uid = auth_uid();

-- Grant access only to authenticated users
grant select on user_profile to authenticated;
revoke select on user_profile from anon;

-- =============================================================================
-- 5. SECURE FUNCTION PERMISSIONS
-- =============================================================================

-- Grant execute permissions only to authenticated users
grant execute on function get_user_profile() to authenticated;
revoke execute on function get_user_profile() from anon;

grant execute on function get_session_tabs(uuid) to authenticated;
revoke execute on function get_session_tabs(uuid) from anon;

-- =============================================================================
-- 6. ADDITIONAL SECURITY MEASURES
-- =============================================================================

-- Create a secure function to check if user has access to a session
create or replace function user_has_session_access(session_id uuid)
returns boolean
language sql security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from sessions s
    left join collaborators c on c.session_id = s.id and c.user_id = auth_uid()
    where s.id = session_id
      and (s.owner_id = auth_uid() or c.user_id is not null)
  );
$$;

-- Grant execute permission
grant execute on function user_has_session_access(uuid) to authenticated;

-- =============================================================================
-- 7. VERIFICATION QUERIES
-- =============================================================================

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'sessions', 'tabs', 'collaborators', 'invites')
ORDER BY tablename;

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify functions have secure search paths
SELECT 
  proname as function_name,
  prosrc as source,
  proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND proname IN ('auth_uid', 'get_user_profile', 'get_session_tabs', 'update_updated_at_column')
ORDER BY proname;
