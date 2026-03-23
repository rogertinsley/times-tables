# Times Tables Challenge

A fun, fast-paced multiplication quiz for kids. Pick a times table (or mix them all up) and answer as many questions as you can in 60 seconds.

## Features

- **1x to 12x tables** — practise a specific table or mix them all together
- **60-second timed rounds** — race against the clock
- **Streak scoring** — bonus points for consecutive correct answers
- **Confetti and sound effects** — celebrations on correct answers and high scores
- **Leaderboard** — top 10 scores saved locally, with gold/silver/bronze medals
- **Multi-player support** — switch between players to compete on the same device
- **Wrong answer review** — see which questions you got wrong at the end of each round
- **Mobile friendly** — responsive design that works on phones, tablets, and desktops

## Getting Started

No build step, no dependencies. Just open it in a browser:

```
open index.html
```

Or serve it from any web server:

```
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and screens |
| `styles.css` | All styling and animations |
| `app.js` | Game logic, scoring, leaderboard, sound, and confetti |

## How Scoring Works

- **10 points** per correct answer
- **+5 bonus** for every 3 answers in a row (streak bonus)
- Top 10 scores are saved to the leaderboard with player name, table, and date

## Customisation

Game constants are at the top of `app.js`:

```js
const GAME_DURATION = 60;    // seconds per round
const POINTS_BASE = 10;      // points per correct answer
const STREAK_BONUS = 5;      // extra points per 3-streak
const LEADERBOARD_MAX = 10;  // max leaderboard entries
```

## License

MIT
