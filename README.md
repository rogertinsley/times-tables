# Times Tables Challenge

A fun, fast-paced multiplication quiz for kids. Pick a times table (or mix them all up) and answer as many questions as you can in 60 seconds.

## Features

- **1x to 12x tables** — practise a specific table or mix them all together
- **60-second timed rounds** — race against the clock
- **Streak scoring** — bonus points for consecutive correct answers
- **Confetti and sound effects** — celebrations on correct answers and high scores
- **Server-side leaderboard** — top 10 scores persisted in SQLite, with gold/silver/bronze medals
- **Multi-player support** — switch between players to compete on the same device
- **Wrong answer review** — see which questions you got wrong at the end of each round
- **Mobile friendly** — responsive design that works on phones, tablets, and desktops

## Getting Started

```
npm install
npm start
```

Visit `http://localhost:3000`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and screens |
| `styles.css` | All styling and animations |
| `app.js` | Game logic, scoring, API calls, sound, and confetti |
| `server.js` | Express server with SQLite leaderboard API |
| `package.json` | Dependencies and start script |
| `Dockerfile` | Container image for Docker/Dokploy deployment |

## How Scoring Works

- **10 points** per correct answer
- **+5 bonus** for every 3 answers in a row (streak bonus)
- Top 10 scores are saved to the leaderboard with player name, table, and date

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Returns top 10 scores |
| POST | `/api/leaderboard` | Submit a score, returns updated top 10 |

## Customisation

Game constants are at the top of `app.js`:

```js
const GAME_DURATION = 60;    // seconds per round
const POINTS_BASE = 10;      // points per correct answer
const STREAK_BONUS = 5;      // extra points per 3-streak
const LEADERBOARD_MAX = 10;  // max leaderboard entries
```

Server port is configurable via the `PORT` environment variable (default: 3000).

## Docker / Dokploy

```
docker build -t times-tables .
docker run -p 3000:3000 -v times-tables-data:/data -e DB_PATH=/data/leaderboard.db times-tables
```

For Dokploy: set `DB_PATH=/data/leaderboard.db` as an environment variable and mount a persistent volume at `/data` so leaderboard scores survive redeployments.

## License

MIT
