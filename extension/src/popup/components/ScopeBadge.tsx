import React from 'react'
import { Scope } from '../../common/types'

export default function ScopeBadge({ scope }: { scope: Scope }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      {scope === 'ALL_WINDOWS' ? (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" className="flex-shrink-0">
            <path fill="currentColor" d="M3 5h13v10H3z"/>
            <path fill="currentColor" d="M8 9h13v10H8z" opacity=".5"/>
          </svg>
          All windows
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" className="flex-shrink-0">
            <path fill="currentColor" d="M3 5h18v14H3z"/>
          </svg>
          This window
        </>
      )}
    </span>
  )
}
