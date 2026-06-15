import type { ImageState } from '../store/useEditorStore'
import type { Pt } from './geometry'
import { bbox } from './geometry'

/** Load a user-selected File into an HTMLImageElement via an object URL. */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

/**
 * Compute the scale + top-left position so an image "covers" (fills) the bounding
 * box of a clip polygon, centered within it.
 */
export function coverFit(
  naturalWidth: number,
  naturalHeight: number,
  polygon: Pt[],
) {
  const box = bbox(polygon)
  const scale = Math.max(box.width / naturalWidth, box.height / naturalHeight)
  const w = naturalWidth * scale
  const h = naturalHeight * scale
  return {
    scale,
    x: box.x + (box.width - w) / 2,
    y: box.y + (box.height - h) / 2,
  }
}

/**
 * Clamp an image's top-left position so it always fully covers the polygon's
 * bounding box (no empty gaps appear inside the clipped half).
 */
export function clampToCover(img: ImageState, polygon: Pt[]) {
  const box = bbox(polygon)
  const w = img.naturalWidth * img.scale
  const h = img.naturalHeight * img.scale
  const minX = box.x + box.width - w
  const minY = box.y + box.height - h
  return {
    x: Math.min(box.x, Math.max(minX, img.x)),
    y: Math.min(box.y, Math.max(minY, img.y)),
  }
}

/** Change scale while keeping the image's center point fixed, then re-clamp. */
export function zoomKeepingCenter(img: ImageState, newScale: number, polygon: Pt[]) {
  const centerX = img.x + (img.naturalWidth * img.scale) / 2
  const centerY = img.y + (img.naturalHeight * img.scale) / 2
  const next: ImageState = {
    ...img,
    scale: newScale,
    x: centerX - (img.naturalWidth * newScale) / 2,
    y: centerY - (img.naturalHeight * newScale) / 2,
  }
  return { scale: newScale, ...clampToCover(next, polygon) }
}
