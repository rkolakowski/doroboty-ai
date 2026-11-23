# Runtime typography

The portal uses the `system-ui, sans-serif` stack for headings, body and controls. The reference kit retains its local Geist Serif Regular font and license for the reference examples.

## Retained historical assets

# Timeless Sans Variable

`timeless-sans-variable.woff2` is the free Timeless Sans variable font served by the official
[Timeless Type](https://timeless.co/type) website. The vendor describes the Timeless family as
free for personal and commercial use.

The previous runtime used the Grotesk cut with `STYL` and `ital` pinned to `0`.

## Web-optimized Grotesk

`timeless-grotesk-web-variable.woff2` is generated from the original asset by
pinning `STYL=0` and `ital=0`, matching the existing global theme settings. It keeps
all 417 mapped Unicode characters, glyph coverage and the weight axis (300–800),
while discarding unused stylistic/italic interpolation. The original is retained.

Generate with FontTools `varLib.instancer` using those axis values and WOFF2 output;
preserve timestamps for repeatability. FontTools is asset tooling, not a runtime dependency.
These retained Timeless assets are no longer loaded by the application.
