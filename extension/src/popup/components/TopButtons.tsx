import React, { useState, useRef, useEffect } from 'react'

export default function TopButtons({
  onSaveSession,
  onSaveTab,
  onShowHelp
}: {
  onSaveSession: () => void
  onSaveTab: () => void
  onShowHelp: () => void
}) {
  const [activeButton, setActiveButton] = useState<string | null>(null)
  const [helpActive, setHelpActive] = useState(false)


  
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onSaveSession}
        onMouseDown={() => setActiveButton('session')}
        onMouseUp={() => setActiveButton(null)}
        onMouseLeave={() => setActiveButton(null)}
        className={`w-24 h-20 bg-white rounded-xl shadow-sm border-2 border-gray-200 flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:scale-105 active:scale-95 ${
          activeButton === 'session' ? 'bg-blue-50 border-blue-400 shadow-md' : ''
        }`}
        title="Save Session"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          activeButton === 'session' ? 'bg-blue-500' : 'bg-blue-100'
        }`}>
          <svg className={`w-4 h-4 transition-colors ${
            activeButton === 'session' ? 'text-white' : 'text-blue-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span className={`text-xs mt-1.5 font-medium transition-colors ${
          activeButton === 'session' ? 'text-blue-700' : 'text-gray-700'
        }`}>Save Session</span>
      </button>

              <button
          onClick={onSaveTab}
          onMouseDown={() => setActiveButton('tab')}
          onMouseUp={() => setActiveButton(null)}
          onMouseLeave={() => setActiveButton(null)}
          className={`w-24 h-20 bg-white rounded-xl shadow-sm border-2 border-gray-200 flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md hover:border-green-300 hover:scale-105 active:scale-95 ${
            activeButton === 'tab' ? 'bg-green-50 border-green-400 shadow-md' : ''
          }`}
          title="Save Tab"
        >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          activeButton === 'tab' ? 'bg-green-500' : 'bg-green-100'
        }`}>
          <svg className={`w-4 h-4 transition-colors ${
            activeButton === 'tab' ? 'text-white' : 'text-green-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 1 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <span className={`text-xs mt-1.5 font-medium transition-colors ${
          activeButton === 'tab' ? 'text-green-700' : 'text-gray-700'
        }`}>Save Tab</span>
      </button>

      <button
        onClick={() => {
          onShowHelp()
          setHelpActive(!helpActive)
        }}
        onMouseDown={() => setActiveButton('help')}
        onMouseUp={() => setActiveButton(null)}
        onMouseLeave={() => setActiveButton(null)}
        className={`w-24 h-20 bg-white rounded-xl shadow-sm border-2 flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md hover:border-purple-300 hover:scale-105 active:scale-95 ${
          helpActive 
            ? 'bg-purple-50 border-purple-400 shadow-md' 
            : 'border-gray-200'
        }`}
        title="How to use"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          helpActive ? 'bg-purple-500' : 'bg-purple-100'
        }`}>
          <svg className={`w-4 h-4 transition-colors ${
            helpActive ? 'text-white' : 'text-purple-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className={`text-xs mt-1.5 font-medium transition-colors ${
          helpActive ? 'text-purple-700' : 'text-gray-700'
        }`}>How to Use</span>
      </button>
    </div>
  )
}
