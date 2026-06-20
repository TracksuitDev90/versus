import type Konva from 'konva'
import { BASE_HEIGHT, BASE_WIDTH, FONT_FAMILY, VS_FONT_FAMILY } from '../constants'

/**
 * Export the stage as a high-resolution PNG and trigger a download.
 *
 * The on-screen stage is responsively scaled, so we temporarily reset it to the
 * base design size at scale 1, render at `pixelRatio = targetWidth / BASE_WIDTH`,
 * then restore — this prevents the screen scale from compounding into the export.
 */
export async function exportPng(stage: Konva.Stage, targetWidth: number) {
  // Make sure the display font is loaded before rasterizing text.
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load(`700 64px "${FONT_FAMILY}"`),
        document.fonts.load(`400 120px "${VS_FONT_FAMILY}"`),
      ])
      await document.fonts.ready
    } catch {
      /* fall back to whatever is available */
    }
  }

  const prevScale = stage.scaleX()
  const prevWidth = stage.width()
  const prevHeight = stage.height()

  stage.scale({ x: 1, y: 1 })
  stage.size({ width: BASE_WIDTH, height: BASE_HEIGHT })
  stage.draw()

  const pixelRatio = targetWidth / BASE_WIDTH
  const dataUrl = stage.toDataURL({ pixelRatio, mimeType: 'image/png' })

  // Restore the on-screen presentation.
  stage.scale({ x: prevScale, y: prevScale })
  stage.size({ width: prevWidth, height: prevHeight })
  stage.draw()

  // Use a Blob URL (more reliable than huge data URLs, especially on iOS).
  const blob = await (await fetch(dataUrl)).blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'versus.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
