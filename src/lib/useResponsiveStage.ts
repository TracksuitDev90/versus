import { useEffect, useRef, useState } from 'react'
import { BASE_WIDTH } from '../constants'

/**
 * Observes a container element and returns the scale factor that maps the fixed
 * design space (BASE_WIDTH) onto the container's current pixel width.
 */
export function useResponsiveStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const width = el.clientWidth
      if (width > 0) setScale(width / BASE_WIDTH)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return { containerRef, scale }
}
