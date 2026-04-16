const display = document.getElementById("display");
const modeTitle = document.getElementById("mode-title");
const statusText = document.getElementById("status");
const startPauseButton = document.getElementById("start-pause-button");
const resetButton = document.getElementById("reset-button");
const timeForm = document.getElementById("time-form");
const minutesInput = document.getElementById("minutes-input");
const secondsInput = document.getElementById("seconds-input");
const presetButtons = document.querySelectorAll(".preset-button");
const modeButtons = document.querySelectorAll(".mode-button");
const timerCard = document.querySelector(".timer-card");

let mode = "countdown";
let totalSeconds = 1500;
let remainingSeconds = totalSeconds;
let elapsedSeconds = 0;
let endTime = null;
let startedAt = null;
let timerId = null;
let isRunning = false;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatStopwatchTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function setStatus(message) {
  statusText.textContent = message;
}

function updateDisplay() {
  if (mode === "countdown") {
    display.textContent = formatTime(remainingSeconds);
    document.title = `${formatTime(remainingSeconds)} | Timer`;
    return;
  }

  display.textContent = formatStopwatchTime(elapsedSeconds);
  document.title = `${formatStopwatchTime(elapsedSeconds)} | Stopwatch`;
}

function syncInputs() {
  minutesInput.value = Math.floor(remainingSeconds / 60);
  secondsInput.value = remainingSeconds % 60;
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  isRunning = false;
  startPauseButton.textContent = "Start";
}

function finishTimer() {
  remainingSeconds = 0;
  updateDisplay();
  stopTimer();
  timerCard.classList.add("finished");
  setStatus("Time is up");
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Timer finished", {
      body: "The countdown has ended."
    });
  }
}

function tickCountdown() {
  const nextValue = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  remainingSeconds = nextValue;
  updateDisplay();
  if (nextValue === 0) {
    finishTimer();
  }
}

function tickStopwatch() {
  elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  updateDisplay();
}

function startTimer() {
  if (mode === "countdown" && remainingSeconds === 0) {
    return;
  }
  if (mode === "countdown" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  timerCard.classList.remove("finished");
  isRunning = true;
  startPauseButton.textContent = "Pause";
  if (mode === "countdown") {
    endTime = Date.now() + remainingSeconds * 1000;
    timerId = setInterval(tickCountdown, 250);
    setStatus("Running");
    return;
  }

  startedAt = Date.now() - elapsedSeconds * 1000;
  timerId = setInterval(tickStopwatch, 250);
  setStatus("Measuring");
}

function applyDuration(seconds) {
  stopTimer();
  totalSeconds = seconds;
  remainingSeconds = seconds;
  timerCard.classList.remove("finished");
  updateDisplay();
  syncInputs();
  setStatus("Ready");
}

function resetStopwatch() {
  stopTimer();
  elapsedSeconds = 0;
  timerCard.classList.remove("finished");
  updateDisplay();
  setStatus("Ready");
}

function updatePresetState(seconds) {
  presetButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.seconds) === seconds);
  });
}

function updateModeUI() {
  const isCountdown = mode === "countdown";
  timerCard.classList.toggle("stopwatch-mode", !isCountdown);
  modeTitle.textContent = isCountdown ? "Countdown" : "Stopwatch";
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  updateDisplay();
}

function switchMode(nextMode) {
  if (nextMode === mode) {
    return;
  }

  stopTimer();
  timerCard.classList.remove("finished");
  mode = nextMode;

  if (mode === "countdown") {
    setStatus("Ready");
    syncInputs();
  } else {
    elapsedSeconds = 0;
    setStatus("Ready");
  }

  updateModeUI();
}

startPauseButton.addEventListener("click", () => {
  if (isRunning) {
    stopTimer();
    setStatus(mode === "countdown" ? "Paused" : "Stopped");
    return;
  }
  startTimer();
});

resetButton.addEventListener("click", () => {
  if (mode === "countdown") {
    applyDuration(totalSeconds);
    updatePresetState(totalSeconds);
    return;
  }
  resetStopwatch();
});

timeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (mode !== "countdown") {
    return;
  }
  const minutes = Math.max(0, Number(minutesInput.value) || 0);
  const seconds = Math.max(0, Math.min(59, Number(secondsInput.value) || 0));
  const nextDuration = minutes * 60 + seconds;

  if (nextDuration === 0) {
    setStatus("Set at least 1 second");
    return;
  }

  applyDuration(nextDuration);
  updatePresetState(nextDuration);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (mode !== "countdown") {
      return;
    }
    const seconds = Number(button.dataset.seconds);
    applyDuration(seconds);
    updatePresetState(seconds);
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchMode(button.dataset.mode);
  });
});

updateDisplay();
syncInputs();
updateModeUI();
