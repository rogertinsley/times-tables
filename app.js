/* ========================================
   Times Tables Challenge — Main App
   ======================================== */

// ── Constants ──────────────────────────
const GAME_DURATION = 60;
const POINTS_BASE = 10;
const STREAK_BONUS = 5;
const TABLES_MIN = 1;
const TABLES_MAX = 12;
const FACTOR_MIN = 1;
const FACTOR_MAX = 12;
const FEEDBACK_MESSAGES_CORRECT = [
  "Nice!", "Awesome!", "Boom!", "Yes!", "Nailed it!",
  "On fire!", "Brilliant!", "Superstar!", "Legend!", "Smashed it!",
];
const FEEDBACK_MESSAGES_WRONG = [
  "Nope!", "Not quite!", "Try next time!", "Oops!",
];

const LEADERBOARD_MAX = 10;
const PLAYER_NAME_KEY = "tt-player-name";

// ── State ──────────────────────────────
const state = {
  playerName: "",
  selectedTable: null, // number or 'mix'
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  timeLeft: GAME_DURATION,
  timerInterval: null,
  currentQuestion: null,
  wrongAnswers: [],
  isProcessing: false,
  lastPlayedTable: null,
};

// ── DOM References ─────────────────────
const dom = {
  screens: {
    welcome: document.getElementById("welcome-screen"),
    menu: document.getElementById("menu-screen"),
    countdown: document.getElementById("countdown-screen"),
    game: document.getElementById("game-screen"),
    results: document.getElementById("results-screen"),
    leaderboard: document.getElementById("leaderboard-screen"),
  },
  welcome: {
    nameInput: document.getElementById("player-name"),
    letsGoBtn: document.getElementById("lets-go-btn"),
  },
  menu: {
    greeting: document.getElementById("player-greeting"),
    showLeaderboardBtn: document.getElementById("show-leaderboard-btn"),
    changePlayerBtn: document.getElementById("change-player-btn"),
  },
  leaderboardTabs: {
    container: document.getElementById("leaderboard-tabs"),
  },
  countdown: {
    number: document.getElementById("countdown-number"),
  },
  game: {
    timerBar: document.getElementById("timer-bar"),
    timerText: document.getElementById("timer-text"),
    scoreValue: document.getElementById("score-value"),
    question: document.getElementById("question"),
    answerInput: document.getElementById("answer-input"),
    submitBtn: document.getElementById("submit-answer-btn"),
    feedback: document.getElementById("feedback"),
    streakDisplay: document.getElementById("streak-display"),
  },
  results: {
    title: document.getElementById("results-title"),
    finalScore: document.getElementById("final-score"),
    finalCorrect: document.getElementById("final-correct"),
    finalWrong: document.getElementById("final-wrong"),
    finalStreak: document.getElementById("final-streak"),
    newHighScore: document.getElementById("new-high-score"),
    wrongReview: document.getElementById("wrong-answers-review"),
    playAgainBtn: document.getElementById("play-again-btn"),
    backToMenuBtn: document.getElementById("back-to-menu-btn"),
  },
  leaderboard: {
    table: document.getElementById("leaderboard-table"),
    backBtn: document.getElementById("leaderboard-back-btn"),
  },
  confettiCanvas: document.getElementById("confetti-canvas"),
};

// ── Screen Navigation ──────────────────
function showScreen(name) {
  Object.values(dom.screens).forEach((s) => s.classList.remove("active"));
  dom.screens[name].classList.add("active");
}

// ── Player Name ────────────────────────
function getSavedPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || "";
}

function savePlayerName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

function enterMenu() {
  dom.menu.greeting.textContent = `Ready, ${state.playerName}?`;
  showScreen("menu");
}

// ── Leaderboard API ────────────────────
async function getLeaderboard(table) {
  try {
    const res = await fetch(`/api/leaderboard?table=${encodeURIComponent(table)}`);
    return await res.json();
  } catch {
    return [];
  }
}

async function saveToLeaderboard(name, score, table, correct, wrong) {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        score,
        table: table === "mix" ? "Mix" : `${table}x`,
        correct,
        wrong,
      }),
    });
    return await res.json();
  } catch {
    return [];
  }
}

async function isNewHighScore(score, table) {
  const board = await getLeaderboard(table);
  if (board.length < LEADERBOARD_MAX) return score > 0;
  return score > board[board.length - 1].score;
}

