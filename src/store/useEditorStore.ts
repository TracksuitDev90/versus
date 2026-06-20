import { create } from 'zustand'
import type { SideId } from '../constants'
import { FONT_FAMILY } from '../constants'

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
}

interface EditorState {
  images: Record<SideId, ImageState>
  frames: Record<SideId, FrameColor>
  labels: Record<SideId, LabelState>

  setImage: (side: SideId, patch: Partial<ImageState>) => void
  setFrame: (side: SideId, patch: Partial<FrameColor>) => void
  setGradient: (side: SideId, patch: Partial<GradientFill>) => void
  setLabel: (side: SideId, patch: Partial<LabelState>) => void
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
  fontSize: 96,
  fill: '#ffffff',
})

export const useEditorStore = create<EditorState>((set) => ({
  images: { left: emptyImage(), right: emptyImage() },
  frames: {
    left: {
      mode: 'gradient',
      solid: '#e11d2a',
      gradient: { from: '#f43f3f', to: '#7a0d12', angle: 135 },
    },
    right: {
      mode: 'gradient',
      solid: '#1d6fe1',
      gradient: { from: '#2bb6e0', to: '#0b2a6b', angle: 135 },
    },
  },
  labels: { left: defaultLabel('TEAM ONE'), right: defaultLabel('TEAM TWO') },

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
}))
