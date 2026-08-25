# Fonts

Two self-hosted variable-font files:

- `jost-variable.woff2` — Jost, weights 400–800. Applied to every heading
  (`h1`-`h6`, including ones rendered from raw WP content via `.prose`) via
  a tag selector in `src/styles/global.css`'s `@layer base`, not a utility
  class — nothing has to opt in per-component.
- `outfit-variable.woff2` — Outfit, weights 400–700. Applied to `body`;
  everything that isn't a heading inherits it.

Referenced via `@font-face` in `src/styles/global.css` with a single ranged
`font-weight` rule each rather than separate static-weight files — both are
variable fonts, so one file per family covers the whole range used across
the site.

No CDN font loading anywhere in this project (see `README.md`'s non-goals)
— self-hosted only, `font-display: swap` so text never blocks on font load.
Both Jost and Outfit are SIL Open Font License, which explicitly permits
exactly this kind of self-hosting/redistribution.