async function renderLeaderboard(table) {
  const board = await getLeaderboard(table);
  dom.leaderboard.table.textContent = "";

  highlightLeaderboardTab(table);

  if (board.length === 0) {
    const empty = document.createElement("div");
    empty.className = "lb-empty";
    empty.textContent = "No scores yet. Be the first!";
    dom.leaderboard.table.appendChild(empty);
    return;
  }

  // Header row
  const header = document.createElement("div");
  header.className = "lb-header";
  ["#", "Player", "Score"].forEach((text) => {
    const cell = document.createElement("span");
    cell.textContent = text;
    if (text === "Score") cell.style.textAlign = "right";
    header.appendChild(cell);
  });
  dom.leaderboard.table.appendChild(header);

  const medals = ["gold", "silver", "bronze"];

  board.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "lb-row";
    if (i < 3) row.classList.add(medals[i]);

    const rank = document.createElement("span");
    rank.className = "lb-rank";
    rank.textContent = i < 3 ? ["1st", "2nd", "3rd"][i] : `${i + 1}`;
    row.appendChild(rank);

    const name = document.createElement("span");
    name.className = "lb-name";
    name.textContent = entry.name;
    row.appendChild(name);

    const score = document.createElement("span");
    score.className = "lb-score";
    score.textContent = entry.score;
    row.appendChild(score);

    dom.leaderboard.table.appendChild(row);
  });
}

// ── Question Generation ────────────────
function generateQuestion() {
  let a, b;

  if (state.selectedTable === "mix") {
    a = randomInt(TABLES_MIN, TABLES_MAX);
  } else {
    a = state.selectedTable;
  }

  b = randomInt(FACTOR_MIN, FACTOR_MAX);

  // Randomly swap so questions feel varied (e.g. 3×7 and 7×3)
  if (Math.random() > 0.5) {
    [a, b] = [b, a];
  }

  return { a, b, answer: a * b };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Countdown ──────────────────────────
function startCountdown(callback) {
  showScreen("countdown");
  let count = 3;
  dom.countdown.number.textContent = count;
  dom.countdown.number.style.animation = "none";

  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      dom.countdown.number.textContent = "Go!";
      dom.countdown.number.style.color = "var(--color-success)";
      dom.countdown.number.style.animation = "none";
      void dom.countdown.number.offsetWidth;
      dom.countdown.number.style.animation = "countdownPulse 0.6s ease";

      setTimeout(() => {
        dom.countdown.number.style.color = "var(--color-accent)";
        callback();
      }, 500);
    } else {
      dom.countdown.number.textContent = count;
      dom.countdown.number.style.animation = "none";
      void dom.countdown.number.offsetWidth;
      dom.countdown.number.style.animation = "countdownPulse 0.6s ease";
    }
  }, 800);
}

// ── Game Logic ─────────────────────────
function startGame(table) {
  state.selectedTable = table;
  state.lastPlayedTable = table === "mix" ? "Mix" : `${table}x`;
  state.score = 0;
  state.correct = 0;
  state.wrong = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.timeLeft = GAME_DURATION;
  state.wrongAnswers = [];
  state.isProcessing = false;

  startCountdown(() => {
    showScreen("game");
    resetGameUI();
    nextQuestion();
    startTimer();
    dom.game.answerInput.focus();
  });
}

function resetGameUI() {
  dom.game.scoreValue.textContent = "0";
  dom.game.timerText.textContent = GAME_DURATION;
  dom.game.timerBar.style.width = "100%";
  dom.game.timerBar.className = "timer-bar";
  dom.game.feedback.textContent = "";
  dom.game.feedback.className = "feedback";
  dom.game.streakDisplay.textContent = "";
  dom.game.answerInput.value = "";
  dom.game.answerInput.className = "answer-input";
}

function displayQuestion(a, b) {
  dom.game.question.textContent = "";
  dom.game.question.append(`${a} \u00D7 ${b} = `);
}

function nextQuestion() {
  state.currentQuestion = generateQuestion();
  const { a, b } = state.currentQuestion;
  displayQuestion(a, b);
  dom.game.answerInput.value = "";
  dom.game.answerInput.className = "answer-input";
  dom.game.answerInput.focus();
}

