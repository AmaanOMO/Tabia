export function registerShortcuts(opts: {
  onSaveSession: () => void
  onSaveTab: () => void
}) {
  const handler = (e: KeyboardEvent) => {
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault()
      opts.onSaveSession()
    }
    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault()
      opts.onSaveTab()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
