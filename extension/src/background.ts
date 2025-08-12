// Inline logger to avoid import issues in service worker
const logger = {
  log: (...args: any[]) => {
    if (typeof window !== 'undefined' && window.console && typeof window.console.log === 'function') {
      window.console.log(...args)
    }
  },
  error: (...args: any[]) => {
    if (typeof window !== 'undefined' && window.console && typeof window.console.error === 'function') {
      window.console.error(...args)
    }
  }
}

logger.log('🚀 Background script loaded successfully')

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  logger.log('📨 Message received in background script:', msg)

  ;(async () => {
    try {
      if (msg.type === 'CAPTURE_CURRENT_WINDOW') {
        logger.log('📱 Capturing current window...')
        const active = await chrome.windows.getCurrent({ populate: true })
        logger.log('📱 Current window:', active)
        const tabs = (active.tabs ?? []).map((t, idx) => ({
          title: t.title ?? '',
          url: t.url ?? '',
          tabIndex: idx,
          windowIndex: 0
        }))
        logger.log('📱 Captured tabs:', tabs)
        sendResponse({ tabs, scope: 'WINDOW' })
      }

      if (msg.type === 'CAPTURE_ALL_WINDOWS') {
        logger.log('📱 Capturing all windows...')
        const wins = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] })
        logger.log('📱 All windows:', wins)
        const tabs = wins.flatMap((w, wIdx) =>
          (w.tabs ?? []).map((t, idx) => ({
            title: t.title ?? '',
            url: t.url ?? '',
            tabIndex: idx,
            windowIndex: wIdx
          }))
        )
        logger.log('📱 Captured tabs:', tabs)
        sendResponse({ tabs, scope: 'ALL_WINDOWS' })
      }

      if (msg.type === 'RESTORE_MULTI_WINDOW') {
        logger.log('🔄 Restoring multi-window session...')
        for (const group of msg.windows as string[][]) {
          await chrome.windows.create({ url: group })
        }
        sendResponse({ ok: true })
      }
    } catch (error) {
      logger.error('❌ Background script error:', error)
      sendResponse({ error: error instanceof Error ? error.message : String(error) })
    }
  })()

  return true
})
