# Tabia v2 Supabase Backend

This directory contains the Supabase (v2) backend implementation for Tabia, providing a modern, scalable alternative to the Spring Boot backend.

## 🚀 Quick Start

### 1. Set up Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

### 2. Apply Database Schema
Run the SQL files in this order:

```sql
-- 1. Create tables and basic structure
\i sql/schema.sql

-- 2. Apply Row Level Security policies
\i sql/rls.sql

-- 3. Create custom endpoints and functions
\i sql/endpoints.sql
```

### 3. Configure Google OAuth
1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth client ID and secret
4. Set authorized redirect URI: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`

### 4. Update Extension Environment
Add these to your `.env` file:
```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
VITE_API_BASE=https://[YOUR_PROJECT_REF].supabase.co/rest/v1
```

## 🔧 Recent Fixes Applied

### Fixed RLS Infinite Recursion
- **Issue**: RLS policies had circular references causing infinite recursion
- **Solution**: Added explicit table aliases in all policy queries
- **Files**: `sql/rls.sql`

### Added Missing Endpoints
- **Issue**: `/me` endpoint didn't exist, causing 404 errors
- **Solution**: Created `user_profile` view and `get_user_profile()` function
- **Files**: `sql/endpoints.sql`

### Improved Session Restoration
- **Issue**: Session restoration wasn't working properly
- **Solution**: Created `get_session_tabs()` function for secure tab retrieval
- **Files**: `sql/endpoints.sql`

## 📊 Database Schema

### Core Tables
- **users**: User profiles (synced from Supabase Auth)
- **sessions**: Tab groups with metadata
- **tabs**: Individual browser tabs within sessions
- **collaborators**: Session sharing and permissions
- **invites**: Session invitation system

### Security Features
- **Row Level Security (RLS)**: All tables protected
- **User Isolation**: Users can only access their own data
- **Collaboration**: Secure sharing between users
- **Role-based Access**: Owner, Editor, Viewer permissions

## 🔐 Authentication

- **Google OAuth**: Primary authentication method
- **JWT Tokens**: Automatic token management
- **User Profiles**: Automatic profile creation on first login

## 🚨 Troubleshooting

### Common Issues

#### 1. RLS Policy Errors
```sql
-- If you see "infinite recursion" errors:
-- Make sure you've applied the updated rls.sql file
-- Check that all policy queries use explicit table aliases
```

#### 2. Missing Endpoints
```sql
-- If you see 404 errors for /me:
-- Make sure you've applied endpoints.sql
-- Verify the user_profile view exists
```

#### 3. Session Restoration Not Working
```sql
-- If sessions don't open tabs:
-- Check that get_session_tabs function exists
-- Verify RLS policies allow access to session data
```

### Debug Queries
```sql
-- Check if user_profile view exists
SELECT * FROM user_profile LIMIT 1;

-- Check if get_session_tabs function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_session_tabs';

-- Test RLS policies
SELECT * FROM sessions WHERE owner_id = auth_uid();
```

## 🔄 Migration from v1

See `docs/MIGRATION_NOTES.md` for detailed migration information.

## 📝 Testing

See `docs/TESTING.md` for testing procedures and verification steps.
