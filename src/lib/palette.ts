import type { GradientFill } from '../store/useEditorStore'

// --- Color space helpers -----------------------------------------------------

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: h * 360, s, l }
}

/** Parse a `#rgb` or `#rrggbb` hex string into 0–255 channels (falls back to black). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (h.length !== 6) return { r: 0, g: 0, b: 0 }
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Convert a hex color straight to HSL (degrees, 0–1, 0–1). */
export function hexToHsl(hex: string): Swatch {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

export function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360
  s = Math.min(1, Math.max(0, s))
  l = Math.min(1, Math.max(0, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export interface Swatch {
  h: number
  s: number
  l: number
}

/**
 * Pull up to two dominant, *vivid* colors from a photo — deliberately skipping
 * black, white and gray so we key off the subject's real color, not its
 * lighting. Hues are binned and weighted by saturation; the two strongest,
 * sufficiently distinct bins win.
 */
export function extractPalette(img: HTMLImageElement): Swatch[] {
  const size = 72
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, size, size)

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, size, size).data
  } catch {
    return [] // tainted canvas — bail gracefully
  }

  const BINS = 24
  const bins = Array.from({ length: BINS }, () => ({ w: 0, h: 0, s: 0, l: 0 }))

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2])
    // Drop grays/near-black/near-white so only real chroma counts.
    if (s < 0.22 || l < 0.14 || l > 0.9) continue
    const idx = Math.min(BINS - 1, Math.floor((h / 360) * BINS))
    const weight = s * (1 - Math.abs(l - 0.5)) // favor vivid, mid-tone pixels
    const bin = bins[idx]
    bin.w += weight
    bin.h += h * weight
    bin.s += s * weight
    bin.l += l * weight
  }

  const ranked = bins
    .filter((b) => b.w > 0)
    .map((b) => ({ h: b.h / b.w, s: b.s / b.w, l: b.l / b.w, w: b.w }))
    .sort((a, b) => b.w - a.w)

  if (ranked.length === 0) return []

  const result: Swatch[] = [ranked[0]]
  // Second color must be a clearly different hue from the first.
  const second = ranked.find((c) => Math.abs(hueDelta(c.h, ranked[0].h)) > 40)
  if (second) result.push(second)
  return result
}

function hueDelta(a: number, b: number) {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Build a two-stop gradient that *complements* the photo's primary colors, so
 * the surrounding frame is a cool, contrasting backdrop rather than a clash.
 * We rotate to the complementary hue and run it from a deep to a vivid tone.
 */
export function complementaryGradient(palette: Swatch[]): GradientFill {
  const primary = palette[0]
  if (!primary) return { from: '#2bb6e0', to: '#0b2a6b', angle: 135 }

  const compHue = primary.h + 180
  const sat = Math.min(0.82, Math.max(0.5, primary.s))

  // If a distinct second color exists, lean the far stop toward *its* complement
  // for a richer two-tone; otherwise fan out analogously from the complement.
  const secondHue = palette[1] ? palette[1].h + 180 : compHue + 28

  return {
    from: hslToHex(compHue, sat, 0.3),
    to: hslToHex(secondHue, Math.min(0.8, sat * 0.95), 0.56),
    angle: 135,
  }
}
