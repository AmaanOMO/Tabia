import React, { useState } from 'react'
import { SessionDTO, Scope } from '../../common/types'
import ScopeBadge from './ScopeBadge'
import TabList from './TabList'

export default function SessionCard({
  s, onOpen, onToggleStar, onDelete, onDeleteTab, onReorderSessions, user
}: {
  s: SessionDTO & { scope: Scope }
  onOpen: (sessionId: string) => void
  onToggleStar: (sessionId: string, to: boolean) => void
  onDelete: (sessionId: string) => void
  onDeleteTab: (tabId: string) => void
  onReorderSessions?: (orderedIds: string[]) => void
  user?: { email: string, photoUrl?: string } | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  return (
    <div 
      className={`group bg-white rounded-md p-2.5 hover:shadow-sm transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      draggable={!!onReorderSessions}
      onDragStart={(e) => {
        if (onReorderSessions) {
          setIsDragging(true)
          e.dataTransfer.setData('text/plain', s.id)
        }
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        if (onReorderSessions) {
          const draggedId = e.dataTransfer.getData('text/plain')
          // TODO: Implement proper reordering logic
          // For now, just move the dragged session to the top
          onReorderSessions([s.id, draggedId])
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Session Icon - Simple black dot */}
        <div className="w-2 h-2 bg-black rounded-full"></div>
        
        {/* Session Name */}
        <button className="flex-1 text-left group" onClick={() => onOpen(s.id)}>
          <div className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors text-sm">{s.name}</div>
        </button>
        
        {/* Action Buttons - Only visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            title="Star"
            onClick={() => onToggleStar(s.id, !s.isStarred)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
              s.isStarred 
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-yellow-500'
            }`}
          >
            <svg className="w-2.5 h-2.5" fill={s.isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <button
            title="Share session"
            onClick={() => {
              const shareUrl = `${window.location.origin}/share/${s.id}`
              navigator.clipboard.writeText(shareUrl).then(() => {
                // Show toast or notification
                alert('Session link copied to clipboard!')
              }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea')
                textArea.value = shareUrl
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
                alert('Session link copied to clipboard!')
              })
            }}
            className="w-5 h-5 rounded bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors flex items-center justify-center"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-5 h-5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
            title="Show tabs"
          >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
          </button>
          
          <button
            onClick={() => onDelete(s.id)}
            className="w-5 h-5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
            title="Delete session"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && s.tabs && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <TabList
            tabs={s.tabs}
            onDelete={onDeleteTab}
          />
        </div>
      )}
    </div>
  )
}
