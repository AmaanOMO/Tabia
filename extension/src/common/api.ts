import type {
  SessionDTO, TabDTO, CreateSessionPayload, CreateTabPayload
} from './types'
import { logger } from './logger'

// Use environment variable for API base URL, fallback to localStorage if not available
const BASE = import.meta.env.VITE_API_BASE

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    logger.log('🌐 API request:', `${BASE}${path}`, init)
    
    // TODO: Implement proper Supabase auth
    const token = localStorage.getItem('supabase_token') ?? ''
    
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        ...(init?.headers || {})
      }
    })
    
    logger.log('🌐 API response status:', res.status)
    
    if (!res.ok) {
      const errorText = await res.text()
      logger.error('🌐 API error:', errorText)
      throw new Error(errorText)
    }
    
    const data = await res.json()
    logger.log('🌐 API response data:', data)
    return data
    
  } catch (error) {
    logger.error('🌐 API request failed:', error)
    
    // If it's a network error (Supabase not available), provide a helpful message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Supabase API not available. Please check your internet connection.`)
    }
    
    throw error
  }
}

// Fallback to localStorage when API is not available
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

const LocalStorageAPI = {
  me: async (): Promise<{user: {email: string, photoUrl?: string}}> => {
    return { user: { email: 'student@university.edu' } }
  },

  listSessions: async (): Promise<SessionDTO[]> => {
    const sessions = localStorage.getItem('tabia_sessions')
    return sessions ? JSON.parse(sessions) : []
  },

  createSession: async (payload: CreateSessionPayload): Promise<SessionDTO> => {
    const session: SessionDTO = {
      id: generateId(),
      name: payload.name,
      isStarred: false,
      isWindowSession: payload.isWindowSession,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      tabs: payload.tabs.map(tab => ({
        ...tab,
        id: generateId(),
        createdAt: getCurrentTimestamp()
      }))
    }
    
    const sessions = await LocalStorageAPI.listSessions()
    sessions.unshift(session)
    localStorage.setItem('tabia_sessions', JSON.stringify(sessions))
    
    return session
  },

  deleteSession: async (sessionId: string) => {
    const sessions = await LocalStorageAPI.listSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)
    localStorage.setItem('tabia_sessions', JSON.stringify(filtered))
  },

  starSession: async (sessionId: string, isStarred: boolean) => {
    const sessions = await LocalStorageAPI.listSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.isStarred = isStarred
      session.updatedAt = getCurrentTimestamp()
      localStorage.setItem('tabia_sessions', JSON.stringify(sessions))
    }
  },

  addTab: async (sessionId: string, tab: CreateTabPayload): Promise<TabDTO> => {
    const sessions = await LocalStorageAPI.listSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')
    
    const newTab: TabDTO = {
      ...tab,
      id: generateId(),
      title: tab.title || 'Untitled Tab', // Ensure title is always a string
      createdAt: getCurrentTimestamp()
    }
    
    if (!session.tabs) session.tabs = []
    session.tabs.push(newTab)
    session.updatedAt = getCurrentTimestamp()
    
    localStorage.setItem('tabia_sessions', JSON.stringify(sessions))
    return newTab
  },

  deleteTab: async (tabId: string) => {
    const sessions = await LocalStorageAPI.listSessions()
    for (const session of sessions) {
      if (session.tabs) {
        const tabIndex = session.tabs.findIndex(t => t.id === tabId)
        if (tabIndex !== -1) {
          session.tabs.splice(tabIndex, 1)
          session.updatedAt = getCurrentTimestamp()
          localStorage.setItem('tabia_sessions', JSON.stringify(sessions))
          break
        }
      }
    }
  },

  reorderTabs: async (sessionId: string, orderedTabIds: string[]) => {
    const sessions = await LocalStorageAPI.listSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (!session || !session.tabs) return
    
    const reorderedTabs: TabDTO[] = []
    for (const tabId of orderedTabIds) {
      const tab = session.tabs.find(t => t.id === tabId)
      if (tab) reorderedTabs.push(tab)
    }
    
    session.tabs = reorderedTabs
    session.updatedAt = getCurrentTimestamp()
    localStorage.setItem('tabia_sessions', JSON.stringify(sessions))
  },

  restoreSession: async (sessionId: string) => {
    const sessions = await LocalStorageAPI.listSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (!session || !session.tabs) return
    
    // Group tabs by window
    const tabsByWindow = new Map<number, string[]>()
    for (const tab of session.tabs) {
      if (!tabsByWindow.has(tab.windowIndex)) {
        tabsByWindow.set(tab.windowIndex, [])
      }
      tabsByWindow.get(tab.windowIndex)!.push(tab.url)
    }
    
    // Create windows for each group
    for (const [windowIndex, urls] of tabsByWindow) {
      if (urls.length > 0) {
        await chrome.windows.create({ url: urls })
      }
    }
  }
}

export const API = {
  me: async (): Promise<{user: {email: string, photoUrl?: string}}> => {
    if (!BASE) {
      logger.log('🔄 No API base URL, using localStorage for user data')
      return LocalStorageAPI.me()
    }
    try {
      return await req('/me', 'GET' as any)
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for user data')
      return LocalStorageAPI.me()
    }
  },

  listSessions: async (): Promise<SessionDTO[]> => {
    if (!BASE) {
      logger.log('🔄 No API base URL, using localStorage for sessions')
      return LocalStorageAPI.listSessions()
    }
    try {
      return await req('/sessions', 'GET' as any)
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for sessions')
      return LocalStorageAPI.listSessions()
    }
  },

  createSession: async (payload: CreateSessionPayload): Promise<SessionDTO> => {
    if (!BASE) {
      logger.log('🔄 No API base URL, using localStorage for session creation')
      return LocalStorageAPI.createSession(payload)
    }
    try {
      return await req('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for session creation')
      return LocalStorageAPI.createSession(payload)
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await req(`/sessions/${sessionId}`, { method: 'DELETE' })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for session deletion')
      return LocalStorageAPI.deleteSession(sessionId)
    }
  },

  starSession: async (sessionId: string, starred: boolean): Promise<void> => {
    try {
      await req(`/sessions/${sessionId}/star`, {
        method: 'PATCH',
        body: JSON.stringify({ starred })
      })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for session starring')
      return LocalStorageAPI.starSession(sessionId, starred)
    }
  },

  addTab: async (sessionId: string, payload: CreateTabPayload): Promise<TabDTO> => {
    try {
      return await req(`/sessions/${sessionId}/tabs`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for tab addition')
      return LocalStorageAPI.addTab(sessionId, payload)
    }
  },

  deleteTab: async (sessionId: string, tabId: string): Promise<void> => {
    try {
      await req(`/sessions/${sessionId}/tabs/${tabId}`, { method: 'DELETE' })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for tab deletion')
      return LocalStorageAPI.deleteTab(tabId)
    }
  },

  reorderTabs: async (sessionId: string, tabIds: string[]): Promise<void> => {
    try {
      await req(`/sessions/${sessionId}/tabs/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ tabIds })
      })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for tab reordering')
      return LocalStorageAPI.reorderTabs(sessionId, tabIds)
    }
  },

  restoreSession: async (sessionId: string): Promise<void> => {
    try {
      const session = await req(`/sessions/${sessionId}`, 'GET' as any)
      await req(`/sessions/${sessionId}/restore`, { method: 'POST' })
    } catch (error) {
      logger.log('🔄 Falling back to localStorage for session restoration')
      return LocalStorageAPI.restoreSession(sessionId)
    }
  }
}
