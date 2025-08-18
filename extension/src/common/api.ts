import type {
  SessionDTO, TabDTO, CreateSessionPayload, CreateTabPayload
} from './types'
import { logger } from './logger'
import { supabase } from '../popup/supabaseClient'

const BASE = import.meta.env.VITE_API_BASE

if (!BASE) {
  throw new Error('VITE_API_BASE environment variable is required. Please configure your Supabase URL.')
}

async function req<T>(path: string, init?: RequestInit | string): Promise<T> {
  // normalize init
  const opts: RequestInit = typeof init === 'string' ? { method: init } : (init ?? {});

  // get token from supabase (more reliable than localStorage)
  let token = '';
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || '';
  } catch {}

  const method = (opts.method || 'GET').toUpperCase();
  const hasBody = !!opts.body;

  const headers = new Headers(opts.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Ask PostgREST to return rows when we need them
  if (hasBody) {
    // Will return inserted/updated rows so you can JSON-parse them
    headers.set('Prefer', 'return=representation');
  }

  logger.log('🌐 API request:', `${BASE}${path}`, { ...opts, headers: Object.fromEntries(headers.entries()) })

  const res = await fetch(`${BASE}${path}`, { 
    ...opts, 
    headers,
    // keep the request running even if the popup closes
    keepalive: true,
  });

  logger.log('🌐 API response status:', res.status)
  
  if (!res.ok) {
    const errText = await res.text().catch(() => `${res.status} ${res.statusText}`);
    logger.error('🌐 API error:', errText)
    throw new Error(errText || `${res.status} ${res.statusText}`);
  }

  // 204/205 → no body
  if (res.status === 204 || res.status === 205) {
    // @ts-expect-error T can be void
    return undefined;
  }

  // Some 200/201 responses may still be empty
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // @ts-expect-error allow void
    return undefined;
  }

  const data = await res.json() as T;
  logger.log('🌐 API response data:', data)
  return data;
}

// ---------------------------------------------
// Helpers: map DB rows (snake_case) -> DTO (camelCase)
// ---------------------------------------------
function mapTabRow(db: any): TabDTO {
  return {
    id: db.id,
    title: db.title ?? '',
    url: db.url,
    tabIndex: db.tab_index ?? 0,
    windowIndex: db.window_index ?? 0,
    createdAt: db.created_at ?? ''
  }
}

function mapSessionRow(db: any): SessionDTO {
  const tabs = Array.isArray(db.tabs) ? db.tabs.map(mapTabRow) : undefined
  return {
    id: db.id,
    name: db.name,
    isStarred: db.is_starred ?? false,
    isWindowSession: db.is_window_session ?? false,
    createdAt: db.created_at ?? '',
    updatedAt: db.updated_at ?? '',
    tabs
  }
}

function mapSessionUpdateToDb(updates: Partial<SessionDTO>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (typeof updates.name !== 'undefined') out.name = updates.name
  if (typeof updates.isStarred !== 'undefined') out.is_starred = updates.isStarred
  if (typeof updates.isWindowSession !== 'undefined') out.is_window_session = updates.isWindowSession
  // Do not allow client to set created/updated timestamps directly
  return out
}

