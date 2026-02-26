import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface ProductHuntModalProps {
  onClose: () => void
}

const PH_URL =
  'https://www.producthunt.com/products/zonemap?embed=true&utm_source=embed&utm_medium=post_embed'
const PH_LOGO =
  'https://ph-files.imgix.net/0a8a113f-58ee-45dc-8c91-4fe2a00017b2.png?auto=format&fit=crop&w=80&h=80'

export function ProductHuntModal({ onClose }: ProductHuntModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 cursor-default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <motion.div
        className="relative w-full max-w-lg bg-bg-secondary border border-border rounded-2xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#ff6154] via-[#ff9543] to-[#ff6154]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-text-primary/10 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-2 flex flex-col items-center text-center">
          <img
            alt="ZoneMap"
            src={PH_LOGO}
            className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-1 ring-white/10"
          />
          <h3 className="mt-5 text-[22px] font-bold text-text-primary tracking-tight">
            ZoneMap is on Product Hunt!
          </h3>
          <p className="mt-2 text-[15px] text-text-muted leading-relaxed max-w-xs">
            Stop Googling "what time is it in Tokyo" Visualize every timezone at a glance.
          </p>
        </div>

        {/* CTA */}
        <div className="px-8 pt-5 pb-8 flex flex-col items-center gap-3">
          <a
            href={PH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2.5 px-7 py-3
              bg-[#ff6154] hover:bg-[#e8564a] active:scale-[0.97] text-white
              rounded-xl text-[15px] font-semibold
              transition-all duration-150
              shadow-lg shadow-[#ff6154]/25
            "
          >
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path
                d="M22.667 20H17.333V13.333H22.667C24.507 13.333 26 14.827 26 16.667C26 18.507 24.507 20 22.667 20Z"
                fill="white"
              />
              <path
                d="M20 0C8.953 0 0 8.953 0 20C0 31.047 8.953 40 20 40C31.047 40 40 31.047 40 20C40 8.953 31.047 0 20 0ZM22.667 24H17.333V30H13.333V10H22.667C26.713 10 30 13.287 30 16.667C30 20.047 26.713 23.333 22.667 24Z"
                fill="white"
              />
            </svg>
            Check it out on Product Hunt
          </a>
          <button
            onClick={onClose}
            className="text-[13px] text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
