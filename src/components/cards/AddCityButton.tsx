import { motion } from 'framer-motion'

interface AddCityButtonProps {
  onClick: () => void
}

/**
 * "+" button at the end of the city card row.
 * Opens the city search overlay.
 */
export function AddCityButton({ onClick }: AddCityButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="w-full h-12 rounded-card bg-bg-card border border-border
                 flex items-center justify-center gap-2
                 text-text-muted hover:text-accent-green hover:border-accent-green/30
                 transition-colors duration-200 cursor-pointer text-sm font-light tracking-wide"
      aria-label="Add city"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <line x1="10" y1="3" x2="10" y2="17" />
        <line x1="3" y1="10" x2="17" y2="10" />
      </svg>
      Add city
    </motion.button>
  )
}
