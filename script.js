const STORAGE_KEY = "maunazo-progress-v2";
const SOLVED_KEY = "maunazo-solved-v2";
const TIMER_START_KEY = "maunazo-timer-start-v1";
const TIMER_END_KEY = "maunazo-timer-end-v1";

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const clearScreen = document.getElementById("clearScreen");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const restartBtn = document.getElementById("restartBtn");

const questionTitle = document.getElementById("questionTitle");
const questionText = document.getElementById("questionText");
const questionImage = document.getElementById("questionImage");
const questionImageWrap = document.getElementById("questionImageWrap");
const hintText = document.getElementById("hintText");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const message = document.getElementById("message");
const questionNav = document.getElementById("questionNav");
const clearTime = document.getElementById("clearTime");
const liveTimer = document.getElementById("liveTimer");

const resetModal = document.getElementById("resetModal");
const cancelResetBtn = document.getElementById("cancelResetBtn");
const confirmResetBtn = document.getElementById("confirmResetBtn");

const clearOverlay = document.getElementById("clearOverlay");

const correctOverlay =
  document.getElementById("correctOverlay");

const finalJudgeOverlay =
  document.getElementById("finalJudgeOverlay");

let highestUnlocked = Number(localStorage.getItem(STORAGE_KEY) || 0);
let timerInterval = null;

if (
  Number.isNaN(highestUnlocked) ||
  highestUnlocked < 0 ||
  highestUnlocked >= QUESTIONS.length
) {
  highestUnlocked = 0;
}

let currentQuestion = highestUnlocked;

let solvedQuestions;

try {
  solvedQuestions = JSON.parse(
    localStorage.getItem(SOLVED_KEY) || "[]"
  );
} catch {
  solvedQuestions = [];
}

if (!Array.isArray(solvedQuestions)) {
  solvedQuestions = [];
}

function normalizeAnswer(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function showScreen(screen) {
  [startScreen, gameScreen, clearScreen].forEach((el) => {
    el.classList.remove("active");
  });

  screen.classList.add("active");
}

function renderNavigation() {
  questionNav.innerHTML = "";

  QUESTIONS.forEach((q, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "question-nav-button";
    button.textContent =
      index === QUESTIONS.length - 1
        ? "FINAL"
        : `Q${index + 1}`;

    if (solvedQuestions.includes(index)) {
      button.classList.add("solved");
    }

    if (index === currentQuestion) {
      button.classList.add("current");
    }

    if (index > highestUnlocked) {
      button.disabled = true;
      button.classList.add("locked");
    }

    button.addEventListener("click", () => {
      if (index <= highestUnlocked) {
        currentQuestion = index;
        renderQuestion();
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    });

    questionNav.appendChild(button);
  });
}

function renderQuestion() {
  const q = QUESTIONS[currentQuestion];

  questionTitle.textContent = q.title;
  questionText.textContent = q.text || "";
  hintText.textContent =
    q.hint || "ヒントはありません。";

  progressText.textContent =
    `${currentQuestion + 1} / ${QUESTIONS.length}`;

  progressBar.style.width =
    `${((highestUnlocked + 1) / QUESTIONS.length) * 100}%`;

  if (q.image) {
    questionImage.src = q.image;
    questionImage.alt = `${q.title}の謎画像`;
    questionImageWrap.classList.remove("hidden");
  } else {
    questionImage.removeAttribute("src");
    questionImageWrap.classList.add("hidden");
  }

  // 正解済みか確認
const isSolved = solvedQuestions.includes(currentQuestion);

if (isSolved) {

  // 正解済みなら正解を表示
  answerInput.value = q.answers[0];

  // 入力できないようにする
  answerInput.disabled = true;

  // SUBMITボタンも無効化
  const submitButton =
    answerForm.querySelector('button[type="submit"]');

  submitButton.disabled = true;
  submitButton.textContent = "CLEARED";

  message.textContent = "";
  message.className = "message";

} else {

  // 未正解なら通常状態
  answerInput.value = "";
  answerInput.disabled = false;

  const submitButton =
    answerForm.querySelector('button[type="submit"]');

  submitButton.disabled = false;
  submitButton.textContent = "SUBMIT";

  message.textContent = "";
  message.className = "message";
}

  const hintBox = document.querySelector(".hint-box");
  hintBox.open = false;

  renderNavigation();
  showScreen(gameScreen);
}

function startGame() {
  currentQuestion = Math.min(
    highestUnlocked,
    QUESTIONS.length - 1
  );

  if (!localStorage.getItem(TIMER_START_KEY)) {
    localStorage.setItem(
      TIMER_START_KEY,
      String(Date.now())
    );
  }

  startLiveTimer();

  renderQuestion();
}

function formatTime(milliseconds) {
  const totalSeconds = milliseconds / 1000;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((milliseconds % 1000) / 10);

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    String(centiseconds).padStart(2, "0")
  );
}

function updateLiveTimer() {
  const startTime = Number(
    localStorage.getItem(TIMER_START_KEY)
  );

  if (!startTime) {
    liveTimer.textContent = "00:00.00";
    return;
  }

  const endTime = Number(
    localStorage.getItem(TIMER_END_KEY)
  );

  const now = endTime || Date.now();

  liveTimer.textContent =
    formatTime(now - startTime);
}

function startLiveTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  updateLiveTimer();

  timerInterval = setInterval(() => {
    updateLiveTimer();
  }, 10);
}

