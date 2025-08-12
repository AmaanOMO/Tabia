import React from 'react'

export default function SearchBar({ q, setQ }: { q: string, setQ: (s: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 px-3 py-2.5 flex items-center gap-2.5 hover:border-blue-300 transition-colors focus-within:border-blue-400 focus-within:shadow-md">
      <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-400 flex-shrink-0">
        <path fill="currentColor" d="m21 20l-5.6-5.6A7.5 7.5 0 1 0 9.5 17a7.4 7.4 0 0 0 4.9-1.8L20 20zM4 9.5A5.5 5.5 0 1 1 9.5 15A5.5 5.5 0 0 1 4 9.5"/>
      </svg>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search sessions or type URL"
        className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400 text-gray-700 font-medium"
      />
    </div>
  )
}
