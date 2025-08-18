-- Google OAuth Setup Instructions for Supabase
-- This script contains the steps to enable Google OAuth in your Supabase project

-- =============================================================================
-- STEP 1: Enable Google Provider in Supabase Dashboard
-- =============================================================================

-- Go to your Supabase Dashboard:
-- 1. Navigate to Authentication → Providers
-- 2. Find "Google" and click "Enable"
-- 3. You'll need to set up OAuth credentials in Google Cloud Console first

-- =============================================================================
-- STEP 2: Google Cloud Console Setup
-- =============================================================================

-- 1. Go to https://console.cloud.google.com/
-- 2. Create a new project or select existing one
-- 3. Enable Google+ API
-- 4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
-- 5. Application type: "Web application"
-- 6. Authorized redirect URIs: Add your Supabase OAuth callback URL
--    (You'll get this from Supabase after enabling Google provider)

-- =============================================================================
-- STEP 3: Configure Supabase OAuth Settings
-- =============================================================================

-- After enabling Google provider in Supabase:
-- 1. Copy the Client ID and Client Secret from Google Cloud Console
-- 2. Paste them into the Google provider settings in Supabase
-- 3. Save the configuration

-- =============================================================================
-- STEP 4: Update Extension ID in Supabase
-- =============================================================================

-- Important: You'll need to add your Chrome extension's callback URL to Supabase:
-- Format: chrome-extension://YOUR_EXTENSION_ID/callback.html
-- 
-- To find your extension ID:
-- 1. Go to chrome://extensions/
-- 2. Find Tabia extension
-- 3. Copy the ID (it's a long string like: ehjahbcgfgnlcccnkkllgcanamplbpce)
-- 4. Add this URL to Supabase Auth → URL Configuration → Redirect URLs:
--    chrome-extension://YOUR_EXTENSION_ID/callback.html

-- =============================================================================
-- STEP 5: Test the Setup
-- =============================================================================

-- After completing the setup:
-- 1. Reload your Tabia extension in Chrome
-- 2. Try to create a session
-- 3. You should be redirected to Google for authentication
-- 4. After successful auth, you'll be redirected back to the extension

-- =============================================================================
-- NOTES
-- =============================================================================

-- - The extension will now use real Google accounts instead of fake emails
-- - Each user will have a proper profile in your public.users table
-- - Sessions will be properly linked to authenticated users
-- - No more foreign key constraint violations!

-- Run this query to verify your current auth configuration:
SELECT 
  'Current Auth Status' as info,
  'Check Supabase Dashboard → Authentication → Providers' as next_step;
