# Refugio

A logic puzzle game about rescuing cats. Solve boards to earn cans, rescue ten cats with their own powers, and restore a run-down shelter room by room. It runs in the browser, with no sign-up.

"Refugio" is Spanish for shelter.

Built by **Francisco Sucatti**.

## How to play

1. The short tutorial teaches the rules and rescues your first cat.
2. Each number shows how many angry cats are hiding in the surrounding tiles. Reveal the safe tiles without waking a cat. Every board can be solved with logic alone.
3. Spend the cans you earn on rescuing cats and upgrading rooms.
4. Choose a companion before you play. Each cat has a power you can use once per board.
5. Come back for the daily challenge: one board for everyone, one attempt, and a streak to keep alive. You can share your result with a link that opens the same board.

## Controls

| Action | Mouse | Touch |
|---|---|---|
| Reveal a tile | Left click | Tap |
| Mark a tile | Right click | Long press, or switch to Mark |

The speaker button sets the volume of the effects and the music, or mutes everything.

## Your data

Your progress stays in your browser. There are no accounts, ads or tracking. Clearing your browser data deletes your progress.

## Built with

React, TypeScript, Zustand, Vite, the Web Audio API, Vitest, Playwright and Cloudflare Workers.

## Run it locally

You need Node.js 22 or later.

```bash
npm install
```

```bash
npm run dev
```

| Command | What it does |
|---|---|
| `npm test` | Tests the game logic |
| `npm run test:e2e` | Tests the game in the browser. It uses Microsoft Edge |

## Credits

The cats, rooms and icons were generated with AI using GPT Image 2.5 and turned into true pixel art with [a script in this repository](scripts/pixelate.mjs). The prompts are in [art/prompts.md](art/prompts.md). The sound effects and music are synthesized in the browser.
