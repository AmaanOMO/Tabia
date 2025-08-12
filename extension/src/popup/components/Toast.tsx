import React from 'react'

export function Toast({ text, actionLabel, onAction }: {
  text: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="fixed bottom-3 left-3 right-3 mx-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
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
