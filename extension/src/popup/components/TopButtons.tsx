import React, { useState, useRef, useEffect } from 'react'

export default function TopButtons({
  onSaveSessionScope,
  onSaveTab,
  onShowHelp
}: {
  onSaveSessionScope: (scope: 'WINDOW'|'ALL_WINDOWS') => void
  onSaveTab: () => void
  onShowHelp: () => void
}) {
  const [open, setOpen] = useState(false)
  const [activeButton, setActiveButton] = useState<string | null>(null)
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false)
  const [helpActive, setHelpActive] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-close dropdown when mouse leaves both button and dropdown
  useEffect(() => {
    if (!open) return

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        if (!isHoveringDropdown) {
          setOpen(false)
        }
      }, 100) // Reduced delay for better responsiveness
    }

    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    const button = buttonRef.current
    const dropdown = dropdownRef.current

    if (button) {
      button.addEventListener('mouseleave', handleMouseLeave)
      button.addEventListener('mouseenter', handleMouseEnter)
    }

    if (dropdown) {
      dropdown.addEventListener('mouseleave', handleMouseLeave)
      dropdown.addEventListener('mouseenter', handleMouseEnter)
    }

    return () => {
      if (button) {
        button.removeEventListener('mouseleave', handleMouseLeave)
        button.removeEventListener('mouseenter', handleMouseEnter)
      }
      if (dropdown) {
        dropdown.removeEventListener('mouseleave', handleMouseLeave)
        dropdown.removeEventListener('mouseenter', handleMouseEnter)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [open, isHoveringDropdown])
  
  return (
    <div className="flex gap-3 justify-center">
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setOpen(v => !v)}
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
        
        {open && (
          <>
            {/* Safe zone bridge between button and dropdown */}
            <div 
              className="absolute z-10 w-24 h-2 bg-transparent"
              onMouseEnter={() => setIsHoveringDropdown(true)}
              onMouseLeave={() => setIsHoveringDropdown(false)}
            />
            
            <div 
              ref={dropdownRef}
              className="absolute z-10 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 p-3"
              onMouseEnter={() => setIsHoveringDropdown(true)}
              onMouseLeave={() => setIsHoveringDropdown(false)}
            >
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-200 text-sm text-gray-700 hover:text-blue-700"
                onClick={() => { setOpen(false); onSaveSessionScope('WINDOW') }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Save current window</span>
                </div>
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-200 text-sm text-gray-700 hover:text-blue-700"
                onClick={() => { setOpen(false); onSaveSessionScope('ALL_WINDOWS') }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Save all windows</span>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

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
