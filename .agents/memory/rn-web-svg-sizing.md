---
name: RN Web SVG default-viewport seam
description: react-native-svg on web falls back to the 300x150 SVG default when sized only via style, cutting a visible rectangle into full-bleed backgrounds.
---

A `react-native-svg` `<Svg>` sized only through `style={StyleSheet.absoluteFill}`
(no explicit `width`/`height` props) renders on **web** at the SVG spec default
viewport of **300x150 px**, not the parent size. A full-bleed `<Rect width="100%"
height="100%">` then only paints a 300x150 box, leaving a hard vertical seam
(~300px in) / horizontal seam (~150px down) between the "rectangle" and the rest
of the container — very visible on backgrounds wider than 300px (e.g. tablet /
canvas-preview widths).

**Fix:** pass explicit `width="100%" height="100%"` as props on the `<Svg>` (keep
`style={StyleSheet.absoluteFill}` for positioning). Native was fine; only web
showed the seam.

**Why:** on native the style dimensions flow through, but the web shim honors the
SVG default viewport when width/height attributes are absent.

**How to apply:** any full-bleed decorative `<Svg>` background (water/pool/vignette
layers, gradients) must set `width`/`height` explicitly, not rely on style alone.
Percentage sizing is fine once the attributes exist.