function submitAnswer() {
  if (state.isProcessing) return;

  const input = dom.game.answerInput.value.trim();
  if (input === "") return;

  const userAnswer = parseInt(input, 10);
  const isCorrect = userAnswer === state.currentQuestion.answer;
  state.isProcessing = true;

  if (isCorrect) {
    handleCorrect();
  } else {
    handleWrong(userAnswer);
  }

  // Brief pause so feedback is visible, then next question
  setTimeout(() => {
    if (state.timeLeft > 0) {
      dom.game.feedback.textContent = "";
      dom.game.feedback.className = "feedback";
      nextQuestion();
      state.isProcessing = false;
    }
  }, 400);
}

function handleCorrect() {
  state.correct++;
  state.streak++;
  if (state.streak > state.bestStreak) {
    state.bestStreak = state.streak;
  }

  const points = POINTS_BASE + Math.floor(state.streak / 3) * STREAK_BONUS;
  state.score += points;

  // Update UI
  dom.game.scoreValue.textContent = state.score;
  dom.game.scoreValue.classList.remove("bump");
  void dom.game.scoreValue.offsetWidth;
  dom.game.scoreValue.classList.add("bump");

  dom.game.answerInput.className = "answer-input correct";
  dom.game.feedback.textContent = randomItem(FEEDBACK_MESSAGES_CORRECT);
  dom.game.feedback.className = "feedback correct";

  if (state.streak >= 3) {
    dom.game.streakDisplay.textContent = `${state.streak} in a row!`;
  }

  // Mini confetti burst on correct answer
  spawnConfetti(8);

  playTone(800, 0.08);
}

function handleWrong(userAnswer) {
  state.wrong++;
  state.streak = 0;

  const { a, b, answer } = state.currentQuestion;
  state.wrongAnswers.push({ a, b, answer, userAnswer });

  dom.game.answerInput.className = "answer-input wrong";

  const msg = randomItem(FEEDBACK_MESSAGES_WRONG);
  dom.game.feedback.textContent = `${msg} It's ${answer}`;
  dom.game.feedback.className = "feedback wrong";
  dom.game.streakDisplay.textContent = "";

  playTone(200, 0.1);
}

// ── Timer ──────────────────────────────
function startTimer() {
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  dom.game.timerText.textContent = state.timeLeft;
  const pct = (state.timeLeft / GAME_DURATION) * 100;
  dom.game.timerBar.style.width = `${pct}%`;

  dom.game.timerBar.classList.remove("warning", "danger");
  if (state.timeLeft <= 10) {
    dom.game.timerBar.classList.add("danger");
  } else if (state.timeLeft <= 20) {
    dom.game.timerBar.classList.add("warning");
  }
}

// ── End Game ───────────────────────────
async function endGame() {
  state.isProcessing = true;

  const tableKey = state.selectedTable === "mix" ? "Mix" : `${state.selectedTable}x`;
  const madeBoard = await isNewHighScore(state.score, tableKey);

  // Save to leaderboard
  if (state.score > 0) {
    await saveToLeaderboard(
      state.playerName,
      state.score,
      state.selectedTable,
      state.correct,
      state.wrong,
    );
  }

  // Populate results
  dom.results.finalScore.textContent = state.score;
  dom.results.finalCorrect.textContent = state.correct;
  dom.results.finalWrong.textContent = state.wrong;
  dom.results.finalStreak.textContent = state.bestStreak;

  if (madeBoard && state.score > 0) {
    dom.results.newHighScore.classList.add("visible");
    spawnConfetti(60);
  } else {
    dom.results.newHighScore.classList.remove("visible");
  }

  // Title based on performance
  const total = state.correct + state.wrong;
  const accuracy = total > 0 ? state.correct / total : 0;
  if (accuracy >= 0.9) {
    dom.results.title.textContent = "Amazing!";
  } else if (accuracy >= 0.7) {
    dom.results.title.textContent = "Great Job!";
  } else if (accuracy >= 0.5) {
    dom.results.title.textContent = "Good Try!";
  } else {
    dom.results.title.textContent = "Keep Practising!";
  }

  // Wrong answers review
  buildWrongAnswersReview();

  showScreen("results");
}

