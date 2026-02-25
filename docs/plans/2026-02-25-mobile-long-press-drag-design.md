# Mobile Long-Press Drag-to-Reorder — Design

**Date:** 2026-02-25
**Status:** Approved

## Problem

On mobile, city cards in the left panel cannot be reordered. Desktop uses Framer Motion `Reorder.Group` + `Reorder.Item`, but `dragListener={isDesktop}` disables drag on mobile.

## Solution

Whole-card long-press (400ms) activates drag via `useDragControls`. No new dependencies.

## Component Structure

Extract a `MobileDraggableItem` component inside `CityCardRow.tsx`. Each instance holds its own `useDragControls()` hook (required because hooks cannot be called in a loop).

```
CityCardRow
└── Reorder.Group
    └── MobileDraggableItem  (×N)
        ├── useDragControls()
        ├── long-press timer logic
        └── Reorder.Item (dragControls=controls, dragListener=isDesktop)
            └── CityCard
```

## Interaction Flow

```
pointerDown  →  record startY, start 400ms timer
  │
  ├─ pointerMove (|deltaY| > 8px)  →  cancel timer  (user is scrolling)
  ├─ pointerUp / pointerCancel     →  cancel timer
  │
  └─ 400ms elapsed
       ├─ navigator.vibrate(50)        vibration feedback
       ├─ setIsDragReady(true)         triggers scale 1.04 spring animation
       └─ dragControls.start(event)    FM takes pointer capture, drag begins
```

After drag ends (`onDragEnd`): reset `isDragReady` to false.

## Animation States

| State | Transform | Shadow |
|-------|-----------|--------|
| Default | scale 1 | none |
| Long-press activated | scale 1.04, spring transition | none |
| Dragging (whileDrag) | scale 1.04 | `0 8px 32px rgba(0,0,0,0.4)` |

`zIndex: 10` applied during drag so the lifted card renders above siblings.

## Scroll Conflict Prevention

- Record `startY` on `pointerDown`
- On `pointerMove`: if `Math.abs(e.clientY - startY) > 8`, clear timer — this allows natural vertical scrolling of the card list
- Once `dragControls.start()` fires, Framer Motion calls `setPointerCapture` which prevents the browser from continuing a scroll gesture

## Files Changed

- `src/components/cards/CityCardRow.tsx` — add `MobileDraggableItem` component, wire up long-press logic

No other files require changes.

## Non-Goals

- No drag handle icon (whole card is the target)
- No visual progress indicator during the 400ms wait (scale animation is sufficient)
- Desktop behavior unchanged
