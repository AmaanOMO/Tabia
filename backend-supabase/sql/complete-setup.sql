-- Tabia v2 Complete Database Setup for Supabase
-- Session management with collaborative features

-- Enable required extensions
create extension if not exists pgcrypto;

-- Users table (synced from Supabase Auth)
create table if not exists users (
  uid text primary key,
  email text unique not null,
  name text,
  photo_url text,
  created_at timestamptz default now()
);

-- Sessions table (tab groups)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references users(uid) on delete cascade,
  name text not null,
  is_starred boolean default false,
  is_window_session boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabs table (individual browser tabs)
create table if not exists tabs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  title text,
  url text not null,
  tab_index int default 0,
  window_index int default 0,
  created_at timestamptz default now()
);

-- Collaborator role enum
do $$ begin
  create type collaborator_role as enum ('OWNER','EDITOR','VIEWER');
exception
  when duplicate_object then null;
end $$;

-- Collaborators table (session sharing)
create table if not exists collaborators (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id text not null references users(uid) on delete cascade,
  role collaborator_role not null,
  added_at timestamptz default now(),
  unique (session_id, user_id)
);

-- Invites table (session invitation system)
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  invite_code text not null unique,
  role collaborator_role not null default 'EDITOR',
  created_by text not null references users(uid) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz,
  used boolean default false
);

-- Indexes for performance
create index if not exists idx_sessions_owner_id on sessions(owner_id);
create index if not exists idx_sessions_updated_at on sessions(updated_at desc);
create index if not exists idx_tabs_session_id on tabs(session_id);
create index if not exists idx_tabs_session_tab_index on tabs(session_id, tab_index);
create index if not exists idx_collaborators_session_id on collaborators(session_id);
create index if not exists idx_collaborators_user_id on collaborators(user_id);
create index if not exists idx_invites_code on invites(invite_code);
create index if not exists idx_invites_session_id on invites(session_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at on sessions
drop trigger if exists update_sessions_updated_at on sessions;
create trigger update_sessions_updated_at
  before update on sessions
  for each row
  execute function update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - DISABLED FOR DEVELOPMENT
-- =============================================================================

-- DISABLE RLS on all tables for development (no authentication required)
alter table users disable row level security;
alter table sessions disable row level security;
alter table tabs disable row level security;
alter table collaborators disable row level security;
alter table invites disable row level security;

-- Helper function to get authenticated user ID (not used when RLS is disabled)
create or replace function auth_uid() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')
$$;

-- =============================================================================
-- CUSTOM ENDPOINTS FOR API
-- =============================================================================

-- Create a view for user profile data (works without auth for now)
create or replace view user_profile as
select 
  uid,
  email,
  name,
  photo_url,
  created_at
from users
where uid = auth_uid() or auth_uid() is null;  -- Allow access even without auth

-- Grant access to the view
grant select on user_profile to authenticated;
grant select on user_profile to anon;  -- Allow anonymous access

-- Create a function to get user profile
create or replace function get_user_profile()
returns table (
  uid text,
  email text,
  name text,
  photo_url text,
  created_at timestamptz
)
language sql
security definer
as $$
  select uid, email, name, photo_url, created_at
  from users
  where uid = auth_uid() or auth_uid() is null;  -- Allow access even without auth
$$;

-- Create a function to restore a session (returns tab URLs)
create or replace function get_session_tabs(session_id uuid)
returns table (
  id uuid,
  title text,
  url text,
  tab_index int,
  window_index int
)
language sql
security definer
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
      or auth_uid() is null  -- Allow access even without auth
      or exists (
        select 1 from collaborators c 
        where c.session_id = s.id and c.user_id = auth_uid()
      )
    )
  order by t.tab_index, t.window_index;
$$;

-- Grant access to the functions
grant execute on function get_user_profile() to authenticated;
grant execute on function get_user_profile() to anon;  -- Allow anonymous access
grant execute on function get_session_tabs(uuid) to authenticated;
grant execute on function get_session_tabs(uuid) to anon;  -- Allow anonymous access

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Test if everything is set up correctly
SELECT 
  'Setup Complete - RLS Disabled' as status,
  'All tables created, RLS disabled for development' as message;
