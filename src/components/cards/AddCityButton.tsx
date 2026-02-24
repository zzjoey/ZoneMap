import { motion } from 'framer-motion'

interface AddCityButtonProps {
  onClick: () => void
}

/**
 * Add city button.
 * Mobile:  full-width button with generous padding (visually comparable to a city card).
 * Desktop: full-width taller row button.
 */
export function AddCityButton({ onClick }: AddCityButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="
        w-full flex items-center justify-center gap-2
        min-h-[4.5rem] py-5 rounded-xl border border-dashed border-border
        text-text-muted hover:text-accent-green hover:border-accent-green/40
        text-sm font-light tracking-wide
        transition-colors duration-200 cursor-pointer
        md:min-h-0 md:py-0 md:h-12 md:rounded-card md:gap-2 md:text-sm md:border-solid
      "
      aria-label="Add city"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <line x1="10" y1="3" x2="10" y2="17" />
        <line x1="3" y1="10" x2="17" y2="10" />
      </svg>
      <span>Add city</span>
    </motion.button>
  )
}
