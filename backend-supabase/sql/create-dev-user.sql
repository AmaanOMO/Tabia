-- Create the missing dev user that the extension is trying to reference
-- This is a backup in case the automatic sign-in doesn't work immediately

-- First, create the user in public.users table
INSERT INTO public.users (uid, email, name, photo_url, created_at)
VALUES ('dev-user', 'developer@tabia.local', 'Dev User', null, now())
ON CONFLICT (uid) DO NOTHING;

-- Verify the user was created
SELECT 'User created successfully' as status, uid, email, name FROM public.users WHERE uid = 'dev-user';

-- Also check if there are any other users
SELECT 'All users in system:' as info, count(*) as total_users FROM public.users;
