-- Tabia v2 Custom Endpoints for Supabase
-- Provides /me endpoint and session restoration functionality

-- Create a view for user profile data
create or replace view user_profile as
select 
  uid,
  email,
  name,
  photo_url,
  created_at
from users
where uid = auth_uid();

-- Grant access to the view
grant select on user_profile to authenticated;

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
  where uid = auth_uid();
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
      or exists (
        select 1 from collaborators c 
        where c.session_id = s.id and c.user_id = auth_uid()
      )
    )
  order by t.tab_index, t.window_index;
$$;

-- Grant access to the functions
grant execute on function get_user_profile() to authenticated;
grant execute on function get_session_tabs(uuid) to authenticated;


