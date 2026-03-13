# Task: Improve light-mode contrast for hero and expertise sections

**Status**: ✅ Complete  
**Date**: 2026-03-13  
**Branch**: `copilot/fix-daymode-contrast-issues`

## Summary

Light/day mode needs better readability. The hero uses pale text that fades on the cream background, and the expertise section overlay looks blackish in light mode. Adjust theme-aware colors to restore contrast while keeping the warm amber/violet palette.

## TODO

- [x] Increase hero text contrast in light mode (titles, tagline, brand accent)
- [x] Replace the dark expertise overlay/skill track with light-friendly theming
- [x] Validate light mode (header, CTA, stats) and capture screenshot
- [x] Run build/type-check to confirm no regressions

## Notes

- Added theme tokens (`--hero-title`, `--hero-tagline`, `--hero-brand`, `--expertise-bg`, `--skill-track`) for light/dark parity.
- Hero headings and tagline now use tokens for contrast; expertise overlay/skill tracks now adapt per theme with a light radial/linear blend.
- Validation: `npm run type-check`, `npm run build` (vite-ssg) pass; manual light-mode check OK. Screenshot available: https://github.com/user-attachments/assets/4bcd188b-49ee-4399-93a9-b971d57ca991

## Files to touch

- `src/style.css` — add theme-aware tokens for hero/expertise
- `src/App.vue` — apply tokens to hero text, expertise overlay, and skill bars

## Verification plan

- Toggle light/dark themes and visually inspect hero and expertise sections
- Ensure glass/cta elements still match palette
- `npm run type-check`
- `npm run build`
