# VS Maker — Versus Template Creator

A free, browser-based tool for building "versus" battle graphics: upload two
photos, frame them inside a diagonal split with a starburst **VS** badge and
lightning divider, recolor the surrounding frame with solid colors or gradients,
add bold corner labels, and export a high-resolution PNG. Runs entirely in the
browser — no accounts, no subscription.

## Features

- Upload a photo per side; **drag to reposition** and **zoom** (slider, mouse
  wheel, or pinch on touch devices). Photos always cover their half.
- Diagonal split with a starburst **VS** badge and a lightning bolt seam.
- Recolor each side's frame independently — **solid** or **linear gradient**
  (with an adjustable angle).
- Editable corner labels: text, font, size, and color.
- **Save as PNG** at Standard (1280×720), HD (2560×1440), or 4K (3840×2160).
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

Vite · React · TypeScript · Konva (canvas) · Zustand (state) · react-colorful.
