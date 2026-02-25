# Mobile Long-Press Drag-to-Reorder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable drag-to-reorder for city cards on mobile via a 400ms long-press gesture.

**Architecture:** Extract a `MobileDraggableItem` wrapper inside `CityCardRow.tsx` that holds its own `useDragControls()` hook per item. Desktop behavior is unchanged. Long-press timer fires `dragControls.start(event)` after 400ms; pointer move beyond 8px cancels the timer to allow normal scroll.

**Tech Stack:** React 18, TypeScript strict, Framer Motion 11 (`useDragControls`, `Reorder.Item`), `navigator.vibrate` for haptic feedback.

---

### Task 1: Extract `MobileDraggableItem` component

**Files:**
- Modify: `src/components/cards/CityCardRow.tsx`

**Context:**
`Reorder.Item` currently sets `dragListener={isDesktop}`. We need per-item `useDragControls()` which requires each item to be its own component (hooks can't be called in a loop).

**Step 1: Add `MobileDraggableItem` component above `CityCardRow`**

Insert between the `clampPanelWidth` function and the `CityCardRow` export. The component receives all the props that `Reorder.Item` + `CityCard` need, plus `isDesktop`.

```tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
```

(Replace the existing `import { Reorder } from 'framer-motion'` import.)

```tsx
interface MobileDraggableItemProps {
  city: City
  baseCity: City
  baseTime: Date
  use12h: boolean
  useAnalog: boolean
  isDark: boolean
  isDesktop: boolean
  onSelectBase: (city: City) => void
  onRemove: (cityId: string) => void
}

function MobileDraggableItem({
  city,
  baseCity,
  baseTime,
  use12h,
  useAnalog,
  isDark,
  isDesktop,
  onSelectBase,
  onRemove,
}: MobileDraggableItemProps) {
  const dragControls = useDragControls()
  const [isDragReady, setIsDragReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startYRef = useRef(0)
  const savedEventRef = useRef<PointerEvent | null>(null)

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsDragReady(false)
  }, [])

  function handlePointerDown(e: React.PointerEvent) {
    if (isDesktop) return
    startYRef.current = e.clientY
    savedEventRef.current = e.nativeEvent
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setIsDragReady(true)
      navigator.vibrate?.(50)
      dragControls.start(savedEventRef.current!)
    }, 400)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (isDesktop || timerRef.current === null) return
    if (Math.abs(e.clientY - startYRef.current) > 8) {
      cancelTimer()
    }
  }

  return (
    <Reorder.Item
      value={city}
      dragControls={dragControls}
      dragListener={isDesktop}
      className="flex-shrink-0"
      style={{ cursor: isDesktop ? 'grab' : 'default' }}
      animate={{ scale: isDragReady ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      whileDrag={{ scale: 1.04, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelTimer}
      onPointerCancel={cancelTimer}
      onDragEnd={cancelTimer}
    >
      <CityCard
        city={city}
        baseCity={baseCity}
        baseTime={baseTime}
        use12h={use12h}
        useAnalog={useAnalog}
        isDark={isDark}
        isActive={city.id === baseCity.id}
        onSelect={onSelectBase}
        onRemove={onRemove}
      />
    </Reorder.Item>
  )
}
```

**Step 2: Replace `Reorder.Item` usage in `CityCardRow` with `MobileDraggableItem`**

In `CityCardRow`, the current map inside `Reorder.Group` looks like:
```tsx
{cities.map((city) => (
  <Reorder.Item
    key={city.id}
    value={city}
    dragListener={isDesktop}
    className="flex-shrink-0"
    style={{ cursor: isDesktop ? 'grab' : undefined }}
    whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
  >
    <CityCard ... />
  </Reorder.Item>
))}
```

Replace it entirely with:
```tsx
{cities.map((city) => (
  <MobileDraggableItem
    key={city.id}
    city={city}
    baseCity={baseCity}
    baseTime={baseTime}
    use12h={use12h}
    useAnalog={useAnalog}
    isDark={isDark}
    isDesktop={isDesktop}
    onSelectBase={onSelectBase}
    onRemove={onRemove}
  />
))}
```

**Step 3: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: build succeeds with no type errors.

**Step 4: Commit**

```bash
git add src/components/cards/CityCardRow.tsx
git commit -m "feat(cards): add long-press drag-to-reorder on mobile"
```

---

### Task 2: Manual verification on mobile

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Open on a mobile device or Chrome DevTools mobile emulation**

URL: `http://localhost:5173`

Enable touch emulation in DevTools: F12 → Toggle device toolbar (Ctrl+Shift+M).

**Step 3: Verify scroll is unaffected**

Swipe up/down quickly on the card list. Cards should scroll normally without triggering drag.

**Step 4: Verify long-press activates drag**

Press and hold a card for ~400ms without moving your finger. Expected:
- Slight scale-up animation (1.04)
- Phone vibrates (real device only)
- Card follows your finger after activation
- Releasing drops the card in its new position
- `onReorder` fires and the city list updates

**Step 5: Verify desktop is unchanged**

Switch to desktop viewport. Cards should still drag immediately on mouse-down (no 400ms delay).

**Step 6: Verify tap-to-select still works on mobile**

Tap a card quickly (< 400ms). The base city should change. No drag should activate.

---

### Task 3: Push

```bash
git push
```

---

## Notes

- `navigator.vibrate` is silently ignored in Safari and on desktop — no guard needed.
- `savedEventRef.current` holds the original `PointerEvent`. Framer Motion's `dragControls.start()` uses it to initialize tracking; since the pointer is still down, `setPointerCapture` succeeds and subsequent `pointermove` events route through FM's drag handler.
- `onDragEnd={cancelTimer}` resets `isDragReady` so the card returns to `scale: 1` after drop.
- The `animate` prop on `Reorder.Item` may conflict with FM's internal layout animation. If cards jump on drop, remove the `animate={{ scale }}` and instead wrap the inner `CityCard` div in a `motion.div` with `animate={{ scale: isDragReady ? 1.04 : 1 }}`.
