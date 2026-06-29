# SailSmart Design System

## CSS Variables

Defined in `app/globals.css`:

```css
--bg-primary: #FFFFFF
--bg-secondary: #F0F8FF
--text-primary: #003366        /* Deep Sea Blue */
--text-secondary: #4A90E2      /* Mediterranean Blue */
--accent-blue: #0077BE         /* Ocean Blue */
--accent-light: #E0F2FE
--border-light: rgba(0,119,190,0.15)
--shadow-subtle: 0 4px 20px rgba(0,51,102,0.08)
--radius-lg: 16px
--radius-full: 9999px
--transition-fast: 0.2s cubic-bezier(0.4,0,0.2,1)
```

Font: `Outfit` (Google Fonts), weights 300–700.

## Glass Panel Utility

```css
.glass-panel {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle);
}
```

## Portrait Image Rotation (C50 Configurations)

Config PNGs are 2410×908 landscape — displayed portrait via CSS `rotate(-90deg)` trick.
See `app/(app)/my-c50/page.module.css` and `app/(app)/my-c50/ConfigSelector.module.css` for the exact implementation.

## PDF Rendering (PdfPageModal)

Rendered via `pdfjs-dist` at 3× oversample (capped 5000px wide) for sharpness.
Full-screen uses `window.innerWidth - 32`. See `PdfPageModal` component for implementation.
