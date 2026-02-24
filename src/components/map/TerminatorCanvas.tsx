import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ProjectFn, InverseProjectFn } from '../../types'
import { drawTerminator } from '../../utils/terminator'

interface TerminatorCanvasProps {
  width: number
  height: number
  time: Date
  project: ProjectFn
  inverseProject: InverseProjectFn
  isDark: boolean
}

/**
 * Canvas overlay that renders the day/night terminator.
 * Positioned absolutely to align with the SVG map layer beneath it.
 *
 * Exposes the underlying <canvas> element via forwardRef so WorldMap can
 * call drawTerminator directly during drag for zero-latency visual feedback.
 *
 * Dark mode:  multiply blend — near-black navy pixels deepen the dark map.
 * Light mode: normal blend  — deep indigo pixels overlay the light map.
 */
export const TerminatorCanvas = forwardRef<HTMLCanvasElement, TerminatorCanvasProps>(
  function TerminatorCanvas({ width, height, time, project, inverseProject, isDark }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Expose the raw canvas element to the parent
    useImperativeHandle(ref, () => canvasRef.current!, [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || !width || !height) return
      canvas.width  = width
      canvas.height = height
      drawTerminator(canvas, time, project, inverseProject, isDark)
    }, [time, width, height, project, inverseProject, isDark])

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          width,
          height,
          mixBlendMode: isDark ? 'multiply' : 'normal',
          opacity: 0.88,
        }}
      />
    )
  }
)
