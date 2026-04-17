
User wants the app logo (icon-192, icon-512, apple-touch-icon, favicon) properly centered. Current icons were generated with padding but logo may be off-center due to bounding-box detection of the source image.

Plan: Re-generate all icon assets with precise centering using PIL — detect the actual logo bounding box (non-white pixels), crop to it, then place exactly in the geometric center of a square white canvas with equal padding on all sides.

## Steps

1. Locate the source logo (use the most recent uploaded "D" logo asset already saved or re-derive from existing icon-512).
2. Run a Python script that:
   - Opens the source logo
   - Trims whitespace via bounding box of non-white pixels
   - Places the trimmed logo exactly centered on a square white canvas with ~22% padding
   - Exports: `public/icon-192.png` (192x192), `public/icon-512.png` (512x512), `public/apple-touch-icon.png` (180x180), `public/favicon.ico` (multi-size 16/32/48)
   - Also regenerate `public/deckr-icon-192.png` and `public/deckr-icon-512.png` for consistency
3. Bump service worker cache version in `public/sw.js` (e.g. `deckr-v5`) so devices fetch the new icons instead of cached ones.
4. QA: convert each generated PNG to a preview and visually verify the D logo sits exactly in the center.

## Files to change
- `public/icon-192.png` (regen)
- `public/icon-512.png` (regen)
- `public/apple-touch-icon.png` (regen)
- `public/favicon.ico` (regen)
- `public/deckr-icon-192.png`, `public/deckr-icon-512.png` (regen)
- `public/sw.js` (cache version bump)

No code/UI changes — purely asset regeneration + cache bust.
