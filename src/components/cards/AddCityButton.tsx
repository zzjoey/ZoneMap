import { motion } from 'framer-motion'

interface AddCityButtonProps {
  onClick: () => void
}

/**
 * Add city button.
 * Mobile:  full-width narrow strip (~1/5 card height).
 * Desktop: full-width taller row button.
 */
export function AddCityButton({ onClick }: AddCityButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="
        w-full flex items-center justify-center gap-1.5
        h-7 rounded-lg border border-dashed border-border
        text-text-muted hover:text-accent-green hover:border-accent-green/40
        text-[11px] font-light tracking-wide
        transition-colors duration-200 cursor-pointer
        md:h-12 md:rounded-card md:gap-2 md:text-sm md:border-solid
      "
      aria-label="Add city"
    >
      <svg
        width="11"
        height="11"
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
