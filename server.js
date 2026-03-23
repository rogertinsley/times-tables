const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

// ── Config ─────────────────────────────
const PORT = process.env.PORT || 3000;
const LEADERBOARD_MAX = 10;

// ── Database ───────────────────────────
const dbPath = process.env.DB_PATH || path.join(__dirname, "leaderboard.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    tbl TEXT NOT NULL,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    date TEXT NOT NULL
  )
`);

const stmtGetTop = db.prepare(
  "SELECT name, score, tbl, correct, wrong, date FROM leaderboard ORDER BY score DESC LIMIT ?",
);

const stmtInsert = db.prepare(
  "INSERT INTO leaderboard (name, score, tbl, correct, wrong, date) VALUES (?, ?, ?, ?, ?, ?)",
);

const stmtPrune = db.prepare(`
  DELETE FROM leaderboard WHERE id NOT IN (
    SELECT id FROM leaderboard ORDER BY score DESC LIMIT ?
  )
`);

function getTop() {
  return stmtGetTop.all(LEADERBOARD_MAX).map((row) => ({
    name: row.name,
    score: row.score,
    table: row.tbl,
    correct: row.correct,
    wrong: row.wrong,
    date: row.date,
  }));
}

// ── Express ────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/leaderboard", (_req, res) => {
  res.json(getTop());
});

app.post("/api/leaderboard", (req, res) => {
  const { name, score, table, correct, wrong } = req.body;

  // Validate
  if (
    typeof name !== "string" || name.trim() === "" ||
    typeof score !== "number" || score <= 0 ||
    typeof table !== "string" ||
    typeof correct !== "number" || correct < 0 ||
    typeof wrong !== "number" || wrong < 0
  ) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const trimmedName = name.trim().slice(0, 20);
  const date = new Date().toLocaleDateString();

  stmtInsert.run(trimmedName, score, table, correct, wrong, date);
  stmtPrune.run(LEADERBOARD_MAX);

  res.json(getTop());
});

app.listen(PORT, () => {
  console.log(`Times Tables server running on http://localhost:${PORT}`);
});
