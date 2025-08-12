import React, { useEffect, useMemo, useState } from 'react'
import { API } from '../common/api'
import { CreateSessionPayload, SessionDTO, TabDTO } from '../common/types'
import TopButtons from './components/TopButtons'
import SearchBar from './components/SearchBar'
import SessionCard from './components/SessionCard'
import { Toast } from './components/Toast'
import { registerShortcuts } from '../common/shortcuts'
import { logger } from '../common/logger'

type SessionVM = SessionDTO & { scope: 'WINDOW'|'ALL_WINDOWS' }

export default function App() {
  const [user, setUser] = useState<{email: string, photoUrl?: string} | null>(null)
  const [sessions, setSessions] = useState<SessionVM[]>([])
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<null | {text: string, undo?: () => void}>(null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    API.me().then(r => setUser(r.user)).catch(() => {})
    API.listSessions().then((ss: SessionDTO[]) => {
      setSessions(ss.map(s => ({...s, scope: s.isWindowSession ? 'WINDOW' : 'ALL_WINDOWS'})))
    })
  }, [])

  useEffect(() => {
    return registerShortcuts({
      onSaveSession: () => handleSaveSession('WINDOW'),
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

  const capture = async (scope: 'WINDOW' | 'ALL_WINDOWS') => {
    try {
      logger.log('📡 Sending message to background script:', {
        type: scope === 'WINDOW' ? 'CAPTURE_CURRENT_WINDOW' : 'CAPTURE_ALL_WINDOWS'
      })

      const resp = await chrome.runtime.sendMessage({
        type: scope === 'WINDOW' ? 'CAPTURE_CURRENT_WINDOW' : 'CAPTURE_ALL_WINDOWS'
      })

      logger.log('📡 Response from background script:', resp)
      logger.log('📡 Chrome runtime error:', chrome.runtime.lastError)

      if (chrome.runtime.lastError) {
        setToast({ text: chrome.runtime.lastError.message || 'Failed to capture tabs' })
        setTimeout(() => setToast(null), 3000)
        return null
      }

      if (resp && resp.tabs && resp.tabs.length > 0) {
        logger.log('✅ Tabs captured successfully:', resp.tabs)
        return resp.tabs
      } else {
        setToast({ text: 'No tabs captured' })
        setTimeout(() => setToast(null), 3000)
        return null
      }
    } catch (error) {
      logger.error('❌ Error capturing tabs:', error)
      setToast({ text: 'Failed to capture tabs' })
      setTimeout(() => setToast(null), 3000)
      return null
    }
  }

  const handleSaveSession = async (scope: 'WINDOW' | 'ALL_WINDOWS') => {
    try {
      logger.log('🔄 Starting session save...', { scope })
      
      const tabs = await capture(scope)
      if (!tabs) return

      const name = prompt('Tabia: Smart Tab Session Manager\n\nEnter a name for this session:')
      if (!name) {
        logger.log('❌ No session name provided')
        setToast({ text: 'Session name is required' })
        return
      }

      logger.log('📝 Session name:', name)

      // Create session
      const created = await API.createSession({
        name,
        isWindowSession: scope === 'WINDOW',
        tabs: tabs.map((tab: Pick<TabDTO,'title'|'url'|'tabIndex'|'windowIndex'>) => ({
          title: tab.title,
          url: tab.url,
          tabIndex: tab.tabIndex,
          windowIndex: tab.windowIndex
        }))
      })

      if (created) {
        logger.log('✅ Session created:', created)
        setToast({ text: `Session "${created.name}" saved!` })
        setSessions([{...created, scope}, ...sessions])
        setTimeout(() => setToast(null), 2500)
      } else {
        setToast({ text: 'Failed to save session' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (error) {
      logger.error('❌ Error saving session:', error)
      setToast({ text: `Failed to save session: ${error instanceof Error ? error.message : String(error)}` })
      setTimeout(() => setToast(null), 5000)
    }
  }

  const [showTabSaveModal, setShowTabSaveModal] = useState(false)
  const [capturedTab, setCapturedTab] = useState<Pick<TabDTO,'title'|'url'|'tabIndex'|'windowIndex'> | null>(null)

  const handleSaveTab = async () => {
    try {
      logger.log('📱 Capturing tabs...')
      const tabs = await capture('WINDOW')
      if (!tabs) return

      logger.log('📱 Captured tabs:', tabs)
      if (tabs.length === 0) {
        logger.log('❌ No tabs captured')
        setToast({ text: 'No tabs to save' })
        setTimeout(() => setToast(null), 3000)
        return
      }

      // Store the captured tab and show session selection modal
      setCapturedTab({
        title: tabs[0].title,
        url: tabs[0].url,
        tabIndex: tabs[0].tabIndex,
        windowIndex: tabs[0].windowIndex
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
    await API.restoreSession(sessionId)
    setToast({ text: 'Restoring session…' })
    setTimeout(() => setToast(null), 1800)
  }

  async function toggleStar(sessionId: string, to: boolean) {
    await API.starSession(sessionId, to)
    setSessions(sessions.map(s => s.id === sessionId ? ({...s, isStarred: to}) : s))
  }

  async function deleteSession(sessionId: string) {
    const removed = sessions.find(s => s.id === sessionId)
    setSessions(sessions.filter(s => s.id !== sessionId))
    setToast({
      text: `Session deleted`,
      undo: async () => {
        if (!removed) return
        // naive undo: recreate from existing data
        const recreated = await API.createSession({
          name: removed.name,
          isWindowSession: removed.scope === 'WINDOW',
          tabs: (removed.tabs ?? []).map(t => ({
            title: t.title, url: t.url, tabIndex: t.tabIndex, windowIndex: t.windowIndex
          }))
        })
        setSessions([ { ...recreated, scope: removed.scope }, ...sessions ])
        setToast(null)
      }
    })
    await API.deleteSession(sessionId)
    setTimeout(() => setToast(null), 5000)
  }

  async function deleteTab(tabId: string) {
    let backup: {sessionId: string, tab: TabDTO} | null = null
    setSessions(sessions.map(s => {
      const t = (s.tabs ?? []).find(tt => tt.id === tabId)
      if (t) backup = { sessionId: s.id, tab: t }
      return {...s, tabs: (s.tabs ?? []).filter(tt => tt.id !== tabId)}
    }))
    setToast({
      text: 'Tab removed',
      undo: async () => {
        if (!backup) return
        await API.addTab(backup.sessionId, {
          title: backup.tab.title, url: backup.tab.url,
          tabIndex: backup.tab.tabIndex, windowIndex: backup.tab.windowIndex
        })
        // refresh
        const ss = await API.listSessions()
        setSessions(ss.map(s => ({...s, scope: s.isWindowSession ? 'WINDOW' : 'ALL_WINDOWS'})))
        setToast(null)
      }
    })
    await API.deleteTab(tabId)
    setTimeout(() => setToast(null), 5000)
  }

  async function reorderTabs(sessionId: string, orderedIds: string[]) {
    await API.reorderTabs(sessionId, orderedIds)
    // optimistic local reorder
    setSessions(sessions.map(s => {
      if (s.id !== sessionId || !s.tabs) return s
      const map = new Map(s.tabs.map(t => [t.id, t]))
      const reordered = orderedIds.map(id => map.get(id)!).filter(Boolean)
      return {...s, tabs: reordered}
    }))
  }

  async function reorderSessions(orderedIds: string[]) {
    // Optimistic local reorder
    const sessionMap = new Map(sessions.map(s => [s.id, s]))
    const reordered = orderedIds.map(id => sessionMap.get(id)!).filter(Boolean)
    setSessions(reordered)
    
    // TODO: Implement API call for session reordering when backend supports it
    // await API.reorderSessions(orderedIds)
  }

  return (
    <div className="min-h-[500px] bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-wide text-gray-500 font-medium">Signed in</div>
              <div className="text-xs font-semibold text-gray-800">{user?.email || '—'}</div>
            </div>
          </div>
          <div className="text-base font-bold text-blue-600">Tabia</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-4 space-y-4">
        <TopButtons
          onSaveSessionScope={handleSaveSession}
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
                <div className="space-y-2">
                  {filtered.filter(s => s.isStarred).map(s => (
                    <SessionCard
                      key={s.id}
                      s={s}
                      onOpen={openSession}
                      onToggleStar={toggleStar}
                      onDelete={deleteSession}
                      onDeleteTab={deleteTab}
                      onReorderTabs={reorderTabs}
                      onReorderSessions={reorderSessions}
                      user={user}
                    />
                  ))}
                </div>
              </>
            )}

            {/* REGULAR SESSIONS */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-300 rounded-full"></div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SESSIONS</div>
            </div>
            <div className="space-y-2">
              {filtered.filter(s => !s.isStarred).map(s => (
                <SessionCard
                  key={s.id}
                  s={s}
                  onOpen={openSession}
                  onToggleStar={toggleStar}
                  onDelete={deleteSession}
                  onDeleteTab={deleteTab}
                  onReorderTabs={reorderTabs}
                  onReorderSessions={reorderSessions}
                  user={user}
                />
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 1 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-lg">Save Tab</div>
                <div className="text-sm text-gray-500">Select a session to add this tab to</div>
              </div>
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
    </div>
  )
}
