# Fonts

Self-hosted variable-font file:

- `inter-variable.woff2` — Inter, weights 400–700 in one file, used for both
  body text and headings (see the `.font-display` class in
  `src/styles/global.css` for how heading weight/tracking differ from body).

Referenced via `@font-face` in `src/styles/global.css` with a single ranged
`font-weight: 400 700` rule rather than separate static-weight files — it's
a variable font, so one file covers the whole range already used across the
site.

No CDN font loading anywhere in this project (see `README.md`'s non-goals)
— self-hosted only, `font-display: swap` so text never blocks on font load.
Inter is SIL Open Font License, which explicitly permits exactly this kind
of self-hosting/redistribution.

`fraunces-variable.woff2` previously lived here as a second (serif display)
face; it's no longer referenced anywhere and can be deleted from this
folder — left in place for now in case a future redesign wants it back.
