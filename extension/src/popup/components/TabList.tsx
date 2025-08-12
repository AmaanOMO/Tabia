import React, { useEffect, useRef } from 'react'
import Sortable from 'sortablejs'
import { TabDTO } from '../../common/types'

export default function TabList({
  tabs, onDelete, onReorder
}: {
  tabs: TabDTO[]
  onDelete: (tabId: string) => void
  onReorder: (orderedIds: string[]) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const sortable = Sortable.create(ref.current, {
      animation: 150,
      handle: '.handle',
      onEnd: () => {
        try {
          const ids = Array.from(ref.current!.querySelectorAll('[data-id]'))
            .map(el => (el as HTMLElement).dataset.id!)
            .filter(Boolean)
          onReorder(ids)
        } catch (error) {
          console.error('Error reordering tabs:', error)
        }
      }
    })
    return () => sortable.destroy()
  }, [tabs, onReorder])

  return (
    <div ref={ref} className="space-y-1.5">
      {tabs.map(t => (
        <div key={t.id} data-id={t.id}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
          <span className="handle cursor-grab text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </span>
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
