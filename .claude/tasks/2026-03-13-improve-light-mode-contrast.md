# Task: Improve light-mode contrast for hero and expertise sections

**Status**: 🔄 In Progress  
**Date**: 2026-03-13  
**Branch**: `copilot/fix-daymode-contrast-issues`

## Summary

Light/day mode needs better readability. The hero uses pale text that fades on the cream background, and the expertise section overlay looks blackish in light mode. Adjust theme-aware colors to restore contrast while keeping the warm amber/violet palette.

## TODO

- [ ] Increase hero text contrast in light mode (titles, tagline, brand accent)
- [ ] Replace the dark expertise overlay/skill track with light-friendly theming
- [ ] Validate light mode (header, CTA, stats) and capture screenshot
- [ ] Run build/type-check to confirm no regressions

## Files to touch

- `src/style.css` — add theme-aware tokens for hero/expertise
- `src/App.vue` — apply tokens to hero text, expertise overlay, and skill bars

## Verification plan

- Toggle light/dark themes and visually inspect hero and expertise sections
- Ensure glass/cta elements still match palette
- `npm run type-check`
- `npm run build`
