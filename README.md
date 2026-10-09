# VS.Maker — An Editorial Versus Builder

A free, browser-based tool for building "versus" graphics with an editorial,
print-inspired look after dark: two photo plates on warm black stock, split by
a clean diagonal gutter, with a massive flat **VS** in a heavyweight grotesque,
spot-ink color blocks, kicker-strip headlines, and magazine page furniture
(rules, mono captions, crop marks, a folio line), all under a film grain. The
one source of light is the **aura**: a dark orb behind the VS, rim-lit by the
two sides' inks, whose surface ripples like liquid. Runs entirely in the
browser — no accounts, no subscription.

## Features

- Upload a photo per plate; **drag to reposition** and **zoom** (slider, mouse
  wheel, or pinch on touch devices). Photos always cover their plate.
- Diagonal split with a bare-paper gutter, hairline score line, plate keylines,
  and trim marks — like an untrimmed press sheet.
- A flat **spot ink** per side (solid or linear gradient), shown as a
  misregistered color block behind the plate and as the headline's kicker
  strip. Uploading a photo auto-picks a complementary ink.
- Editable headlines set in extremely heavy sans faces (Archivo Black, Anton,
  Bebas Neue), with optional kicker strips.
- The **aura**: a WebGL-rendered orb lit from behind-left by the left ink, from
  above by a warm key light, and from behind-right by the right ink. It breathes
  on its own, swelling into liquid ridges and settling back, and ripples when you
  upload a photo or change an ink. Ripple and glow are adjustable; turn motion
  off to hold a frame. A live copy of it is the masthead's mark, and the page's
  accents (section numbers, switches, the save button) take on its colors.
- A folio line that quotes the current matchup, baked into every export.
- **Save as PNG** at Full HD (1920×1080), QHD (2560×1440), or 4K (3840×2160).
  The aura is re-rendered at full export resolution from the frame on screen.
- Responsive: side panel on desktop, stacked layout on mobile.

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173/versus/).

To build a production bundle:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the built bundle locally
```

## Deploy (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` builds and deploys automatically on
every push to **`main`**. One-time setup:

1. Push this project to GitHub (repo named `versus`).
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub
   Actions**.
3. Merge your work into `main`. The action builds and publishes to
   `https://<your-username>.github.io/versus/`.

> The site path is configured via `base: '/versus/'` in `vite.config.ts`. If you
> name the repository something else, update `base` to match (`/<repo-name>/`).

## Tech

Vite · React · TypeScript · Konva (canvas) · WebGL (the aura) · Zustand (state) ·
react-colorful. Simplex noise from webgl-noise by Ashima Arts / Stefan Gustavson
(MIT).
Type: Archivo Black & Space Mono (Google Fonts).
