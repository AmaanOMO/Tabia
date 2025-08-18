import { createClient } from '@supabase/supabase-js';
import { chromeStorageAdapter } from './supaStorage';
import {
  SessionDTO,
  TabDTO,
  CollaboratorDTO,
  InviteDTO,
  CreateSessionRequest,
  UpdateSessionRequest,
  AddTabRequest,
  UpdateTabRequest,
  CreateInviteRequest,
  CollaboratorRole,
  ListOptions
} from '../types/dto';

// Initialize Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,         // we handle redirects ourselves
      storage: chromeStorageAdapter,
      storageKey: 'tabia.supabase.auth', // IMPORTANT: same in bg + popup
    }
  }
);

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

/**
 * List all sessions for the current user (owned + shared)
 */
export async function listSessions(options: ListOptions = {}): Promise<SessionDTO[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { sortBy = 'updatedAt', sortOrder = 'desc', starred } = options;

  let query = supabase
    .from('sessions')
    .select(`
      id,
      name,
      owner_id,
      is_starred,
      is_window_session,
      created_at,
      updated_at,
      users!sessions_owner_id_fkey(name, email),
      tabs(id, title, url, tab_index, window_index, created_at),
      collaborators(id, role)
    `)
    .order(sortBy === 'name' ? 'name' : 
           sortBy === 'createdAt' ? 'created_at' : 'updated_at', 
           { ascending: sortOrder === 'asc' });

  if (starred !== undefined) {
    query = query.eq('is_starred', starred);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list sessions: ${error.message}`);

  return data?.map(session => ({
    id: session.id,
    name: session.name,
    ownerId: session.owner_id,
    ownerName: session.users?.[0]?.name,
    ownerEmail: session.users?.[0]?.email,
    isStarred: session.is_starred,
    isWindowSession: session.is_window_session,
    isOwner: session.owner_id === user.id,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    tabs: session.tabs?.map(tab => ({
      id: tab.id,
      sessionId: session.id,
      title: tab.title,
      url: tab.url,
      tabIndex: tab.tab_index,
      windowIndex: tab.window_index,
      createdAt: tab.created_at
    })),
    collaboratorCount: session.collaborators?.length || 0
  })) || [];
}

/**
 * Get a specific session by ID
 */
export async function getSession(sessionId: string): Promise<SessionDTO> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      name,
      owner_id,
      is_starred,
      is_window_session,
      created_at,
      updated_at,
      users!sessions_owner_id_fkey(name, email),
      tabs(id, title, url, tab_index, window_index, created_at),
      collaborators(id, role)
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Session not found or access denied');
    }
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    ownerId: data.owner_id,
    ownerName: data.users?.[0]?.name,
    ownerEmail: data.users?.[0]?.email,
    isStarred: data.is_starred,
    isWindowSession: data.is_window_session,
    isOwner: data.owner_id === user.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    tabs: data.tabs?.map(tab => ({
      id: tab.id,
      sessionId: data.id,
      title: tab.title,
      url: tab.url,
      tabIndex: tab.tab_index,
      windowIndex: tab.window_index,
      createdAt: tab.created_at
    })),
    collaboratorCount: data.collaborators?.length || 0
  };
}

/**
 * Create a new session with optional initial tabs
 */
export async function createSession(request: CreateSessionRequest): Promise<SessionDTO> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Start transaction
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      owner_id: user.id,
      name: request.name,
      is_window_session: request.isWindowSession || false
    })
    .select()
    .single();

  if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);

  // Add initial tabs if provided
  let tabs: TabDTO[] = [];
  if (request.tabs && request.tabs.length > 0) {
    const { data: tabData, error: tabError } = await supabase
      .from('tabs')
      .insert(
        request.tabs.map((tab, index) => ({
          session_id: session.id,
          title: tab.title,
          url: tab.url,
          tab_index: tab.tabIndex ?? index,
          window_index: tab.windowIndex ?? 0
        }))
      )
      .select();

    if (tabError) throw new Error(`Failed to create tabs: ${tabError.message}`);
    
    tabs = tabData?.map(tab => ({
      id: tab.id,
      sessionId: tab.session_id,
      title: tab.title,
      url: tab.url,
      tabIndex: tab.tab_index,
      windowIndex: tab.window_index,
      createdAt: tab.created_at
    })) || [];
  }

  // Get owner details
  const { data: ownerData, error: ownerError } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', session.owner_id)
    .single();

  if (ownerError) throw new Error(`Failed to get owner details: ${ownerError.message}`);

  return {
    id: session.id,
    name: session.name,
    ownerId: session.owner_id,
    ownerName: ownerData.name,
    ownerEmail: ownerData.email,
    isStarred: session.is_starred,
    isWindowSession: session.is_window_session,
    isOwner: true,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    tabs,
    collaboratorCount: 0
  };
}

/**
 * Update session properties (rename, star/unstar)
 */
export async function updateSession(sessionId: string, patch: UpdateSessionRequest): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.isStarred !== undefined) updateData.is_starred = patch.isStarred;

  const { error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

/**
 * Delete a session (owner only)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to delete session: ${error.message}`);
}

