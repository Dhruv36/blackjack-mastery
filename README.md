# Blackjack Mastery — Casino Training System

A web app for practicing blackjack **basic strategy** and **Hi-Lo card counting**
before you sit at a real table. Play with virtual chips, get live coaching on every
decision, and track your strategy accuracy.

> For entertainment and educational use only. No real money is involved and the app
> does not facilitate gambling.

## Features
- Full 6-deck game: hit, stand, double, split (up to 4 hands), surrender, insurance
- Casino-accurate rules: dealer peek for blackjack, S17, 3:2 blackjack payout
- Live coach grades each decision against perfect basic strategy
- Hi-Lo running count and true count that only count visible cards
- Strategy charts (hard / soft / pairs) and a tips reference

## Tech
- React 18 + Vite
- A **pure, framework-free game engine** (`src/engine.js`) with a full test suite
  (`src/engine.test.js`), including a 20,000-game fuzz test that guarantees the game
  can never freeze or crash.

## Getting started
```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run unit + fuzz tests
npm run lint     # lint
npm run build    # production build -> dist/
npm run preview  # preview the production build locally
```

## Project structure
```
src/
  engine.js        Pure game logic (no React). The single source of truth.
  engine.test.js   Unit tests + 20k-game fuzz test.
  App.jsx          UI: table, controls, strategy & tips tabs.
  Card.jsx         Single playing-card component.
  theme.js         Colors, button styles, copy/text data.
  main.jsx         React entry point.
  index.css        Global styles + CSS keyframe animations.
```
The engine is intentionally separate from the UI so the proven game logic can be
tested and reused without touching React.

## Monetization (Google AdSense)
Ad placements are already built and wired up, but are inert (dashed placeholder
boxes) until you plug in a real AdSense account:

1. Sign up and get approved at https://www.google.com/adsense (requires a live,
   original site — this repo's GitHub Pages URL qualifies once deployed).
2. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID in **both**:
   - `index.html` (the `<script ... adsbygoogle.js?client=...>` tag)
   - `src/ads.js` (`ADSENSE_CLIENT`)
3. In the AdSense dashboard, create one ad unit per placement and paste the
   slot IDs into `AD_SLOTS` in `src/ads.js`:
   - `topBanner` / `bottomBanner` — horizontal banners around the game
   - `sidebar` — vertical banner shown beside the table on wide screens
   - `interstitial` — shown in a modal every `INTERSTITIAL_EVERY_HANDS` rounds
4. Uncomment and fill in your publisher ID in `public/ads.txt`.
5. Commit and push — the GitHub Actions workflow redeploys automatically.

The interstitial requires a short minimum view (`INTERSTITIAL_MIN_WAIT_SEC`)
before "Continue" unlocks. Don't shorten the interval or wait time much further
— showing a fresh ad on every hand reads as invalid/inflated traffic to AdSense
and risks your account.

## Deployment
This is a static site — any static host works. Two one-command options:

### Vercel (recommended)
```bash
npm i -g vercel
vercel          # follow prompts (first run links the project)
vercel --prod   # deploy to production
```
`vercel.json` is already configured (SPA routing + asset caching).

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --build           # draft URL
netlify deploy --build --prod    # production
```
`netlify.toml` is already configured.

### GitHub Pages / others
Run `npm run build` and serve the `dist/` folder from any static host.

## Continuous integration
`.github/workflows/ci.yml` runs lint, tests, and build on every push and PR to `main`.
