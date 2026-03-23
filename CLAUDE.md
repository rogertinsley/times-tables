# Times Tables Challenge

## Project Overview
A kid-friendly web app for practising multiplication tables (1x through 12x). Designed for children around age 9. The app is a timed quiz game with a 60-second countdown, scoring, streaks, confetti effects, sound, and a server-side leaderboard.

## Architecture
Frontend + lightweight Node.js backend.

### Frontend (no build tools, no frameworks)
- `index.html` — Structure only. Six screens managed via `.screen.active` class toggling: welcome, menu, countdown, game, results, leaderboard.
- `styles.css` — All styling. Uses CSS custom properties in `:root` for theming. Organised by screen/section with comment headers.
- `app.js` — All client logic. Organised into clearly labelled sections: constants, state, DOM refs, screen nav, player name, leaderboard API calls, question generation, countdown, game logic, timer, end game, sound, confetti, event listeners.

### Backend
- `server.js` — Express server with better-sqlite3. Serves static files and exposes two API endpoints:
  - `GET /api/leaderboard` — returns top 10 scores
  - `POST /api/leaderboard` — submits a new score, prunes to top 10, returns updated board
- `leaderboard.db` — SQLite database, auto-created on first run (gitignored). Path configurable via `DB_PATH` env var.
- `package.json` — dependencies: express, better-sqlite3. Start with `npm start`.

### Docker / Dokploy
- `Dockerfile` — Node 20 slim image, runs `npm ci --omit=dev`, exposes port 3000.
- `.dockerignore` — excludes node_modules, .git, .agents, .claude, and the DB file.
- **Persistent storage required**: mount a volume and set `DB_PATH` (e.g. `DB_PATH=/data/leaderboard.db`) so the leaderboard survives redeployments.

## Key Design Decisions
- **Type-the-answer** format (not multiple choice) — builds real recall.
- **60-second timed rounds** — creates excitement, kids try to beat their score.
- **Streak bonus scoring** — base 10 points per correct answer, +5 bonus for every 3 consecutive correct answers.
- **Server-side leaderboard** — top 10 scores stored in SQLite via REST API. Player name stored in localStorage.
- **DOM methods only** — no innerHTML; all dynamic content built with createElement/textContent for safety.
- **Single AudioContext per tone** — simple sine wave bleeps for correct/wrong feedback.
- **Prepared statements** — all SQL uses prepared statements to prevent injection.

## Conventions
- Constants are ALL_CAPS at the top of app.js — tune game settings there.
- DOM references are collected in a single `dom` object, grouped by screen.
- Game state lives in a single `state` object — reset at each game start.
- Leaderboard functions are async (fetch-based). `endGame` is also async.
- CSS uses BEM-lite naming (`.timer-bar-bg`, `.wrong-answer-item`).
- No external assets — confetti is canvas-drawn, sounds are Web Audio API tones.
- The DB column is `tbl` (not `table`) to avoid the SQL reserved word; mapped to `table` in JSON responses.

## Running

### Local
```
npm install
npm start
```
Visit `http://localhost:3000`. Port configurable via `PORT` env var.

### Docker
```
docker build -t times-tables .
docker run -p 3000:3000 -v times-tables-data:/data -e DB_PATH=/data/leaderboard.db times-tables
```