function showClearTime() {
  const startTime = Number(
    localStorage.getItem(TIMER_START_KEY)
  );

  const endTime = Number(
    localStorage.getItem(TIMER_END_KEY)
  );

  if (!startTime || !endTime) {
    clearTime.textContent = "--:--.--";
    return;
  }

  clearTime.textContent =
    formatTime(endTime - startTime);
}

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const q = QUESTIONS[currentQuestion];
  const userAnswer =
    normalizeAnswer(answerInput.value);

  const isCorrect = q.answers.some(
    (answer) =>
      normalizeAnswer(answer) === userAnswer
  );

// FINALは送信した瞬間に暗転
if (currentQuestion === QUESTIONS.length - 1) {

  answerInput.disabled = true;

  finalJudgeOverlay.classList.add("show");

  // 暗転が終わってから判定
  setTimeout(() => {

    if (!isCorrect) {

      finalJudgeOverlay.classList.remove("show");

      setTimeout(() => {
        message.textContent =
          "不正解。もう一度考えてみよう。";

        message.className = "message wrong";

        answerInput.disabled = false;
        answerInput.focus();
      }, 500);

      return;
    }

    // FINAL正解
    if (!solvedQuestions.includes(currentQuestion)) {
      solvedQuestions.push(currentQuestion);

      localStorage.setItem(
        SOLVED_KEY,
        JSON.stringify(solvedQuestions)
      );
    }

    if (!localStorage.getItem(TIMER_END_KEY)) {
      localStorage.setItem(
        TIMER_END_KEY,
        String(Date.now())
      );
    }

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    updateLiveTimer();
    showClearTime();

    // 暗転したまま正解演出へ
    finalJudgeOverlay.classList.remove("show");
    clearOverlay.classList.add("show");

    setTimeout(() => {
      clearOverlay.classList.add("fade");
    }, 1200);

    setTimeout(() => {
      showScreen(clearScreen);

      clearOverlay.classList.remove(
        "show",
        "fade"
      );
    }, 2200);

  }, 1700);

  return;
}

// FINALだけ少し溜めてから判定
if (currentQuestion === QUESTIONS.length - 1) {

  message.textContent = "判定中...";
  message.className = "message";

  answerInput.disabled = true;

  setTimeout(() => {

    if (!isCorrect) {
      message.textContent =
        "不正解。もう一度考えてみよう。";

      message.className = "message wrong";

      answerInput.disabled = false;
      answerInput.focus();

      return;
    }

    // FINAL正解処理
    if (!solvedQuestions.includes(currentQuestion)) {
      solvedQuestions.push(currentQuestion);

      localStorage.setItem(
        SOLVED_KEY,
        JSON.stringify(solvedQuestions)
      );
    }

    if (!localStorage.getItem(TIMER_END_KEY)) {
      localStorage.setItem(
        TIMER_END_KEY,
        String(Date.now())
      );
    }

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    updateLiveTimer();
    showClearTime();

    clearOverlay.classList.add("show");

    setTimeout(() => {
      clearOverlay.classList.add("fade");
    }, 1200);

    setTimeout(() => {
      showScreen(clearScreen);

      clearOverlay.classList.remove(
        "show",
        "fade"
      );
    }, 2200);

  }, 2500);

  return;
}

  if (!isCorrect) {
    message.textContent =
      "不正解。もう一度考えてみよう。";
    message.className = "message wrong";
    return;
  }

  if (!solvedQuestions.includes(currentQuestion)) {
    solvedQuestions.push(currentQuestion);

    localStorage.setItem(
      SOLVED_KEY,
      JSON.stringify(solvedQuestions)
    );
  }

  message.textContent = "正解。";
  message.className = "message correct";

  renderNavigation();

  if (currentQuestion === QUESTIONS.length - 1) {

  if (!localStorage.getItem(TIMER_END_KEY)) {
    localStorage.setItem(
      TIMER_END_KEY,
      String(Date.now())
    );
  }

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  updateLiveTimer();
  showClearTime();

  clearOverlay.classList.add("show");

  setTimeout(() => {
    clearOverlay.classList.add("fade");
  }, 1200);

  setTimeout(() => {
    showScreen(clearScreen);
    clearOverlay.classList.remove("show", "fade");
  }, 2200);

  return;
}

  if (currentQuestion === highestUnlocked) {

  highestUnlocked++;

  localStorage.setItem(
    STORAGE_KEY,
    String(highestUnlocked)
  );

  // 正解演出
  correctOverlay.classList.add("show");

  setTimeout(() => {
    correctOverlay.classList.add("fade");
  }, 700);

  setTimeout(() => {

    currentQuestion = highestUnlocked;

    renderQuestion();

    correctOverlay.classList.remove(
      "show",
      "fade"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }, 1200);

  return;
}

  message.textContent =
    "正解済みです。上のQ番号から他の問題へ移動できます。";
});

startBtn.addEventListener("click", startGame);

resetBtn.addEventListener("click", () => {
  resetModal.classList.add("show");
});

cancelResetBtn.addEventListener("click", () => {
  resetModal.classList.remove("show");
});

confirmResetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SOLVED_KEY);
  localStorage.removeItem(TIMER_START_KEY);
  localStorage.removeItem(TIMER_END_KEY);

  highestUnlocked = 0;
  currentQuestion = 0;
  solvedQuestions = [];

  startBtn.textContent = "START";

  resetModal.classList.remove("show");
});

restartBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SOLVED_KEY);
  localStorage.removeItem(TIMER_START_KEY);
  localStorage.removeItem(TIMER_END_KEY);

  highestUnlocked = 0;
  currentQuestion = 0;
  solvedQuestions = [];

  startBtn.textContent = "START";
  showScreen(startScreen);
});

if (highestUnlocked > 0) {
  startBtn.textContent = "CONTINUE";
}
