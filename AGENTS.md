# Fiber Storybook Agent Guide

## Project Goal
- This repo is a Next.js + React scroll-storybook that demonstrates real-world Fiber Network payment flows through Pico's airport journey.
- Chapter 1 explains pay-by-use micropayments for a nap service.
- Chapter 2 explains how one Fiber Airport Pass session can streamline multiple airport services across CKB and USD.
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
- Chapter 2 has 14 scenes. It no longer includes the power-bank service flow.
- Current service topology is Pico -> Fiber Airport Pass -> luggage storage and massage chair.
- Scene 5 is the source layout for the Chapter 2 topology board: Pico channel plus existing luggage/massage service channels. Scene 13 should follow this same board layout and only change the channel state/counts/caption.
- Scenes 8 and 11 use the route distribution board layout, not the scene 5 topology board. Scene 8 routes to luggage; scene 11 routes to massage.
- Scene 12 is the active usage board with a black inverse surface, live elapsed service times, three distribution meters, and the `End all services` action.
- Scene 14 is the Fiber Airport Pass receipt summary and should consume the settlement snapshot produced by scene 12.
- Keep Chapter 2 service nodes limited to luggage storage and massage chair unless a future task explicitly reintroduces another service.

## Chapter 2 Payment Model
- Chapter 2 payment constants live in `lib/story-content/multi-service-model.ts`.
- Pico total is `1000 CKB`.
- Scene 12 starts at `137 CKB` remaining and `863 CKB` paid, then auto-ends after 30 seconds at `104 CKB` remaining and `896 CKB` paid.
- Luggage charges `0.1 CKB / sec`.
- Massage charges `0.1 USD / sec`; use `10 CKB = 1 USD`, so massage drains Pico at `1 CKB / sec`.
- While luggage and massage both run, Pico drains at `1.1 CKB / sec`.
- Luggage elapsed time is `2600 -> 2630 sec`; massage elapsed time is `603 -> 633 sec`.
- Settlement and receipt scenes must use the live snapshot if users click `End all services` early.

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
- Chapter 2 assets are currently numbered for the 14-scene flow in `public/chapter2/`.
- Scene 2 uses `c2-storyboard-2-start.svg`, `c2-storyboard-2-mid.svg`, and `c2-storyboard-2-end.svg`.
- Scene 10 uses the current massage assets: `c2-storyboard-10-left-start.svg`, `c2-storyboard-10-left-end.svg`, and `c2-storyboard-10-right.svg`.
- Scene 14 uses `c2-storyboard-14-left-start.svg` and `c2-storyboard-14-left-end.svg` plus the rendered receipt panel.
- Do not reference removed power-bank assets or deleted old scene numbers.

## Verification
- Run `npm run typecheck` after code changes.
- Run `npm run build` when the change affects production behavior; if the known Next build step stalls, stop it and report that clearly.
- For visual, layout, spacing, animation, and transition work, verify the live page in the in-app browser when feasible.
- Do not claim visual behavior is fixed based only on code inspection when the user asked for fit, spacing, viewport anchoring, or animation behavior.
