import { useRef } from 'react'
import type { SideId } from '../../constants'
import { imagePolygon } from '../../lib/geometry'
import { coverFit, loadImageFromFile, zoomKeepingCenter } from '../../lib/image'
import { complementaryGradient, extractPalette } from '../../lib/palette'
import { useEditorStore } from '../../store/useEditorStore'
import { MAX_ZOOM_FACTOR } from '../layers/ImageHalf'

/** Upload a photo for one side and zoom it with a slider. */
export default function PhotoControls({ side }: { side: SideId }) {
  const img = useEditorStore((s) => s.images[side])
  const setImage = useEditorStore((s) => s.setImage)
  const setFrame = useEditorStore((s) => s.setFrame)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const image = await loadImageFromFile(file)
    const polygon = imagePolygon(side)
    const fit = coverFit(image.naturalWidth, image.naturalHeight, polygon)
    setImage(side, {
      image,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      scale: fit.scale,
      coverScale: fit.scale,
      x: fit.x,
      y: fit.y,
    })

    // Auto-pick a complementary backdrop from the photo's primary colors.
    // The user can still override it from the color controls afterwards.
    const palette = extractPalette(image)
    if (palette.length) {
      setFrame(side, { mode: 'gradient', gradient: complementaryGradient(palette) })
    }
  }

  const handleZoom = (value: number) => {
    setImage(side, zoomKeepingCenter(img, value, imagePolygon(side)))
  }

  const min = img.coverScale
  const max = img.coverScale * MAX_ZOOM_FACTOR

  return (
    <div className="control-group">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
        {img.image ? 'Change photo' : 'Upload photo'}
      </button>

      {img.image && (
        <label className="slider-row">
          <span>Zoom</span>
          <input
            type="range"
            min={min}
            max={max}
            step={(max - min) / 100 || 0.01}
            value={img.scale}
            onChange={(e) => handleZoom(Number(e.target.value))}
          />
        </label>
      )}
      {img.image && <p className="hint">Drag the photo on the canvas to reposition it.</p>}
    </div>
  )
}
