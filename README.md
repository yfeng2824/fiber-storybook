# Fiber Storybook

A scroll-driven interactive storybook that demonstrates real-world [Fiber Network](https://github.com/nervosnetwork/fiber) payment scenarios through Pico's airport journey.

Built with **Next.js**, **React**, **GSAP ScrollTrigger**, and **Tailwind CSS**.

---

## What Is Fiber Storybook?

Fiber Storybook is an interactive, scroll-driven demo that explains Fiber Network payment concepts through a visual narrative. Follow Pico — a traveler at the airport — as they discover how Fiber's payment channels work in everyday situations.

The storybook currently features two chapters:

### Chapter 1: Airport Nap — Pay-As-You-Use Micropayments

Pico needs a quick nap between flights. They compare a traditional nap pod (fixed-duration packages, pay upfront) with a Fiber-powered pod that charges **only for the seconds actually used**.

This chapter demonstrates:

- **Pay-as-you-go pricing** — no need to guess duration upfront
- **Payment channel lifecycle** — deposit, active usage, and settlement
- **Off-chain micropayments** — tiny per-second updates without Layer 1 congestion
- **Final settlement** — only the net result is written to Layer 1

### Chapter 2: Airport Pass — One Connection, Multiple Services

Pico wants several small airport services (luggage storage, power bank, massage chair) before boarding. Instead of approving each service separately with different assets, Pico uses a single **Fiber Airport Pass**.

This chapter demonstrates:

- **One Fiber connection coordinating multiple services**
- **Multi-asset support** — CKB, SUDT, and USD through the same pass
- **Automatic asset routing** — Fiber handles the asset match behind the scenes
- **Unified settlement** — one deposit, one approval, one final summary

---

## Project Structure

```
fiber-storybook/
├── app/                          # Next.js App Router
│   ├── chapters/airport-nap/     # Chapter route (redirects to home)
│   ├── globals.css               # Global styles + Tailwind imports
│   ├── layout.tsx                # Root layout with fonts & sound provider
│   └── page.tsx                  # Homepage — canonical story entry
│
├── components/
│   ├── providers/                # React context providers (sound)
│   ├── sound-toggle.tsx          # Ambient sound toggle
│   └── story/                    # Story implementation
│       ├── fiber-storybook.tsx   # Top-level story container
│       ├── airport-nap-story/    # Chapter 1 scene components
│       ├── multi-service-story/  # Chapter 2 scene components
│       └── shared/               # Cross-chapter primitives
│
├── lib/
│   ├── story-content/            # Chapter data, scene configs, copy
│   └── story-timing.ts           # Scroll length calculations
│
├── public/                       # Static assets
│   ├── chapter1/                 # Chapter 1 storyboards & avatars
│   ├── chapter2/                 # Chapter 2 storyboards & avatars
│   ├── font/                     # Chalkboard SE font files
│   ├── hero/                     # Hero section assets
│   ├── icon/                     # UI icons
│   ├── shared/                   # Shared visual assets
│   └── sound/                    # Ambient sound effects
│
├── next.config.ts                # Next.js configuration
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

### Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Entry point — renders the full storybook |
| `components/story/fiber-storybook.tsx` | Top-level container: hero, chapters, sound, navigation, progress |
| `lib/story-content/airport-nap.ts` | Chapter 1 scene definitions and copy |
| `lib/story-content/multi-service.ts` | Chapter 2 scene definitions and copy |
| `lib/story-content/types.ts` | Shared TypeScript types for scenes, chapters, and payment state |
| `components/story/shared/` | Reusable primitives: scene shells, two-panel storyboards, motion helpers |

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or 20+ LTS
- npm (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/yfeng2824/fiber-storybook.git
cd fiber-storybook

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |

---

## Contributing

We welcome ideas for new real-world Fiber scenarios and future chapters!

- **Open an issue** with your idea: [github.com/yfeng2824/fiber-storybook/issues/new](https://github.com/yfeng2824/fiber-storybook/issues/new)
- **Suggest a new chapter** — What everyday situation could best demonstrate another Fiber concept?
- **Report bugs** or **request features** via GitHub Issues

Whether you're a developer, designer, or just curious about Fiber, we'd love to hear from you.

---

## License

This project is open source and available under the MIT License.