// Main API - Supabase only
export const API = {
  me: async (): Promise<{user: {email: string, photoUrl?: string}}> => {
    try {
      const result = await req('/user_profile?select=*', { method: 'GET' }) as any[]
      if (result && result.length > 0) {
        const user = result[0] as any
        return { user: { email: user.email, photoUrl: user.photo_url } }
      }
      // If no user found, return default user for development
      return { user: { email: 'developer@tabia.local', photoUrl: undefined } }
    } catch (error) {
      logger.error('❌ Failed to fetch user profile:', error)
      throw new Error('Unable to load user profile. Please try again.')
    }
  },

  listSessions: async (): Promise<SessionDTO[]> => {
    try {
      // Pull sessions with nested tabs so the UI can show counts immediately
      const rows = await req<any[]>(`/sessions?select=*,tabs(*)&order=updated_at.desc`, { method: 'GET' })
      return (rows || []).map(mapSessionRow)
    } catch (error) {
      logger.error('❌ Failed to fetch sessions:', error)
      throw new Error('Unable to load sessions. Please try again.')
    }
  },

  createSession: async (payload: CreateSessionPayload): Promise<SessionDTO> => {
    try {
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        logger.error('❌ Authentication error:', authError)
        throw new Error('User not authenticated. Please sign in first.')
      }

      // 1) Create the session (return inserted row)
      const [sessionDb] = await req<any[]>('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          owner_id: user.id, // Use real user ID from Supabase Auth
          is_window_session: payload.isWindowSession
        })
      })
      let session = mapSessionRow(sessionDb)

      // 2) Bulk insert tabs in one call (if any)
      let createdTabs: TabDTO[] = [];
      if (payload.tabs && payload.tabs.length > 0) {
        const tabRows = payload.tabs.map((tab, i) => ({
          session_id: session.id,
          title: tab.title || '',
          url: tab.url,
          tab_index: tab.tabIndex ?? i,
          window_index: tab.windowIndex ?? 0,
        }));

        const createdTabsDb = await req<any[]>('/tabs', {
          method: 'POST',
          body: JSON.stringify(tabRows),
        });
        createdTabs = createdTabsDb.map(mapTabRow);
      }

      return { ...session, tabs: createdTabs };
    } catch (error) {
      logger.error('❌ Failed to create session:', error)
      throw new Error('Unable to save session. Please try again.')
    }
  },

  updateSession: async (sessionId: string, updates: Partial<SessionDTO>): Promise<SessionDTO> => {
    try {
      const rows = await req<any[]>(`/sessions?id=eq.${encodeURIComponent(sessionId)}` , {
        method: 'PATCH',
        body: JSON.stringify(mapSessionUpdateToDb(updates))
      })
      if (!rows?.length) throw new Error('Session not found')
      return mapSessionRow(rows[0])
    } catch (error) {
      logger.error('❌ Failed to update session:', error)
      throw new Error('Unable to update session. Please try again.')
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await req<void>(`/sessions?id=eq.${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
    } catch (error) {
      logger.error('❌ Failed to delete session:', error)
      throw new Error('Unable to delete session. Please try again.')
    }
  },

  addTab: async (sessionId: string, payload: CreateTabPayload): Promise<TabDTO> => {
    try {
      const tabDb = await req<any>('/tabs', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          title: payload.title || '',
          url: payload.url,
          tab_index: payload.tabIndex,
          window_index: payload.windowIndex
        })
      })
      return mapTabRow(tabDb)
    } catch (error) {
      logger.error('❌ Failed to add tab:', error)
      throw new Error('Unable to add tab. Please try again.')
    }
  },

  deleteTab: async (sessionId: string, tabId: string): Promise<void> => {
    try {
      await req<void>(`/tabs?id=eq.${encodeURIComponent(tabId)}`, { method: 'DELETE' })
    } catch (error) {
      logger.error('❌ Failed to delete tab:', error)
      throw new Error('Unable to delete tab. Please try again.')
    }
  },

  restoreSession: async (sessionId: string): Promise<void> => {
    try {
      const rows = await req<any[]>(`/sessions?select=*,tabs(*)&id=eq.${encodeURIComponent(sessionId)}`, { method: 'GET' })
      if (!rows?.length) {
        throw new Error('Session not found or has no tabs')
      }
      const session = mapSessionRow(rows[0])
      if (!session.tabs || session.tabs.length === 0) {
        throw new Error('Session not found or has no tabs')
      }
      
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({
            type: 'RESTORE_SESSION',
            tabs: session.tabs
          }, (r) => {
            const err = chrome.runtime.lastError;
            if (err) reject(new Error(err.message));
            else if (r?.success) resolve();
            else reject(new Error('Failed to restore session'));
          });
        } catch (e: any) {
          reject(new Error(String(e?.message || e)));
        }
      });
    } catch (error) {
      logger.error('❌ Failed to restore session:', error)
      throw new Error('Unable to restore session. Please try again.')
    }
  }
}
