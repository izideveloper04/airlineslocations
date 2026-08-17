# Fonts

Self-hosted variable-font files, both already present:

- `inter-variable.woff2` — Inter, weights 400–700 in one file
- `fraunces-variable.woff2` — Fraunces, weights 400–700 in one file

Referenced via `@font-face` in `src/styles/global.css`, each with a single
ranged `font-weight: 400 700` rule rather than separate static-weight files
— both are variable fonts, so one file covers the whole range already used
across the site.

No CDN font loading anywhere in this project (see `README.md`'s non-goals)
— self-hosted only, `font-display: swap` so text never blocks on font load.
Both fonts are SIL Open Font License, which explicitly permits exactly this
kind of self-hosting/redistribution.
