-- Tabia v2 Row Level Security (RLS) Policies
-- Secure access control for collaborative session management

-- Enable RLS on all tables
alter table users enable row level security;
alter table sessions enable row level security;
alter table tabs enable row level security;
alter table collaborators enable row level security;
alter table invites enable row level security;

-- Helper function to get authenticated user ID
create or replace function auth_uid() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')
$$;

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
    where c.session_id = id and c.user_id = auth_uid()
  )
);

-- INSERT: Only authenticated users can create sessions (they become owner)
create policy sessions_insert_owner on sessions
for insert with check (owner_id = auth_uid());

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
    select 1 from sessions s where s.id = session_id
      and (s.owner_id = auth_uid() or user_id = auth_uid())
  )
);

-- INSERT: Only session owner can add collaborators
create policy collab_insert_owner on collaborators
for insert with check (
  exists (select 1 from sessions s where s.id = session_id and s.owner_id = auth_uid())
);

-- DELETE: Only session owner can remove collaborators
create policy collab_delete_owner on collaborators
for delete using (
  exists (select 1 from sessions s where s.id = session_id and s.owner_id = auth_uid())
);

-- =============================================================================
-- INVITES POLICIES: Owner creates/manages; interim policy for acceptance
-- =============================================================================

-- SELECT: Session owner can list their invites
create policy invites_select_owner on invites
for select using (
  exists (select 1 from sessions s where s.id = session_id and s.owner_id = auth_uid())
);

-- TEMP policy: allow any logged-in user to read invites by code for acceptance
-- TODO: Replace with Edge Function flow and tighten this policy
create policy invites_select_authenticated on invites
for select using (auth_uid() is not null);

-- INSERT: Only session owner can create invites
create policy invites_insert_owner on invites
for insert with check (
  exists (select 1 from sessions s where s.id = session_id and s.owner_id = auth_uid())
);

-- UPDATE: Only session owner can update invites (mark as used, etc.)
create policy invites_update_owner on invites
for update using (
  exists (select 1 from sessions s where s.id = session_id and s.owner_id = auth_uid())
);
