import React, { useEffect, useMemo, useState } from 'react'
import { API } from '../common/api'
import { CreateSessionPayload, SessionDTO, TabDTO } from '../common/types'
import TopButtons from './components/TopButtons'
import SearchBar from './components/SearchBar'
import SessionCard from './components/SessionCard'
import { Toast } from './components/Toast'
import { registerShortcuts } from '../common/shortcuts'
import { logger } from '../common/logger'
// import { upsertSelfUser } from '../auth/supabaseAuth' // REMOVED - contains background code
import { supabase } from './supabaseClient'

type SessionVM = SessionDTO & { scope: 'WINDOW'|'ALL_WINDOWS' }

export default function App() {
  const [user, setUser] = useState<{email: string, photoUrl?: string} | null>(null)
  const [sessions, setSessions] = useState<SessionVM[]>([])
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<null | {text: string, undo?: () => void}>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [booting, setBooting] = useState(true)   // replaces "loading" for initial auth check
  const [dataLoading, setDataLoading] = useState(false) // optional tiny spinner inside list
  const [error, setError] = useState<string | null>(null)
  const [showSignin, setShowSignin] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!alive) return;

        if (!session) {
          setShowSignin(true);
          setBooting(false);      // show the Sign-in screen, not the full spinner
          return;
        }

        // We are authenticated — show the app immediately.
        setShowSignin(false);
        setBooting(false);

        // Load data in background; do NOT flip booting back to true.
        void loadInitialData();
      } catch (e) {
        if (!alive) return;
        console.error('Initial boot failed:', e);
        setShowSignin(true);
        setBooting(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  async function loadInitialData() {
    let alive = true;
    setDataLoading(true);

    try {
      // background ping is fine but ignore failures
      try {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'PING' }, () => resolve(null));
        });
      } catch {}

      // upsert user profile (ignore non-fatal errors)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await supabase.from('users').upsert({
            uid: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            photo_url: user.user_metadata?.avatar_url
          }, { onConflict: 'uid' });
        } catch {}
      }

      const userData = await API.me();           // uses supabase token internally now
      const sessionsData = await API.listSessions();

      if (!alive) return;

      setUser(userData.user);
      setSessions(sessionsData.map(s => ({ ...s, scope: s.isWindowSession ? 'WINDOW' : 'ALL_WINDOWS' })));
      
      // Auto-scroll to newest session
      if (sessionsData.length > 0) {
        setTimeout(() => {
          const newestSession = document.querySelector('[data-session-id]');
          if (newestSession) {
            newestSession.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (err) {
      console.error('loadInitialData error:', err);
      // Don't flip to Sign-in; keep the UI and optionally show a toast
      setToast({ text: 'Could not refresh sessions right now.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      if (alive) setDataLoading(false);
    }

    return () => { alive = false; };
  }

  // Close drawer on ESC
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSessions([])
      setDrawerOpen(false)
      setShowSignin(true)
      setToast({ text: 'Signed out' })
      setTimeout(() => setToast(null), 1500)
    } catch (e) {
      setToast({ text: 'Failed to sign out' })
      setTimeout(() => setToast(null), 2500)
    }
  }

  // Listen for auth state changes and persist session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      chrome.storage.local.set({ session: session || null });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return registerShortcuts({
      onSaveSession: () => handleSaveSession(),
      onSaveTab: handleSaveTab
    })
  }, [sessions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.tabs ?? []).some(t =>
        (t.title?.toLowerCase().includes(q) || t.url.toLowerCase().includes(q))
      )
    )
  }, [sessions, query])

  const capture = async (scope: 'WINDOW' | 'ALL_WINDOWS' | 'ACTIVE_TAB') => {
    try {
      let messageType: string;
      if (scope === 'WINDOW') {
        messageType = 'CAPTURE_CURRENT_WINDOW';
      } else if (scope === 'ALL_WINDOWS') {
        messageType = 'CAPTURE_ALL_WINDOWS';
      } else {
        messageType = 'CAPTURE_ACTIVE_TAB';
      }

      logger.log('📡 Sending message to background script:', { type: messageType })

      const resp = await new Promise<any>((resolve) => {
        try {
          chrome.runtime.sendMessage({
            type: messageType
          }, (r) => {
            const err = chrome.runtime.lastError;
            if (err) resolve({ success: false, error: err.message });
            else resolve(r);
          });
        } catch (e: any) {
          resolve({ success: false, error: String(e?.message || e) });
        }
      });

      logger.log('📡 Response from background script:', resp)

      if (!resp?.success) {
        setToast({ text: resp?.error || 'Failed to capture tabs' })
        setTimeout(() => setToast(null), 3000)
        return null
      }

      // Handle different response formats
      if (scope === 'ACTIVE_TAB') {
        // Single tab response
        if (resp.tab) {
          logger.log('✅ Active tab captured successfully:', resp.tab)
          return resp.tab
        } else {
          setToast({ text: 'No active tab captured' })
          setTimeout(() => setToast(null), 3000)
          return null
        }
      } else {
        // Multiple tabs response (existing behavior)
        if (resp && resp.tabs && resp.tabs.length > 0) {
          logger.log('✅ Tabs captured successfully:', resp.tabs)
          return resp.tabs
        } else {
          setToast({ text: 'No tabs captured' })
          setTimeout(() => setToast(null), 3000)
          return null
        }
      }
    } catch (error) {
      logger.error('❌ Error capturing tabs:', error)
      setToast({ text: 'Failed to capture tabs' })
      setTimeout(() => setToast(null), 3000)
      return null
    }
  }

  const handleSaveSession = async () => {
    try {
      logger.log('🔄 Starting session save...')
      
      const tabs = await capture('WINDOW')
      if (!tabs) return

      // Store the captured tabs for the modal
      setCapturedTabs(tabs)
      setShowSessionNameModal(true)
    } catch (error) {
      logger.error('❌ Error capturing tabs:', error)
      setToast({ text: 'Failed to capture tabs' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return
    
    try {
      logger.log('📝 Creating session with name:', sessionName.trim())
      
      // Create session
      const created = await API.createSession({
        name: sessionName.trim(),
        isWindowSession: true,
        tabs: capturedTabs?.map((tab: Pick<TabDTO,'title'|'url'|'tabIndex'|'windowIndex'>) => ({
          title: tab.title,
          url: tab.url,
          tabIndex: tab.tabIndex,
          windowIndex: tab.windowIndex
        })) || []
      })

      if (created) {
        logger.log('✅ Session created:', created)
        setToast({ text: `Session "${created.name}" saved!` })
        setSessions([{...created, scope: 'WINDOW'}, ...sessions])
        
        // Auto-scroll to the newest session (which is now at the top)
        setTimeout(() => {
          const mainContent = document.querySelector('.overflow-y-auto') as HTMLElement
          if (mainContent) {
            mainContent.scrollTop = 0 // Scroll to top to show newest session
          }
        }, 100) // Small delay to ensure DOM update
        
        setTimeout(() => setToast(null), 2500)
      } else {
        setToast({ text: 'Failed to save session' })
        setTimeout(() => setToast(null), 3000)
      }
      
      // Reset and close modal
      setSessionName('')
      setShowSessionNameModal(false)
      setCapturedTabs(null)
    } catch (error) {
      logger.error('❌ Error creating session:', error)
      setToast({ text: `Failed to save session: ${error instanceof Error ? error.message : String(error)}` })
      setTimeout(() => setToast(null), 5000)
    }
  }

  const [showTabSaveModal, setShowTabSaveModal] = useState(false)
  const [capturedTab, setCapturedTab] = useState<Pick<TabDTO,'title'|'url'|'tabIndex'|'windowIndex'> | null>(null)
  const [showSessionNameModal, setShowSessionNameModal] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [capturedTabs, setCapturedTabs] = useState<Pick<TabDTO,'title'|'url'|'tabIndex'|'windowIndex'>[] | null>(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<SessionVM | null>(null)

  const handleSignInClick = async () => {
    setDataLoading(true);
    setError(null);
    setToast({ text: 'Starting Google sign-in...' });
    
    try {
      const resp = await new Promise<any>((resolve) => {
        try {
          chrome.runtime.sendMessage({ type: 'START_GOOGLE_OAUTH' }, (r) => {
            const err = chrome.runtime.lastError;
            if (err) resolve({ ok: false, error: err.message });
            else resolve(r);
          });
        } catch (e: any) {
          resolve({ ok: false, error: String(e?.message || e) });
        }
      });

      setDataLoading(false);
      if (!resp?.ok) {
        setError(resp?.error || 'Authentication failed.');
        setToast(null);
        return;
      }
      // Success path: onAuthStateChange will fire; as a fallback, read session:
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToast({ text: 'Signed in! Loading your sessions...' });
        void loadInitialData();
        setShowSignin(false);
        setTimeout(() => setToast(null), 2000);
      }
    } catch (error) {
      setDataLoading(false);
      setError('Failed to start authentication. Please try again.');
      setToast(null);
      console.error('Sign-in error:', error);
    }
  };

  const handleSaveTab = async () => {
    try {
      logger.log('📱 Capturing active tab...')
      const tab = await capture('ACTIVE_TAB')
      if (!tab) return

      logger.log('📱 Captured active tab:', tab)

      // Store the captured tab and show session selection modal
      setCapturedTab({
        title: tab.title,
        url: tab.url,
        tabIndex: tab.tabIndex,
        windowIndex: tab.windowIndex
      })
      setShowTabSaveModal(true)
    } catch (error) {
      logger.error('❌ Error capturing tab:', error)
      setToast({ text: 'Failed to capture tab' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const saveTabToSession = async (sessionId: string) => {
    if (!capturedTab) return

    try {
      const newTab = await API.addTab(sessionId, {
        title: capturedTab.title,
        url: capturedTab.url,
        tabIndex: capturedTab.tabIndex,
        windowIndex: capturedTab.windowIndex
      })

      if (newTab) {
        logger.log('✅ Tab added to session:', newTab)
        setToast({ text: 'Tab added to session!' })
        
        // Refresh sessions to show the new tab
        const updatedSessions = await API.listSessions()
        setSessions(updatedSessions.map(s => ({...s, scope: s.isWindowSession ? 'WINDOW' : 'ALL_WINDOWS'})))
        
        setShowTabSaveModal(false)
        setCapturedTab(null)
        setTimeout(() => setToast(null), 2200)
      } else {
        setToast({ text: 'Failed to add tab to session' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (error) {
      logger.error('❌ Error adding tab to session:', error)
      setToast({ text: 'Failed to add tab to session' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  async function openSession(sessionId: string) {
    try {
      logger.log('🔄 Opening session:', sessionId)
      await API.restoreSession(sessionId)
      logger.log('✅ Session restoration message sent to background script')
      setToast({ text: 'Restoring session…' })
      setTimeout(() => setToast(null), 1800)
    } catch (error) {
      logger.error('❌ Error opening session:', error)
      setToast({ text: 'Failed to open session' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  async function toggleStar(sessionId: string, to: boolean) {
    try {
      // Update local state optimistically
      setSessions(sessions.map(s => s.id === sessionId ? ({...s, isStarred: to}) : s))
      
      // Update in Supabase
      await API.updateSession(sessionId, { isStarred: to })
      logger.log('✅ Session starred status updated:', { sessionId, isStarred: to })
    } catch (error) {
      logger.error('❌ Error updating star status:', error)
      // Revert local state on error
      setSessions(sessions.map(s => s.id === sessionId ? ({...s, isStarred: !to}) : s))
      setToast({ text: 'Failed to update session' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  async function deleteSession(sessionId: string) {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setSessionToDelete(session)
      setShowDeleteConfirmModal(true)
    }
  }

  async function confirmDeleteSession() {
    if (!sessionToDelete) return
    
    try {
      await API.deleteSession(sessionToDelete.id)
      setSessions(sessions.filter(s => s.id !== sessionToDelete.id))
      setToast({ text: `Session "${sessionToDelete.name}" deleted` })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      logger.error('❌ Error deleting session:', error)
      setToast({ text: 'Failed to delete session' })
      setTimeout(() => setToast(null), 3000)
    }
    
    // Close modal and reset
    setShowDeleteConfirmModal(false)
    setSessionToDelete(null)
  }

  async function deleteTab(tabId: string) {
    let backup: {sessionId: string, tab: TabDTO} | null = null
    
    // Find the session and tab to backup
    for (const session of sessions) {
      const tab = session.tabs?.find(t => t.id === tabId)
      if (tab) {
        backup = { sessionId: session.id, tab }
        break
      }
    }
    
    // Remove tab from local state
    setSessions(sessions.map(s => ({
      ...s, 
      tabs: (s.tabs ?? []).filter(tt => tt.id !== tabId)
    })))
    
    setToast({
      text: 'Tab removed',
      undo: async () => {
        if (!backup) return
        try {
          await API.addTab(backup.sessionId, {
            title: backup.tab.title, url: backup.tab.url,
            tabIndex: backup.tab.tabIndex, windowIndex: backup.tab.windowIndex
          })
          // refresh
          const ss = await API.listSessions()
          setSessions(ss.map(s => ({...s, scope: s.isWindowSession ? 'WINDOW' : 'ALL_WINDOWS'})))
          setToast(null)
        } catch (error) {
          logger.error('❌ Error restoring tab:', error)
          setToast({ text: 'Failed to restore tab' })
          setTimeout(() => setToast(null), 3000)
        }
      }
    })
    
    try {
      if (backup) {
        await API.deleteTab(backup.sessionId, tabId)
      }
    } catch (error) {
      logger.error('❌ Error deleting tab:', error)
      setToast({ text: 'Failed to delete tab' })
      setTimeout(() => setToast(null), 3000)
    }
    
    setTimeout(() => setToast(null), 5000)
  }

  async function reorderSessions(orderedIds: string[]) {
    // Optimistic local reorder
    const sessionMap = new Map(sessions.map(s => [s.id, s]))
    const reordered = orderedIds.map(id => sessionMap.get(id)!).filter(Boolean)
    setSessions(reordered)
    
    // TODO: Implement API call for session reordering when backend supports it
    // For now, just log the reorder
    logger.log('📋 Sessions reordered locally:', orderedIds)
  }

  // Show booting state
  if (booting) {
    return (
      <div className="w-[420px] h-[570px] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-600 text-sm">Loading Tabia...</div>
        </div>
      </div>
    )
  }



  // Show sign-in state
  if (showSignin) {
    return (
      <div className="w-[420px] h-[570px] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div className="text-gray-800 font-medium text-base mb-2">Welcome to Tabia</div>
          <div className="text-gray-500 text-sm mb-6">Sign in with Google to start managing your tab sessions</div>
          <button
            onClick={handleSignInClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="w-[420px] h-[570px] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-gray-800 font-medium text-sm mb-2">Something went wrong</div>
          <div className="text-gray-500 text-xs mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[420px] h-[570px] bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
              title="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {user?.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            )}
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-wide text-gray-500 font-medium">Signed in</div>
              <div className="text-xs font-semibold text-gray-800">{user?.email || '—'}</div>
            </div>
          </div>
                      <div className="text-right">
              <div className="text-base font-bold text-blue-600">Tabia</div>
            </div>
        </div>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">Menu</div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex items-center gap-3">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Profile" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">T</div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Signed in as</div>
            <div className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{user?.email || '—'}</div>
          </div>
        </div>

        <div className="px-4">
          <button
            onClick={handleSignOut}
            className="w-full mt-3 px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-4 space-y-4 h-full overflow-y-auto">
        <TopButtons
          onSaveSession={handleSaveSession}
          onSaveTab={handleSaveTab}
          onShowHelp={() => setShowHelp(v => !v)}
        />

        <SearchBar q={query} setQ={setQuery} />

        {showHelp ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-800 text-base">How to Use Tabia</div>
            </div>
            <div className="space-y-2 text-gray-600 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div><span className="font-semibold text-gray-800">Save Session</span> → Capture all open tabs in your current window</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div><span className="font-semibold text-gray-800">Save Tab</span> → Save just the current tab to a session</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div><span className="font-semibold text-gray-800">Restore Session</span> → Click a saved session to instantly reopen all tabs</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div><span className="font-semibold text-gray-800">Reorder</span> → Drag and drop sessions to rearrange them</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div><span className="font-semibold text-gray-800">Share</span> → Click the share icon to invite collaborators</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* FAVORITE SESSIONS */}
            {filtered.filter(s => s.isStarred).length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-yellow-400 rounded-full"></div>
                  <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">FAVORITE SESSIONS</div>
                </div>
                <div className="space-y-0">
                  {filtered.filter(s => s.isStarred).map((s, index) => (
                    <div key={s.id}>
                      {/* Blue separator line above */}
                      <div className="h-px bg-blue-200 mb-2"></div>
                      <SessionCard
                        s={s}
                        onOpen={openSession}
                        onToggleStar={toggleStar}
                        onDelete={deleteSession}
                        onDeleteTab={deleteTab}
                        onReorderSessions={reorderSessions}
                        user={user}
                      />
                      {/* Blue separator line below */}
                      <div className="h-px bg-blue-200 mt-2"></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* REGULAR SESSIONS */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-300 rounded-full"></div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SESSIONS</div>
            </div>
            <div className="space-y-0">
              {filtered.filter(s => !s.isStarred).map((s, index) => (
                <div key={s.id}>
                  {/* Blue separator line above */}
                  <div className="h-px bg-blue-200 mb-2"></div>
                  <SessionCard
                    s={s}
                    onOpen={openSession}
                    onToggleStar={toggleStar}
                    onDelete={deleteSession}
                    onDeleteTab={deleteTab}
                    
                    onReorderSessions={reorderSessions}
                    user={user}
                  />
                  {/* Blue separator line below */}
                  <div className="h-px bg-blue-200 mt-2"></div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-gray-500 font-medium text-sm">No sessions yet</div>
                  <div className="text-xs text-gray-400 mt-1">Save your first session to get started</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {toast && (
        <Toast
          text={toast.text}
          actionLabel={toast.undo ? 'Undo' : undefined}
          onAction={toast.undo}
        />
      )}

      {/* Tab Save Modal */}
      {showTabSaveModal && capturedTab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <div className="font-semibold text-gray-800 text-lg">Save Tab</div>
              <div className="text-sm text-gray-500">Select a session to add this tab to</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Tab to save:</div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-800 text-sm truncate">{capturedTab.title}</div>
                <div className="text-xs text-gray-500 truncate">{capturedTab.url}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Choose session:</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No sessions available. Create a session first.
                  </div>
                ) : (
                  sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => saveTabToSession(session.id)}
                      onMouseDown={(e) => {
                        const target = e.currentTarget
                        target.style.transform = 'scale(0.95)'
                        target.style.transition = 'transform 0.1s ease'
                      }}
                      onMouseUp={(e) => {
                        const target = e.currentTarget
                        target.style.transform = 'scale(1)'
                        target.style.transition = 'transform 0.1s ease'
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget
                        target.style.transform = 'scale(1)'
                        target.style.transition = 'transform 0.1s ease'
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {/* Scope Icon */}
                        <div className="flex items-center gap-1">
                          {session.scope === 'WINDOW' ? (
                            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                          ) : (
                            <div className="flex gap-0.5">
                              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-gray-800 text-sm">{session.name}</div>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">
                        {session.tabs?.length || 0} tabs
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTabSaveModal(false)
                  setCapturedTab(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Creation Modal */}
      {showSessionNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-lg">Create Session</div>
                <div className="text-sm text-gray-500">
                  Save current window tabs
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Session name:</div>
              <input
                type="text"
                placeholder="Enter session name..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                autoFocus
              />
            </div>

            {capturedTabs && (
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">
                  Tabs to save ({capturedTabs.length}):
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {capturedTabs.map((tab, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-2">
                      <div className="font-medium text-gray-800 text-xs truncate">{tab.title}</div>
                      <div className="text-xs text-gray-400 truncate">{tab.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSessionNameModal(false)
                  setSessionName('')
                  setCapturedTabs(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="mb-6">
              <div className="font-semibold text-gray-800 text-lg mb-2">Delete Session</div>
              <div className="text-sm text-gray-600">
                Are you sure you want to delete "{sessionToDelete.name}"?
              </div>
              <div className="text-xs text-gray-500 mt-2">
                This action cannot be undone.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false)
                  setSessionToDelete(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={confirmDeleteSession}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
