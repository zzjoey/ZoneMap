# ZoneMap

[中文文档](README.zh.md) | **[zonemap.live](https://zonemap.live)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white&style=flat-square)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

A timezone visualization web app. See the current time across multiple cities on an interactive world map, with a live day/night terminator line.

![ZoneMap screenshot](public/screenshot.png)

## Features

- **Live world clock** — time updates at the top of every minute with no drift
- **Interactive map** — Mercator projection with country outlines and city markers
- **Day/night terminator** — astronomically accurate solar boundary rendered on a Canvas overlay
- **City cards** — add/remove cities, click to set the base timezone
- **Time scrubbing** — drag the slider or type a time to explore any moment of the day
- **12h / 24h toggle** — applies to cards, map labels, and the time input
- **URL state** — share or bookmark a specific view; state restores on reload
- **33,000+ searchable cities** — powered by GeoNames, deduplicated by timezone

## Getting Started

```bash
pnpm install
pnpm run setup           # copies world map data into public/
pnpm run build:geonames  # builds the city search dataset
pnpm run dev             # http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start dev server (frontend + API) |
| `pnpm run build` | Type-check + production build |
| `pnpm run preview` | Preview the production build |
| `pnpm run lint` | Run ESLint |
| `pnpm run setup` | Copy world map TopoJSON to `public/` |
| `pnpm run build:geonames` | Build city search dataset from GeoNames |
| `pnpm start` | Start production server |

## Tech Stack

| | |
|---|---|
| Frontend | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion 11 |
| Time | date-fns + date-fns-tz |
| Geography | D3-geo + topojson-client + world-atlas |
| Backend | Hono + Node.js |

## Project Structure

```
src/
├── App.tsx              # Root state + URL sync
├── types/index.ts       # Shared TypeScript interfaces
├── data/cities.ts       # Default cities shown on load
├── utils/
│   ├── terminator.ts    # Solar terminator calculation (USNO algorithm)
│   ├── timeUtils.ts     # Timezone formatting helpers
│   └── mapUtils.ts      # Mercator projection utilities
├── hooks/
│   ├── useClock.ts      # Drift-free per-minute tick
│   └── useUrlSync.ts    # Debounced URL state sync
└── components/
    ├── cards/           # CityCard, CityCardRow, AddCityButton
    ├── map/             # WorldMap, MapBackground, CityMarkers, TerminatorCanvas
    ├── controls/        # TimeControl, TimeInput, TimeSlider
    └── search/          # CitySearch overlay
api/
├── server.ts            # Hono server — serves API + frontend static files
├── routes/cities.ts     # City search endpoint with GeoNames dataset
└── middleware/          # Rate limiting, CORS
```

## Adding Cities

The search overlay queries 33,000+ cities from the GeoNames dataset. To hardcode cities that appear before any search is typed, add an entry to `ALL_CITIES` in `src/data/cities.ts`:

```ts
{
  id: 'city-slug',
  name: 'City Name',
  country: 'Country',
  countryCode: 'ISO',
  timezone: 'Region/City',   // IANA timezone identifier
  lat: 0.0,
  lng: 0.0,
}
```

## License

[MIT](LICENSE)
