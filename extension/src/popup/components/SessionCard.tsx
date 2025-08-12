import React, { useState } from 'react'
import { SessionDTO, Scope } from '../../common/types'
import ScopeBadge from './ScopeBadge'
import TabList from './TabList'

export default function SessionCard({
  s, onOpen, onToggleStar, onDelete, onDeleteTab, onReorderTabs
}: {
  s: SessionDTO & { scope: Scope }
  onOpen: (sessionId: string) => void
  onToggleStar: (sessionId: string, to: boolean) => void
  onDelete: (sessionId: string) => void
  onDeleteTab: (tabId: string) => void
  onReorderTabs: (sessionId: string, orderedIds: string[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md hover:scale-[1.02] transition-all duration-200">
      <div className="flex items-center gap-2.5">
        <button className="flex-1 text-left group" onClick={() => onOpen(s.id)}>
          <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm">{s.name}</div>
          <div className="mt-1"><ScopeBadge scope={s.scope} /></div>
        </button>
        
        <div className="flex items-center gap-1.5">
          <button
            title="Star"
            onClick={() => onToggleStar(s.id, !s.isStarred)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              s.isStarred 
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-yellow-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={s.isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
            title="Show tabs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(s.id)}
            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
            title="Delete session"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            onReorder={(ids) => onReorderTabs(s.id, ids)}
          />
        </div>
      )}
    </div>
  )
}
