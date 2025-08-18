import React from 'react'
import { TabDTO } from '../../common/types'

export default function TabList({
  tabs, onDelete
}: {
  tabs: TabDTO[]
  onDelete: (tabId: string) => void
}) {

  return (
    <div className="space-y-1.5">
      {tabs.map(t => (
        <div key={t.id}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
          <a 
            className="truncate text-xs text-gray-700 hover:text-blue-600 transition-colors flex-1" 
            href={t.url} 
            target="_blank"
            title={t.title || t.url}
          >
            {t.title || t.url}
          </a>
          <button
            onClick={() => onDelete(t.id)}
            className="w-5 h-5 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            title="Remove tab"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
