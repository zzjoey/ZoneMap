import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { City } from '../../types'
import { ALL_CITIES } from '../../data/cities'

interface CitySearchProps {
  existingCityIds: Set<string>
  onAdd: (city: City) => void
  onClose: () => void
}

/**
 * Full-screen overlay city search with keyboard navigation.
 * Filters ALL_CITIES by name or country.
 */
export function CitySearch({ existingCityIds, onAdd, onClose }: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const results = query.trim()
    ? ALL_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : ALL_CITIES.filter((c) => !existingCityIds.has(c.id)).slice(0, 12)

  const handleSelect = useCallback(
    (city: City) => {
      if (!existingCityIds.has(city.id)) onAdd(city)
      onClose()
    },
    [existingCityIds, onAdd, onClose]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      const city = results[highlighted]
      if (city) handleSelect(city)
    }
  }

  // Reset highlight when results change
  useEffect(() => setHighlighted(0), [query])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Search panel */}
      <motion.div
        className="relative w-full max-w-lg bg-bg-secondary border border-border rounded-card overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
          <svg
            className="text-text-muted flex-shrink-0"
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="6.5" cy="6.5" r="5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search cities..."
            className="flex-1 bg-transparent text-text-primary text-[17px] font-light
                       placeholder:text-text-muted focus:outline-none"
          />
          <kbd
            onClick={onClose}
            className="text-xs text-text-muted border border-border rounded px-2 py-1 cursor-pointer hover:text-text-secondary font-mono"
          >
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <ul ref={listRef} className="max-h-[26rem] overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-6 py-10 text-center text-base text-text-muted font-light">
              No cities found
            </li>
          ) : (
            results.map((city, i) => {
              const alreadyAdded = existingCityIds.has(city.id)
              return (
                <motion.li
                  key={city.id}
                  onClick={() => !alreadyAdded && handleSelect(city)}
                  className={`
                    flex items-center justify-between px-6 py-3.5
                    transition-colors duration-100
                    ${highlighted === i ? 'bg-white/5' : ''}
                    ${alreadyAdded ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}
                  `}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[16px] font-normal text-text-primary">{city.name}</span>
                    <span className="text-[13px] text-text-muted">{city.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-text-muted font-mono tracking-wide">{city.timezone}</span>
                    {alreadyAdded && (
                      <span className="text-xs text-accent-green bg-accent-green-dim px-2 py-0.5 rounded-full">
                        Added
                      </span>
                    )}
                  </div>
                </motion.li>
              )
            })
          )}
        </ul>

        {/* Footer hint */}
        <div className="border-t border-border px-6 py-3 flex items-center gap-5 text-[11px] text-text-muted">
          <span><kbd className="border border-border rounded px-1.5 py-0.5 font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="border border-border rounded px-1.5 py-0.5 font-mono">↵</kbd> Select</span>
          <span><kbd className="border border-border rounded px-1.5 py-0.5 font-mono">Esc</kbd> Close</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
