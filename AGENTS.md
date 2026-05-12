# Fiber Storybook Agent Guide

## Project Goal
- This repo is a Next.js + React scroll-storybook that demonstrates real-world Fiber Network payment flows through Pico's airport journey.
- Chapter 1 explains pay-by-use micropayments for a nap service.
- Chapter 2 explains how one Fiber Airport Pass session can streamline multiple airport services across CKB and BTC-sats.
- The homepage `/` is the canonical story entry. Do not create or maintain a separate embedded-vs-standalone story architecture.
- When a Figma node or frame is specified, treat Figma as the visual source of truth.

## Project Structure
- `app/` contains the Next.js app shell, global styles, and page entry.
- `components/story/fiber-storybook.tsx` is the top-level story container for hero, chapters, sound, navigation, and progress.
- `components/story/airport-nap-story/` contains Chapter 1 scene implementations.
- `components/story/multi-service-story/` contains Chapter 2 scene implementations.
- `components/story/shared/` contains cross-chapter primitives such as pinned scene shells, motion helpers, two-panel storyboards, phone summary panels, shared avatar/card pieces, and story navigation helpers.
- `lib/story-content/` owns chapter scene data and timing config. Keep story copy and scene metadata there when practical.
- `public/` stores storyboards, avatars, icons, fonts, and sound assets. Prefer existing local assets before adding new ones.

## Chapter 2 Current Shape
- Chapter 2 focuses on a simplified Fiber Airport Pass flow: Pico opens one pass channel, then uses luggage storage and massage chair through service routes the pass already supports.
- The massage-chair route uses sats. Frame the Fiber Airport Pass as a hub node that supports CKB and sats routes; in demo math, use `1 CKB = 10 sats`.
- The power-bank flow and old power-bank assets are not part of the current chapter. Do not reintroduce them unless the task explicitly asks for it.
- Scene 5 is the reusable topology-board reference for opening/closing channel states. Scene 13 should keep that same visual language unless a new Figma design says otherwise.
- Scenes 8 and 11 use a route-distribution board. Scene 12 uses the active-usage board with live meters, elapsed service times, and the `End all services` action.
- Scene 14 is the Fiber Airport Pass receipt summary and should consume the settlement snapshot produced by Scene 12.
- Chapter 2 payment constants, service durations, and conversion assumptions live in `lib/story-content/multi-service-model.ts`. Update that source of truth instead of duplicating numbers in components or docs.

## Implementation Guidelines
- Keep implementation files under 600 lines whenever reasonably possible.
- Break story work into scene-focused files instead of growing monolithic components.
- Keep scene-specific styling close to the scene that owns it, preferably with CSS Modules.
- Keep global styles for shared tokens, resets, shell/stage rules, and reusable app chrome only.
- Reuse shared primitives for repeated UI patterns such as scene shells, two-panel storyboard reveals, avatar nodes, connector/channel rows, summary phone panels, and card shells.
- Add a new abstraction only when it removes meaningful duplication or clearly matches an existing pattern.
- Keep live text in code/config, not baked into newly created assets.
- Do not rename or move assets unless the task explicitly asks for it or the current naming blocks a clean implementation.

## Visual System
- Use Chalkboard SE from `public/font` for story typography.
- Use only approved CSS variables from `app/styles/base.css` for colors, overlays, shadows, and gradients.
- Do not add hardcoded hex colors in styling files.
- Opaque white scene surfaces should use `--color-bg-white`; inverse scenes should use `--color-bg-inverse` and `--color-text-inverse`.
- All interactive elements must use `cursor: pointer`.
- Prevent horizontal page panning on desktop and mobile.
- The story should feel like a continuous world, not a stack of unrelated slides.

## Motion And Audio
- Use GSAP ScrollTrigger pinning for scene reveal budgets; do not rely on CSS `position: sticky` for pinned story scenes.
- Treat `scrollLength` as a scene scroll budget derived from the shared timing model.
- A pinned scene should stay pinned until its intended visible elements have reached full opacity.
- Use proximity-style scroll snap only as a soft settling aid; ScrollTrigger owns reveal timing and pinning.
- Use the fixed top-left sound toggle as the global sound control.
- Keep chapter background music and cue effects routed through the shared sound provider.
- When chapter menu options jump to anchors, scene cue effects should be suppressed briefly while background music continues.
- Play `public/sound/disconnect.mp3` when payment channels become closed in Chapter 1 scene 7 and Chapter 2 scene 13.
- Avoid negative-margin overlap hacks such as `margin-bottom: -100dvh`.

## Assets
- Chapter assets are stored under `public/chapter1/` and `public/chapter2/`.
- Prefer existing local assets before adding new ones.
- Keep asset references aligned with scene definitions in `lib/story-content/`.
- Do not reference removed assets or deleted old scene numbers.

## Verification
- Run `npm run typecheck` after code changes.
- Run `npm run build` when the change affects production behavior; if the known Next build step stalls, stop it and report that clearly.
- For visual, layout, spacing, animation, and transition work, verify the live page in the in-app browser when feasible.
- Do not claim visual behavior is fixed based only on code inspection when the user asked for fit, spacing, viewport anchoring, or animation behavior.
