# Network showcase tiles

Photos for the "Our network" section on the homepage
(`components/home/NetworkShowcase.tsx`). Drop a file in with one of the names
below and the tile picks it up on the next build; until then the tile shows a
gradient placeholder.

| File               | Tile    |
| ------------------ | ------- |
| `tile-static.webp`  | Static  |
| `tile-digital.webp` | Digital |
| `tile-airport.webp` | Airport |
| `tile-sgr.webp`     | SGR     |

## Specs

- Format: WebP
- Crop: 3:4 portrait
- Minimum size: 1200 × 1600 px
- Keep the subject in the upper two thirds. The bottom third sits under a dark
  gradient with the tile's label on top.
- Tiles are shown slightly desaturated and darkened until hovered, so pick
  photos that still read at lower brightness.
