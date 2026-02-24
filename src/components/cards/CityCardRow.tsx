import { AnimatePresence } from 'framer-motion'
import { City } from '../../types'
import { CityCard } from './CityCard'
import { AddCityButton } from './AddCityButton'

interface CityCardRowProps {
  cities: City[]
  baseCity: City
  baseTime: Date
  use12h: boolean
  onSelectBase: (city: City) => void
  onRemove: (cityId: string) => void
  onAddCity: () => void
}

/**
 * Horizontally scrollable row of city time cards.
 * Handles animated add/remove via AnimatePresence.
 */
export function CityCardRow({
  cities,
  baseCity,
  baseTime,
  use12h,
  onSelectBase,
  onRemove,
  onAddCity,
}: CityCardRowProps) {
  return (
    <div className="flex-shrink-0 w-96 flex flex-col gap-3 px-3 py-3 overflow-y-auto scrollbar-hide border-r border-border bg-bg-primary">
      <AnimatePresence initial={false}>
        {cities.map((city) => (
          <CityCard
            key={city.id}
            city={city}
            baseCity={baseCity}
            baseTime={baseTime}
            use12h={use12h}
            isActive={city.id === baseCity.id}
            onSelect={onSelectBase}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>

      <AddCityButton onClick={onAddCity} />
    </div>
  )
}
