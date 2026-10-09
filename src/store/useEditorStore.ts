import { create } from 'zustand'
import type { SideId } from '../constants'
import { FONT_FAMILY, INK } from '../constants'

export type FillMode = 'solid' | 'gradient'

export interface GradientFill {
  from: string
  to: string
  angle: number // degrees, 0 = left→right
}

export interface FrameColor {
  mode: FillMode
  solid: string
  gradient: GradientFill
}

export interface ImageState {
  image: HTMLImageElement | null
  naturalWidth: number
  naturalHeight: number
  x: number // top-left position of the image in design coordinates
  y: number
  scale: number
  coverScale: number // baseline scale that fills the half; the minimum zoom
}

export interface LabelState {
  text: string
  fontFamily: string
  fontSize: number
  fill: string
  // Kicker strip: a flat bar in the side's ink color behind the text, like a
  // pasted paper label. Doubles as legibility over busy photos (on by default).
  strip: boolean
}

export interface AuraState {
  enabled: boolean // the lit orb behind the VS
  ripple: number // 0–1: how far the surface swells into liquid ridges
  glow: number // 0–1: how far the light halo spills off the rim
  motion: boolean // animate on screen; off freezes the current frame
}

interface EditorState {
  images: Record<SideId, ImageState>
  frames: Record<SideId, FrameColor>
  labels: Record<SideId, LabelState>
  aura: AuraState

  setImage: (side: SideId, patch: Partial<ImageState>) => void
  setFrame: (side: SideId, patch: Partial<FrameColor>) => void
  setGradient: (side: SideId, patch: Partial<GradientFill>) => void
  setLabel: (side: SideId, patch: Partial<LabelState>) => void
  setAura: (patch: Partial<AuraState>) => void
}

const emptyImage = (): ImageState => ({
  image: null,
  naturalWidth: 0,
  naturalHeight: 0,
  x: 0,
  y: 0,
  scale: 1,
  coverScale: 1,
})

const defaultLabel = (text: string): LabelState => ({
  text,
  fontFamily: FONT_FAMILY,
  fontSize: 88,
  fill: INK,
  strip: true,
})

export const useEditorStore = create<EditorState>((set) => ({
  images: { left: emptyImage(), right: emptyImage() },
  // Two flat spot inks: cobalt vs vermillion — classic two-color print pairing,
  // set cool-left / warm-right so the aura runs blue → yellow → red over the top.
  frames: {
    left: {
      mode: 'solid',
      solid: '#1d4fd7',
      gradient: { from: '#1d4fd7', to: '#0c2a75', angle: 135 },
    },
    right: {
      mode: 'solid',
      solid: '#e2382a',
      gradient: { from: '#e2382a', to: '#8f1d14', angle: 135 },
    },
  },
  labels: { left: defaultLabel('TEAM ONE'), right: defaultLabel('TEAM TWO') },
  aura: {
    enabled: true,
    ripple: 0.2,
    glow: 0.5,
    motion: !prefersReducedMotion(),
  },

  setImage: (side, patch) =>
    set((s) => ({ images: { ...s.images, [side]: { ...s.images[side], ...patch } } })),

  setFrame: (side, patch) =>
    set((s) => ({ frames: { ...s.frames, [side]: { ...s.frames[side], ...patch } } })),

  setGradient: (side, patch) =>
    set((s) => ({
      frames: {
        ...s.frames,
        [side]: { ...s.frames[side], gradient: { ...s.frames[side].gradient, ...patch } },
      },
    })),

  setLabel: (side, patch) =>
    set((s) => ({ labels: { ...s.labels, [side]: { ...s.labels[side], ...patch } } })),

  setAura: (patch) => set((s) => ({ aura: { ...s.aura, ...patch } })),
}))

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** The single color a side is "known by": its solid ink, or its gradient's
 *  starting ink. Used for kicker strips and the aura's light. */
export function inkOf(frame: FrameColor): string {
  return frame.mode === 'gradient' ? frame.gradient.from : frame.solid
}
