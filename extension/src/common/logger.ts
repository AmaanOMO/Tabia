// Custom logger that won't be stripped out in production builds
export const logger = {
  log: (...args: any[]) => {
    // Use window.console.log if available, otherwise create a fallback
    if (typeof window !== 'undefined' && window.console && typeof window.console.log === 'function') {
      window.console.log(...args)
    } else {
      // Fallback: append to a div or use alert for debugging
      try {
        const debugDiv = document.getElementById('debug-log') || createDebugDiv()
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
        debugDiv.innerHTML += `<div>${new Date().toISOString()}: ${message}</div>`
        debugDiv.scrollTop = debugDiv.scrollHeight
      } catch (e) {
        // Last resort: use alert
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(`Debug: ${args.join(' ')}`)
        }
      }
    }
  },
  
  error: (...args: any[]) => {
    if (typeof window !== 'undefined' && window.console && typeof window.console.error === 'function') {
      window.console.error(...args)
    } else {
      logger.log('ERROR:', ...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (typeof window !== 'undefined' && window.console && typeof window.console.warn === 'function') {
      window.console.warn(...args)
    } else {
      logger.log('WARN:', ...args)
    }
  }
}

function createDebugDiv(): HTMLElement {
  const div = document.createElement('div')
  div.id = 'debug-log'
  
  // Set styles individually to avoid template literal issues
  div.style.position = 'fixed'
  div.style.top = '10px'
  div.style.right = '10px'
  div.style.width = '300px'
  div.style.height = '200px'
  div.style.background = 'rgba(0,0,0,0.8)'
  div.style.color = 'white'
  div.style.fontFamily = 'monospace'
  div.style.fontSize = '12px'
  div.style.padding = '10px'
  div.style.overflowY = 'auto'
  div.style.zIndex = '10000'
  div.style.borderRadius = '5px'
  
  if (typeof document !== 'undefined' && document.body) {
    document.body.appendChild(div)
  }
  
  return div
}
