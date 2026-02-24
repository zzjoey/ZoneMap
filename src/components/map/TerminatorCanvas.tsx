import { useRef, useEffect } from 'react'
import { ProjectFn, InverseProjectFn } from '../../types'
import { drawTerminator } from '../../utils/terminator'

interface TerminatorCanvasProps {
  width: number
  height: number
  time: Date
  project: ProjectFn
  inverseProject: InverseProjectFn
}

/**
 * Canvas overlay that renders the day/night terminator.
 * Positioned absolutely to align with the SVG map layer beneath it.
 *
 * The canvas is re-drawn whenever time, size, or projection changes.
 */
export function TerminatorCanvas({
  width,
  height,
  time,
  project,
  inverseProject,
}: TerminatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !width || !height) return

    // Crisp pixel rendering: set the physical canvas size
    canvas.width = width
    canvas.height = height

    drawTerminator(canvas, time, project, inverseProject)
  }, [time, width, height, project, inverseProject])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width,
        height,
        // Blend with the SVG beneath — multiply darkens night areas
        mixBlendMode: 'multiply',
        opacity: 0.85,
      }}
    />
  )
}
