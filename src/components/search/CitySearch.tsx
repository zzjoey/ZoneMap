import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { City } from '../../types'
import { ALL_CITIES } from '../../data/cities'

interface CitySearchProps {
  existingCityIds: Set<string>
  onAdd: (city: City) => void
  onClose: () => void
}

/**
 * Full-screen overlay city search.
 * - Empty query: shows default cities from local data
 * - Typed query: debounces 250ms, fetches /api/cities/search, falls back to local data
 */
export function CitySearch({ existingCityIds, onAdd, onClose }: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [apiResults, setApiResults] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Debounced API search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (!trimmed) {
      setApiResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setApiResults([])
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities/search?q=${encodeURIComponent(trimmed)}&limit=15`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data: City[] = await res.json()
          setApiResults(data)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setApiResults([])
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      controller.abort()
    }
  }, [query])

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return ALL_CITIES.filter((c) => !existingCityIds.has(c.id)).slice(0, 15)
    }
    // Use API results when available, otherwise fall back to local
    if (apiResults.length > 0) return apiResults
    const q = trimmed.toLowerCase()
    return ALL_CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 15)
  }, [query, apiResults, existingCityIds])

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
          {isLoading ? (
            <svg
              className="text-text-muted flex-shrink-0 animate-spin"
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg
              className="text-text-muted flex-shrink-0"
              width="20" height="20" viewBox="0 0 16 16"
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            >
              <circle cx="6.5" cy="6.5" r="5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          )}
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
                    ${highlighted === i ? 'bg-text-primary/5' : ''}
                    ${alreadyAdded ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer hover:bg-text-primary/5'}
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
