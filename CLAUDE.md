# Times Tables Challenge

## Project Overview
A kid-friendly web app for practising multiplication tables (1x through 12x). Designed for children around age 9. The app is a timed quiz game with a 60-second countdown, scoring, streaks, confetti effects, sound, and a leaderboard.

## Architecture
Static frontend — no build tools, no frameworks, no dependencies. Three files:

- `index.html` — Structure only. Six screens managed via `.screen.active` class toggling: welcome, menu, countdown, game, results, leaderboard.
- `styles.css` — All styling. Uses CSS custom properties in `:root` for theming. Organised by screen/section with comment headers.
- `app.js` — All logic. Organised into clearly labelled sections: constants, state, DOM refs, screen nav, player name, leaderboard storage, question generation, countdown, game logic, timer, end game, sound, confetti, event listeners.

## Key Design Decisions
- **Type-the-answer** format (not multiple choice) — builds real recall.
- **60-second timed rounds** — creates excitement, kids try to beat their score.
- **Streak bonus scoring** — base 10 points per correct answer, +5 bonus for every 3 consecutive correct answers.
- **localStorage persistence** — player name and leaderboard (top 10) persist across sessions.
- **DOM methods only** — no innerHTML; all dynamic content built with createElement/textContent for safety.
- **Single AudioContext per tone** — simple sine wave bleeps for correct/wrong feedback.

## Conventions
- Constants are ALL_CAPS at the top of app.js — tune game settings there.
- DOM references are collected in a single `dom` object, grouped by screen.
- Game state lives in a single `state` object — reset at each game start.
- CSS uses BEM-lite naming (`.timer-bar-bg`, `.wrong-answer-item`).
- No external assets — confetti is canvas-drawn, sounds are Web Audio API tones.

## Hosting
Fully static — serve from any web server, VPS, S3, or open index.html directly in a browser.
