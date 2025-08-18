import React from 'react'

export function Toast({ text, actionLabel, onAction }: {
  text: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border border-blue-200 p-3 flex items-center justify-between animate-in fade-in-up duration-300">
      <span className="text-sm text-gray-700 font-medium">{text}</span>
      {actionLabel && (
        <button
          onClick={onAction}
          className="ml-3 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-sm hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
