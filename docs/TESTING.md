# Testing Guide: Supabase v2 Implementation

This guide provides step-by-step instructions for testing the Supabase v2 implementation of Tabia.

## 🚀 Prerequisites

1. **Supabase Project**: Set up with schema and RLS policies applied
2. **Google OAuth**: Configured in Supabase Auth settings
3. **Environment Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
4. **Extension Built**: `npm run build` completed successfully

## 🧪 Test Categories

### 1. Authentication Testing

#### Test 1.1: Google Sign-In
1. Open Chrome extension popup
2. Click "Sign in with Google" button
3. **Expected**: Google OAuth flow opens in new tab
4. **Expected**: After authorization, user is redirected back
5. **Expected**: Extension shows user profile (name, email, photo)
6. **Expected**: User row is created in `users` table

#### Test 1.2: Session Persistence
1. Sign in successfully
2. Close extension popup
3. Reopen extension popup
4. **Expected**: User remains signed in (no re-authentication required)

#### Test 1.3: Sign Out
1. While signed in, click sign out button
2. **Expected**: User is signed out
3. **Expected**: Extension shows sign-in screen
4. Reopen popup
5. **Expected**: Still signed out (session cleared)

### 2. Session Management Testing

#### Test 2.1: Create Session
1. Sign in to extension
2. Create a new session with name "Test Session"
3. **Expected**: Session appears in sessions list
4. **Expected**: Session has correct owner (current user)
5. **Expected**: Session row created in `sessions` table

#### Test 2.2: Create Session with Initial Tabs
1. Open several browser tabs
2. Create session with name "Multi-Tab Session"
3. Include current tabs when creating
4. **Expected**: Session created with all tabs
5. **Expected**: Tabs have correct URLs, titles, and indices

#### Test 2.3: List Sessions
1. Create multiple sessions
2. Refresh extension
3. **Expected**: All owned sessions appear in list
4. **Expected**: Sessions sorted by most recent first
5. **Expected**: Each session shows correct name and tab count

#### Test 2.4: Update Session
1. Create a session
2. Rename session to "Updated Session"
3. **Expected**: Name updates immediately
4. Star/unstar the session
5. **Expected**: Star status updates immediately

#### Test 2.5: Delete Session
1. Create a session with tabs
2. Delete the session
3. **Expected**: Session disappears from list
4. **Expected**: All associated tabs are deleted (cascade)
5. **Expected**: Session no longer in database

### 3. Tab Management Testing

#### Test 3.1: Add Tab to Session
1. Create or open a session
2. Add a new tab with URL "https://example.com"
3. **Expected**: Tab appears in session immediately
4. **Expected**: Tab has correct URL and title

#### Test 3.2: Update Tab
1. Add a tab to session
2. Update tab title to "Updated Title"
3. **Expected**: Title updates in session view
4. Update tab URL
5. **Expected**: URL updates correctly

#### Test 3.3: Delete Tab
1. Add multiple tabs to session
2. Delete one tab
3. **Expected**: Tab disappears from session
4. **Expected**: Other tabs remain unchanged
5. **Expected**: Tab indices update if necessary

### 4. Real-time Collaboration Testing

#### Test 4.1: Two-Window Real-time Sync
1. Open extension in two browser windows/profiles
2. Sign in with same account in both
3. Create session in Window A
4. **Expected**: Session appears in Window B immediately
5. Add tab in Window A
6. **Expected**: Tab appears in Window B within 1-2 seconds
7. Delete tab in Window B
8. **Expected**: Tab disappears in Window A immediately

#### Test 4.2: Multi-User Real-time (Requires Two Accounts)
1. Set up two different Google accounts
2. Sign in with Account A, create session
3. Create invite for the session
4. Sign in with Account B in different browser
5. Accept invite using invite code
6. **Expected**: Account B can see the session
7. Add tab with Account B
8. **Expected**: Tab appears for Account A in real-time
9. Update session name with Account A
10. **Expected**: Name updates for Account B in real-time

### 5. Collaboration & Permissions Testing

#### Test 5.1: Create and Accept Invite
1. Sign in with Account A
2. Create session "Shared Session"
3. Create invite with EDITOR role
4. Copy invite code
5. Sign in with Account B (different browser/profile)
6. Accept invite using code
7. **Expected**: Account B can see "Shared Session"
8. **Expected**: Account B shows as collaborator in session

#### Test 5.2: Editor Permissions
1. Account A creates session, invites Account B as EDITOR
2. Account B accepts invite
3. Account B tries to:
   - Add tab: **Expected**: ✅ Success
   - Update tab: **Expected**: ✅ Success
   - Delete tab: **Expected**: ✅ Success
   - Rename session: **Expected**: ❌ Should fail (owner only)
   - Delete session: **Expected**: ❌ Should fail (owner only)

