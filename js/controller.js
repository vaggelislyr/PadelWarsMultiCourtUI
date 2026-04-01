console.log("Controller loaded");

/* ================= MULTI COURT HELPERS ================= */

const obsPreviewFrame = document.getElementById("obsPreview");

function normalizeCourtId(value) {
  const cleaned = String(value || "court1").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return "court1";
  return cleaned.startsWith("court") ? cleaned : `court${cleaned}`;
}

function getCourtNumber(courtId) {
  const match = String(courtId || "").match(/\d+/);
  return match ? match[0] : "1";
}

function updateCourtPreview() {
  if (!obsPreviewFrame) return;

  const courtId = normalizeCourtId(getActiveCourtId());
  const courtNumber = getCourtNumber(courtId);
  const targetSrc = `obs.html?court=${courtNumber}`;

  const current = obsPreviewFrame.getAttribute("src") || "";
  if (current !== targetSrc) {
    obsPreviewFrame.setAttribute("src", targetSrc);
  }
}

function updateCourtButtons() {
  const active = normalizeCourtId(getActiveCourtId());

  document.querySelectorAll("[data-court]").forEach(btn => {
    const btnCourt = normalizeCourtId(btn.getAttribute("data-court"));
    btn.classList.toggle("activeCourt", btnCourt === active);
  });

  const badge = document.getElementById("currentCourtBadge");
  if (badge) {
    badge.textContent = active.toUpperCase();
  }
}

/* ================= RENDER ================= */

function renderControllerState(state) {
  document.getElementById("nameAInput").value = state.nameA || "";
  document.getElementById("nameBInput").value = state.nameB || "";
  document.getElementById("sponsorInput").value = state.organizer || "";

  timerSeconds = parseTimerText(state.timerText || "00:00");

  setText("teamANamePreview", state.nameA || "Player1 / Player2");
  setText("teamBNamePreview", state.nameB || "Player1 / Player2");

  setBadgeText("serveBadge", `Serve: ${state.serve || "A"}`);

  let modeText = "Normal Mode";
  if (state.simpleMode) modeText = "Simple Mode";
  else if (state.mode === "tiebreak") modeText = "Tiebreak";
  else if (state.matchOver === true || state.mode === "finished") modeText = "Match Finished";

  setBadgeText("modeBadge", modeText);

  setBadgeText("visibleBadge", state.visible === false ? "Overlay Hidden" : "Overlay Visible");

  updateCourtButtons();
  updateCourtPreview();
  updateFloatingPreviewLayout();

  // update simple inputs if υπάρχουν
  if (document.getElementById("simpleScoreA")) {
    document.getElementById("simpleScoreA").value = state.simpleScoreA || "";
    document.getElementById("simpleScoreB").value = state.simpleScoreB || "";
  }
}

function bindCourtStateListener() {
  onStateChange(renderControllerState);
}

/* ================= SIMPLE MODE ================= */

function toggleSimpleMode() {
  flashButton("normal");

  readState(state => {
    pushHistory(state);
    state.simpleMode = !state.simpleMode;
    writeState(state);
  });
}

function updateSimpleScore() {
  flashButton("normal");

  const a = document.getElementById("simpleScoreA").value;
  const b = document.getElementById("simpleScoreB").value;

  readState(state => {
    pushHistory(state);
    state.simpleScoreA = a;
    state.simpleScoreB = b;
    writeState(state);
  });
}

/* ================= COURT SWITCH ================= */

function switchCourtUI(id) {
  flashButton("normal");

  historyStack = [];
  stopTimer();

  switchCourt(id);
  bindCourtStateListener();

  readState(state => {
    renderControllerState(state);
  });
}

/* ================= HISTORY ================= */

let historyStack = [];

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pushHistory(currentState) {
  historyStack.push(clone(currentState));
  if (historyStack.length > 100) {
    historyStack.shift();
  }
}

function undo() {
  flashButton("normal");

  if (historyStack.length === 0) return;
  const previous = historyStack.pop();
  writeState(previous);
}

/* ================= FLASH ================= */

let lastPressedButton = null;

function rememberPressedButton(event) {
  const btn = event.target.closest(".btn");
  if (btn) lastPressedButton = btn;
}

function flashButton(type = "normal") {
  const btn = lastPressedButton;
  if (!btn) return;

  btn.classList.remove("flashTap", "flashDanger");
  void btn.offsetWidth;
  btn.classList.add(type === "danger" ? "flashDanger" : "flashTap");

  setTimeout(() => {
    btn.classList.remove("flashTap", "flashDanger");
  }, type === "danger" ? 460 : 400);
}

document.addEventListener("pointerdown", rememberPressedButton);

/* ================= TIMER ================= */

let timerInterval = null;
let timerSeconds = 0;

function parseTimerText(text) {
  const parts = text.split(":");
  return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
}

function formatTimerText(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  updateState(state => {
    state.timerText = formatTimerText(timerSeconds);
  });
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  timerSeconds = 0;
  updateTimerDisplay();
}

/* ================= SCORING ================= */

function addPoint(player) {
  flashButton("normal");

  readState(state => {

    // ⛔ ΜΠΛΟΚ όταν simple mode
    if (state.simpleMode) return;

    pushHistory(state);

    if (!state.mode) state.mode = "normal";

    if (state.mode === "normal") {
      state["points" + player]++;
    }

    writeState(state);
  });
}

/* ================= CONTROLLER ================= */

function updateNameA() {
  const value = document.getElementById("nameAInput").value;

  readState(state => {
    pushHistory(state);
    state.nameA = value;
    writeState(state);
  });
}

function updateNameB() {
  const value = document.getElementById("nameBInput").value;

  readState(state => {
    pushHistory(state);
    state.nameB = value;
    writeState(state);
  });
}

function updateSponsor() {
  const value = document.getElementById("sponsorInput").value;

  readState(state => {
    pushHistory(state);
    state.organizer = value;
    writeState(state);
  });
}

function toggleScoreboard() {
  readState(state => {
    pushHistory(state);
    state.visible = !state.visible;
    writeState(state);
  });
}

function resetMatch() {
  flashButton("danger");

  readState(state => {
    pushHistory(state);

    Object.assign(state, {
      pointsA: 0,
      pointsB: 0,
      gamesA: 0,
      gamesB: 0,
      setsA: 0,
      setsB: 0,
      setHistoryA: [],
      setHistoryB: [],
      mode: "normal",
      simpleMode: false,
      simpleScoreA: "0",
      simpleScoreB: "0"
    });

    writeState(state);
  });
}

/* ================= INIT ================= */

bindCourtStateListener();

/* ================= EXPORTS ================= */

window.updateNameA = updateNameA;
window.updateNameB = updateNameB;
window.updateSponsor = updateSponsor;
window.addPoint = addPoint;
window.undo = undo;
window.toggleScoreboard = toggleScoreboard;
window.resetMatch = resetMatch;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resetTimer = resetTimer;
window.switchCourtUI = switchCourtUI;
window.toggleSimpleMode = toggleSimpleMode;
window.updateSimpleScore = updateSimpleScore;