function buildWrongAnswersReview() {
  dom.results.wrongReview.textContent = "";

  if (state.wrongAnswers.length === 0) return;

  const heading = document.createElement("h3");
  heading.textContent = "Review these:";
  dom.results.wrongReview.appendChild(heading);

  state.wrongAnswers.forEach(({ a, b, answer, userAnswer }) => {
    const item = document.createElement("div");
    item.className = "wrong-answer-item";

    const questionText = document.createTextNode(`${a} \u00D7 ${b} = `);
    item.appendChild(questionText);

    const correctSpan = document.createElement("span");
    correctSpan.className = "correct-answer";
    correctSpan.textContent = answer;
    item.appendChild(correctSpan);

    const yourAnswer = document.createElement("span");
    yourAnswer.style.color = "var(--color-text-muted)";
    yourAnswer.textContent = ` (you said ${userAnswer})`;
    item.appendChild(yourAnswer);

    dom.results.wrongReview.appendChild(item);
  });
}

// ── Sound ──────────────────────────────
function playTone(freq, duration) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — fail silently
  }
}

// ── Confetti ───────────────────────────
const confettiParticles = [];

function spawnConfetti(count) {
  const canvas = dom.confettiCanvas;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const colors = ["#e94560", "#f5c518", "#00c853", "#2196f3", "#ff9800", "#e040fb"];

  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 10 - 4,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      life: 1,
    });
  }

  if (confettiParticles.length === count) {
    animateConfetti();
  }
}

function animateConfetti() {
  const canvas = dom.confettiCanvas;
  const ctx = canvas.getContext("2d");

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.vy += 0.3;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= 0.015;

      if (p.life <= 0) {
        confettiParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (confettiParticles.length > 0) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

// ── Leaderboard Tabs ──────────────────
function buildLeaderboardTabs() {
  const container = dom.leaderboardTabs.container;
  const tables = ["Mix", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x", "11x", "12x"];

  tables.forEach((tbl) => {
    const btn = document.createElement("button");
    btn.className = "lb-tab";
    btn.textContent = tbl === "Mix" ? "Mix" : tbl.replace("x", "");
    btn.dataset.table = tbl;
    btn.addEventListener("click", async () => {
      highlightLeaderboardTab(tbl);
      await renderLeaderboard(tbl);
    });
    container.appendChild(btn);
  });
}

function highlightLeaderboardTab(activeTable) {
  dom.leaderboardTabs.container.querySelectorAll(".lb-tab").forEach((btn) => {
    btn.classList.toggle("lb-tab-active", btn.dataset.table === activeTable);
  });
}

// ── Event Listeners ────────────────────
function init() {
  buildLeaderboardTabs();
  // Welcome screen — check for saved name
  const savedName = getSavedPlayerName();
  if (savedName) {
    state.playerName = savedName;
    dom.welcome.nameInput.value = savedName;
    enterMenu();
  }

  // Welcome screen — name input
  dom.welcome.nameInput.addEventListener("input", () => {
    dom.welcome.letsGoBtn.disabled = dom.welcome.nameInput.value.trim() === "";
  });
  dom.welcome.letsGoBtn.disabled = dom.welcome.nameInput.value.trim() === "";

  dom.welcome.letsGoBtn.addEventListener("click", () => {
    const name = dom.welcome.nameInput.value.trim();
    if (!name) return;
    state.playerName = name;
    savePlayerName(name);
    enterMenu();
  });

  dom.welcome.nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      dom.welcome.letsGoBtn.click();
    }
  });

  // Change player
  dom.menu.changePlayerBtn.addEventListener("click", () => {
    dom.welcome.nameInput.value = "";
    dom.welcome.letsGoBtn.disabled = true;
    showScreen("welcome");
    dom.welcome.nameInput.focus();
  });

  // Table selection buttons
  document.querySelectorAll(".table-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const table = btn.dataset.table;
      startGame(table === "mix" ? "mix" : parseInt(table, 10));
    });
  });

  // Submit answer on Enter
  dom.game.answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  });

  // Submit answer on GO button tap/click
  dom.game.submitBtn.addEventListener("click", () => {
    submitAnswer();
    dom.game.answerInput.focus();
  });

  // Results screen buttons
  dom.results.playAgainBtn.addEventListener("click", () => {
    startGame(state.selectedTable);
  });

  dom.results.backToMenuBtn.addEventListener("click", () => {
    enterMenu();
  });

  // Leaderboard
  dom.menu.showLeaderboardBtn.addEventListener("click", async () => {
    const defaultTable = state.lastPlayedTable || "Mix";
    showScreen("leaderboard");
    await renderLeaderboard(defaultTable);
  });

  dom.leaderboard.backBtn.addEventListener("click", () => {
    enterMenu();
  });
}

init();