#### Test 5.3: Viewer Permissions
1. Account A creates session, invites Account B as VIEWER
2. Account B accepts invite
3. Account B tries to:
   - View session: **Expected**: ✅ Success
   - View tabs: **Expected**: ✅ Success
   - Add tab: **Expected**: ❌ Should fail
   - Update tab: **Expected**: ❌ Should fail
   - Delete tab: **Expected**: ❌ Should fail

### 6. Row Level Security (RLS) Testing

#### Test 6.1: Session Access Control
1. Sign in with Account A, create session
2. Note the session ID
3. Sign in with Account B (different browser)
4. Try to access Account A's session directly
5. **Expected**: Account B cannot see Account A's private session
6. **Expected**: No data leakage in session list

#### Test 6.2: Tab Access Control
1. Account A creates session with tabs
2. Account B (not a collaborator) tries to:
   - View tabs: **Expected**: ❌ No access
   - Add tabs: **Expected**: ❌ No access
   - Modify tabs: **Expected**: ❌ No access

#### Test 6.3: Invite Security
1. Account A creates invite
2. Account B uses invite code: **Expected**: ✅ Success
3. Account B tries to use same code again: **Expected**: ❌ "Already used"
4. Account C tries to use expired invite: **Expected**: ❌ "Expired"

### 7. Error Handling Testing

#### Test 7.1: Network Errors
1. Disconnect internet
2. Try to create session
3. **Expected**: Appropriate error message shown
4. Reconnect internet
5. **Expected**: Operations work normally

#### Test 7.2: Invalid Data
1. Try to create session with empty name
2. **Expected**: Validation error shown
3. Try to add tab with invalid URL
4. **Expected**: Appropriate error handling

#### Test 7.3: Permission Errors
1. Account B (viewer) tries to delete tab
2. **Expected**: "Permission denied" error
3. Try to accept non-existent invite
4. **Expected**: "Invalid invite code" error

## 🔍 Manual Verification Steps

### Database Verification
1. Open Supabase dashboard → Table Editor
2. Check `users` table has correct user data
3. Check `sessions` table shows owned sessions
4. Check `tabs` table has correct session associations
5. Check `collaborators` table shows correct roles
6. Check `invites` table shows correct codes and usage

### Real-time Verification
1. Open Supabase dashboard → Database → Replication
2. Verify `sessions` and `tabs` tables have realtime enabled
3. Monitor real-time events in browser dev tools console
4. Look for messages like "📝 Tab inserted" and "🔄 Session updated"

### Performance Verification
1. Create session with 20+ tabs
2. **Expected**: Creation completes within 2-3 seconds
3. Open session with many tabs
4. **Expected**: Loads within 1-2 seconds
5. Real-time updates
6. **Expected**: Appear within 1-2 seconds across windows

## ✅ Success Criteria

### Core Functionality
- ✅ Authentication works with Google OAuth
- ✅ Sessions can be created, read, updated, deleted
- ✅ Tabs can be added, modified, removed from sessions
- ✅ Real-time updates work across browser windows
- ✅ Collaboration invites can be created and accepted

### Security
- ✅ RLS prevents unauthorized access to sessions
- ✅ Role-based permissions work correctly
- ✅ Users can only see their own data and shared sessions

### Performance
- ✅ Operations complete within acceptable time limits
- ✅ Real-time updates are near-instantaneous
- ✅ UI remains responsive during operations

### Error Handling
- ✅ Network errors are handled gracefully
- ✅ Permission errors show appropriate messages
- ✅ Invalid data is rejected with clear feedback

## 🐛 Common Issues & Solutions

### Issue: "User not authenticated" errors
**Solution**: Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly

### Issue: Real-time not working
**Solution**: Verify realtime is enabled for `sessions` and `tabs` tables in Supabase dashboard

### Issue: Google OAuth not working
**Solution**: Check Google OAuth configuration in Supabase Auth settings

### Issue: Permission denied errors
**Solution**: Verify RLS policies are applied correctly using `backend-supabase/sql/rls.sql`

### Issue: Invite codes not working
**Solution**: Check that invites table has the temporary read policy for authenticated users

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Supabase Project: ___________

Authentication: ✅/❌
Session Management: ✅/❌
Tab Operations: ✅/❌
Real-time Sync: ✅/❌
Collaboration: ✅/❌
RLS Security: ✅/❌
Error Handling: ✅/❌

Notes:
_________________________________
_________________________________
```

Use this checklist to systematically verify that the Supabase v2 implementation works correctly and securely.
