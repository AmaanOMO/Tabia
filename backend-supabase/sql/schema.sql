-- Tabia v2 Database Schema for Supabase
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
