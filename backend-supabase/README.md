# Tabia v2 - Supabase Backend

This folder contains the SQL schema and configuration for Tabia's v2 implementation using Supabase.

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)

### 2. Apply Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `sql/schema.sql`
4. Click **Run** to create tables and indexes
5. Copy and paste the contents of `sql/rls.sql`  
6. Click **Run** to enable Row Level Security

### 3. Enable Google Authentication
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console
4. Add your domain to **Site URL** and **Redirect URLs**

### 4. Get API Keys
1. Go to **Settings** → **API**
2. Copy the **Project URL** and **anon public** key
3. Add them to your extension's `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

### 5. Enable Realtime (Optional)
1. Go to **Database** → **Replication**
2. Enable realtime for tables: `sessions`, `tabs`, `collaborators`
3. This enables live updates across browser windows

## 📊 Database Schema

### Core Tables
- **`users`** - User profiles synced from Supabase Auth
- **`sessions`** - Tab groups/collections  
- **`tabs`** - Individual browser tabs within sessions
- **`collaborators`** - Users with access to shared sessions
- **`invites`** - Invitation codes for session sharing

### Relationships
- Users own sessions (1:many)
- Sessions contain tabs (1:many)  
- Sessions have collaborators (many:many through collaborators table)
- Sessions can have invite codes (1:many)

## 🔐 Security Model

### Row Level Security (RLS)
All tables have RLS enabled with policies that enforce:

- **Users**: Can only read/write their own profile
- **Sessions**: Visible to owner + collaborators; only owner can modify
- **Tabs**: Visible to session collaborators; owner + editors can modify
- **Collaborators**: Owner manages; users see their own access
- **Invites**: Owner creates; temporary policy allows authenticated users to read for acceptance

### Roles
- **OWNER**: Full control (session creator)
- **EDITOR**: Can add/remove/modify tabs
- **VIEWER**: Read-only access

## 🧪 Testing Setup

See `../docs/TESTING.md` for detailed testing instructions including:
- Two-account RLS verification
- Realtime sync testing
- Collaboration flow testing

## 🔄 Migration from v1

See `../docs/MIGRATION_NOTES.md` for mapping between Spring Boot v1 endpoints and Supabase v2 operations.

## 📝 Notes

- The invite acceptance flow currently uses client-side logic with a temporary RLS policy
- For production, consider implementing an Edge Function for invite acceptance
- All timestamps use `timestamptz` for proper timezone handling
- Indexes are optimized for common query patterns
