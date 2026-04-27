const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

// ── Config ─────────────────────────────
const PORT = process.env.PORT || 3000;
const LEADERBOARD_MAX = 10;

// ── Database ───────────────────────────
const fs = require("fs");
const dbPath = process.env.DB_PATH || path.join(__dirname, "leaderboard.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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
    date TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'multiply'
  )
`);

// Migrate: add mode column if missing (existing rows get 'multiply')
try {
  db.exec("ALTER TABLE leaderboard ADD COLUMN mode TEXT NOT NULL DEFAULT 'multiply'");
} catch {
  // Column already exists — ignore
}

const stmtGetTop = db.prepare(
  "SELECT name, score, tbl, correct, wrong, date, mode FROM leaderboard WHERE tbl = ? AND mode = ? ORDER BY score DESC LIMIT ?",
);

const stmtInsert = db.prepare(
  "INSERT INTO leaderboard (name, score, tbl, correct, wrong, date, mode) VALUES (?, ?, ?, ?, ?, ?, ?)",
);

const stmtPrune = db.prepare(`
  DELETE FROM leaderboard WHERE tbl = ? AND mode = ? AND id NOT IN (
    SELECT id FROM leaderboard WHERE tbl = ? AND mode = ? ORDER BY score DESC LIMIT ?
  )
`);

function getTop(tbl, mode) {
  return stmtGetTop.all(tbl, mode, LEADERBOARD_MAX).map((row) => ({
    name: row.name,
    score: row.score,
    table: row.tbl,
    correct: row.correct,
    wrong: row.wrong,
    date: row.date,
    mode: row.mode,
  }));
}

// ── Express ────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/leaderboard", (req, res) => {
  const tbl = req.query.table;
  const mode = req.query.mode || "multiply";
  if (!tbl) return res.status(400).json({ error: "table param required" });
  res.json(getTop(tbl, mode));
});

app.post("/api/leaderboard", (req, res) => {
  const { name, score, table, correct, wrong, mode } = req.body;
  const validMode = mode === "divide" ? "divide" : mode === "fractions" ? "fractions" : "multiply";

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

  stmtInsert.run(trimmedName, score, table, correct, wrong, date, validMode);
  stmtPrune.run(table, validMode, table, validMode, LEADERBOARD_MAX);

  res.json(getTop(table, validMode));
});

app.listen(PORT, () => {
  console.log(`Times Tables server running on http://localhost:${PORT}`);
});
