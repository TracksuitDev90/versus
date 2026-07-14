// Fixed design space. Everything is laid out in these coordinates; the on-screen
// stage is this base multiplied by a responsive scale, and export multiplies it
// by a pixelRatio. This keeps the exported PNG identical to the screen, only sharper.
export const BASE_WIDTH = 1920
export const BASE_HEIGHT = 1080

// --- Editorial palette. Flat ink on paper — no shadows, no gloss, anywhere. ---
export const PAPER = '#f2eee3' // warm uncoated stock
export const INK = '#181611' // near-black printing ink

// Archivo Black is the workhorse display face: an extremely heavy grotesque
// in the Druk/Helvetica-Black editorial tradition.
export const FONT_FAMILY = 'Archivo Black'

// The giant "VS" centerpiece is set in the same heavy grotesque.
export const VS_FONT_FAMILY = 'Archivo Black'

// Page furniture (captions, folios, rules text) is set in a typewriter mono,
// the classic counterpoint to heavy display type in editorial layouts.
export const MONO_FONT_FAMILY = 'Space Mono'

// Curated heavyweight sans set, all loaded from Google Fonts (see index.html).
export const FONT_OPTIONS = [
  { label: 'Archivo Black (default)', value: 'Archivo Black' },
  { label: 'Anton (condensed)', value: 'Anton' },
  { label: 'Bebas Neue (tall)', value: 'Bebas Neue' },
]

// Export resolution presets. pixelRatio is derived as targetWidth / BASE_WIDTH.
export const EXPORT_PRESETS = [
  { label: 'Full HD — 1920 × 1080', width: 1920 },
  { label: 'QHD — 2560 × 1440', width: 2560 },
  { label: '4K — 3840 × 2160', width: 3840 },
] as const

export type SideId = 'left' | 'right'