// =============================================================================
// TAB OPERATIONS
// =============================================================================

/**
 * Add a tab to a session
 */
export async function addTab(sessionId: string, tab: AddTabRequest): Promise<TabDTO> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tabs')
    .insert({
      session_id: sessionId,
      title: tab.title,
      url: tab.url,
      tab_index: tab.tabIndex ?? 0,
      window_index: tab.windowIndex ?? 0
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add tab: ${error.message}`);

  return {
    id: data.id,
    sessionId: data.session_id,
    title: data.title,
    url: data.url,
    tabIndex: data.tab_index,
    windowIndex: data.window_index,
    createdAt: data.created_at
  };
}

/**
 * Update a tab
 */
export async function updateTab(tabId: string, patch: UpdateTabRequest): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  if (patch.title !== undefined) updateData.title = patch.title;
  if (patch.url !== undefined) updateData.url = patch.url;
  if (patch.tabIndex !== undefined) updateData.tab_index = patch.tabIndex;
  if (patch.windowIndex !== undefined) updateData.window_index = patch.windowIndex;

  const { error } = await supabase
    .from('tabs')
    .update(updateData)
    .eq('id', tabId);

  if (error) throw new Error(`Failed to update tab: ${error.message}`);
}

/**
 * Delete a tab
 */
export async function deleteTab(tabId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('tabs')
    .delete()
    .eq('id', tabId);

  if (error) throw new Error(`Failed to delete tab: ${error.message}`);
}

// =============================================================================
// COLLABORATION OPERATIONS
// =============================================================================

/**
 * List collaborators for a session
 */
export async function listCollaborators(sessionId: string): Promise<CollaboratorDTO[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('collaborators')
    .select(`
      id,
      session_id,
      user_id,
      role,
      added_at,
      users!collaborators_user_id_fkey(name, email)
    `)
    .eq('session_id', sessionId);

  if (error) throw new Error(`Failed to list collaborators: ${error.message}`);

  return data?.map(collab => ({
    id: collab.id,
    sessionId: collab.session_id,
    userId: collab.user_id,
    userName: collab.users?.[0]?.name,
    userEmail: collab.users?.[0]?.email,
    role: collab.role as CollaboratorRole,
    addedAt: collab.added_at
  })) || [];
}

/**
 * Add a collaborator to a session
 */
export async function addCollaborator(sessionId: string, userId: string, role: CollaboratorRole): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('collaborators')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role
    });

  if (error) throw new Error(`Failed to add collaborator: ${error.message}`);
}

/**
 * Remove a collaborator from a session
 */
export async function removeCollaborator(sessionId: string, userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to remove collaborator: ${error.message}`);
}

// =============================================================================
// INVITE OPERATIONS
// =============================================================================

/**
 * Create an invite for a session
 */
export async function createInvite(
  sessionId: string, 
  role: CollaboratorRole, 
  expiresAt?: string
): Promise<{ inviteCode: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Generate random invite code
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data, error } = await supabase
    .from('invites')
    .insert({
      session_id: sessionId,
      invite_code: inviteCode,
      role,
      created_by: user.id,
      expires_at: expiresAt
    })
    .select('invite_code')
    .single();

  if (error) throw new Error(`Failed to create invite: ${error.message}`);

  return { inviteCode: data.invite_code };
}

/**
 * Accept an invite using invite code
 */
export async function acceptInvite(inviteCode: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Find the invite
  const { data: invite, error: findError } = await supabase
    .from('invites')
    .select('id, session_id, role, expires_at, used')
    .eq('invite_code', inviteCode)
    .single();

  if (findError) throw new Error('Invalid invite code');
  if (invite.used) throw new Error('Invite has already been used');
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error('Invite has expired');
  }

  // Add user as collaborator
  const { error: collabError } = await supabase
    .from('collaborators')
    .insert({
      session_id: invite.session_id,
      user_id: user.id,
      role: invite.role
    });

  if (collabError) {
    if (collabError.code === '23505') { // Unique constraint violation
      throw new Error('You are already a collaborator on this session');
    }
    throw new Error(`Failed to accept invite: ${collabError.message}`);
  }

  // Mark invite as used
  const { error: updateError } = await supabase
    .from('invites')
    .update({ used: true })
    .eq('id', invite.id);

  if (updateError) {
    console.warn('Failed to mark invite as used:', updateError.message);
    // Don't throw here as the collaboration was successful
  }
}
