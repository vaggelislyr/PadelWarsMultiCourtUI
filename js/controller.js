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

function getControllerPanels() {
  return Array.from(document.querySelectorAll(".appShell > section.panel"));
}

function getStickyPreviewDock() {
  return document.getElementById("stickyPreviewDock");
}

function ensureSimpleModeToggleButton() {
  const panels = getControllerPanels();
  const courtPanel = panels[0];
  if (!courtPanel) return;

  let row = document.getElementById("simpleModeToggleRow");
  if (!row) {
    row = document.createElement("div");
    row.id = "simpleModeToggleRow";
    row.style.marginTop = "12px";

    const button = document.createElement("button");
    button.id = "simpleModeToggleBtn";
    button.className = "btn btnSecondary btnFull";
    button.textContent = "Open Simple Mode";
    button.onclick = toggleSimpleMode;

    row.appendChild(button);
    courtPanel.appendChild(row);
  }
}

function updateSimpleModeToggleButton(state) {
  const btn = document.getElementById("simpleModeToggleBtn");
  if (!btn) return;

  if (state.simpleMode) {
    btn.textContent = "Back To Full Mode";
    btn.classList.remove("btnSecondary");
    btn.classList.add("btnPrimary");
  } else {
    btn.textContent = "Open Simple Mode";
    btn.classList.remove("btnPrimary");
    btn.classList.add("btnSecondary");
  }
}

function applyControllerModeUI(state) {
  const panels = getControllerPanels();

  const courtPanel = panels[0];
  const matchInfoPanel = panels[1];
  const simpleModePanel = panels[2];
  const scoreButtonsPanel = panels[3];
  const controlsPanel = panels[4];
  const timerPanel = panels[5];
  const previewDock = getStickyPreviewDock();

  if (!courtPanel) return;

  if (state.simpleMode === true) {
    if (matchInfoPanel) matchInfoPanel.style.display = "none";
    if (simpleModePanel) simpleModePanel.style.display = "";
    if (scoreButtonsPanel) scoreButtonsPanel.style.display = "none";
    if (controlsPanel) controlsPanel.style.display = "none";
    if (timerPanel) timerPanel.style.display = "none";
    if (previewDock) previewDock.style.display = "none";
  } else {
    if (matchInfoPanel) matchInfoPanel.style.display = "";
    if (simpleModePanel) simpleModePanel.style.display = "none";
    if (scoreButtonsPanel) scoreButtonsPanel.style.display = "";
    if (controlsPanel) controlsPanel.style.display = "";
    if (timerPanel) timerPanel.style.display = "";
    if (previewDock) previewDock.style.display = "";
  }

  updateSimpleModeToggleButton(state);
}

function updateCourtPreview(forceReload = false) {
  if (!obsPreviewFrame) return;

  const courtId = normalizeCourtId(getActiveCourtId());
  const courtNumber = getCourtNumber(courtId);
  const baseSrc = `obs.html?court=${courtNumber}`;

  const currentSrc = obsPreviewFrame.getAttribute("src") || "";
  const currentBase = currentSrc.split("&preview=")[0];

  if (forceReload || currentBase !== baseSrc) {
    const finalSrc = forceReload ? `${baseSrc}&preview=${Date.now()}` : baseSrc;
    obsPreviewFrame.setAttribute("src", finalSrc);
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

/* ================= UI HELPERS ================= */

function setBadgeText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ================= RENDER ================= */

function renderControllerState(state) {
  const nameAInput = document.getElementById("nameAInput");
  const nameBInput = document.getElementById("nameBInput");
  const sponsorInput = document.getElementById("sponsorInput");
  const simpleScoreAInput = document.getElementById("simpleScoreA");
  const simpleScoreBInput = document.getElementById("simpleScoreB");

  if (nameAInput) nameAInput.value = state.nameA || "";
  if (nameBInput) nameBInput.value = state.nameB || "";
  if (sponsorInput) sponsorInput.value = state.organizer || "";

  if (simpleScoreAInput) simpleScoreAInput.value = state.simpleScoreA || "";
  if (simpleScoreBInput) simpleScoreBInput.value = state.simpleScoreB || "";

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

  ensureSimpleModeToggleButton();
  updateCourtButtons();
  applyControllerModeUI(state);
  updateCourtPreview(false);
  updateFloatingPreviewLayout();
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

  const aEl = document.getElementById("simpleScoreA");
  const bEl = document.getElementById("simpleScoreB");

  const a = aEl ? aEl.value : "0";
  const b = bEl ? bEl.value : "0";

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
  updateCourtButtons();
  updateCourtPreview(true);

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

/* ================= FLASH FEEDBACK ================= */

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
document.addEventListener("touchstart", rememberPressedButton, { passive: true });
document.addEventListener("mousedown", rememberPressedButton);

/* ================= TIMER ================= */

let timerInterval = null;
let timerSeconds = 0;

function parseTimerText(text) {
  if (!text || typeof text !== "string") return 0;
  const parts = text.split(":");
  if (parts.length !== 2) return 0;
  const mm = parseInt(parts[0], 10) || 0;
  const ss = parseInt(parts[1], 10) || 0;
  return (mm * 60) + ss;
}

function formatTimerText(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  updateState(state => {
    state.timerText = formatTimerText(timerSeconds);
  });
}

function startTimer() {
  flashButton("normal");

  if (timerInterval) return;

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  flashButton("normal");

  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  flashButton("normal");

  stopTimer();
  timerSeconds = 0;
  updateTimerDisplay();
}

/* ================= HELPERS ================= */

function nextServe(current) {
  return current === "A" ? "B" : "A";
}

function resetPoints(state) {
  state.pointsA = 0;
  state.pointsB = 0;
  state.deuceCount = 0;
  state.goldenActive = false;
}

function finishMatch(state) {
  state.matchOver = true;
  state.mode = "finished";
  resetPoints(state);
}

function recordCompletedSet(state, scoreA, scoreB) {
  if (!Array.isArray(state.setHistoryA)) state.setHistoryA = [];
  if (!Array.isArray(state.setHistoryB)) state.setHistoryB = [];
  state.setHistoryA.push(scoreA);
  state.setHistoryB.push(scoreB);
}

function afterSetWin(state) {
  if (state.setsA === 2 || state.setsB === 2) {
    finishMatch(state);
    return;
  }

  state.gamesA = 0;
  state.gamesB = 0;
  state.mode = "normal";
  resetPoints(state);
}

function winSetNormal(state, player) {
  recordCompletedSet(state, state.gamesA, state.gamesB);

  if (player === "A") state.setsA++;
  else state.setsB++;

  afterSetWin(state);
}

function winSetByTiebreak(state, player) {
  const finalGamesA = player === "A" ? 7 : 6;
  const finalGamesB = player === "B" ? 7 : 6;

  recordCompletedSet(state, finalGamesA, finalGamesB);

  if (player === "A") state.setsA++;
  else state.setsB++;

  afterSetWin(state);
}

function checkSetOrTiebreak(state) {
  const { gamesA, gamesB } = state;

  if (gamesA === 6 && gamesB === 6) {
    state.mode = "tiebreak";
    resetPoints(state);
    return;
  }

  if (gamesA >= 6 && gamesA - gamesB >= 2) {
    winSetNormal(state, "A");
    return;
  }

  if (gamesB >= 6 && gamesB - gamesA >= 2) {
    winSetNormal(state, "B");
    return;
  }
}

function winGame(state, player) {
  if (player === "A") state.gamesA++;
  else state.gamesB++;

  resetPoints(state);
  state.serve = nextServe(state.serve);

  checkSetOrTiebreak(state);
}

/* ================= SCORING ================= */

function handleNormalPoint(state, player) {
  const opponent = player === "A" ? "B" : "A";

  if (state.matchOver) return;

  if (state.goldenActive && state.pointsA === 3 && state.pointsB === 3) {
    winGame(state, player);
    return;
  }

  if (state.pointsA >= 3 && state.pointsB >= 3) {
    if (state["points" + opponent] === 4) {
      state.pointsA = 3;
      state.pointsB = 3;
      state.deuceCount++;

      if (state.deuceCount >= 2) {
        state.goldenActive = true;
      }
      return;
    }

    if (state["points" + player] === 4) {
      winGame(state, player);
      return;
    }

    if (state.pointsA === 3 && state.pointsB === 3) {
      state["points" + player] = 4;
      return;
    }
  }

  state["points" + player]++;

  if (
    state["points" + player] >= 4 &&
    state["points" + player] - state["points" + opponent] >= 2
  ) {
    winGame(state, player);
  }
}

function handleTieBreak(state, player) {
  if (state.matchOver) return;

  state["points" + player]++;

  const diff = Math.abs(state.pointsA - state.pointsB);

  if ((state.pointsA >= 7 || state.pointsB >= 7) && diff >= 2) {
    if (state.pointsA > state.pointsB) {
      winSetByTiebreak(state, "A");
    } else {
      winSetByTiebreak(state, "B");
    }
  }
}

function addPoint(player) {
  flashButton("normal");

  readState(state => {
    if (state.simpleMode) return;

    pushHistory(state);

    if (!state.mode) state.mode = "normal";
    if (state.deuceCount === undefined) state.deuceCount = 0;
    if (state.goldenActive === undefined) state.goldenActive = false;
    if (state.matchOver === undefined) state.matchOver = false;

    if (state.mode === "normal") {
      handleNormalPoint(state, player);
    } else if (state.mode === "tiebreak") {
      handleTieBreak(state, player);
    }

    writeState(state);
  });
}

/* ================= CONTROLLER ACTIONS ================= */

function updateNameA() {
  flashButton("normal");

  const value = document.getElementById("nameAInput").value || "";

  readState(state => {
    pushHistory(state);
    state.nameA = value;
    writeState(state);
  });
}

function updateNameB() {
  flashButton("normal");

  const value = document.getElementById("nameBInput").value || "";

  readState(state => {
    pushHistory(state);
    state.nameB = value;
    writeState(state);
  });
}

function updateSponsor() {
  flashButton("normal");

  const value = document.getElementById("sponsorInput").value || "";

  readState(state => {
    pushHistory(state);
    state.organizer = value;
    writeState(state);
  });
}

function switchServe() {
  flashButton("normal");

  readState(state => {
    if (state.simpleMode) return;
    pushHistory(state);
    state.serve = nextServe(state.serve);
    writeState(state);
  });
}

function toggleScoreboard() {
  flashButton("normal");

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

    state.nameA = "";
    state.nameB = "";

    state.pointsA = 0;
    state.pointsB = 0;

    state.gamesA = 0;
    state.gamesB = 0;

    state.setsA = 0;
    state.setsB = 0;

    state.setHistoryA = [];
    state.setHistoryB = [];

    state.mode = "normal";
    state.serve = "A";
    state.visible = true;

    state.goldenActive = false;
    state.deuceCount = 0;
    state.matchOver = false;

    state.organizer = state.organizer || "@sponsor";

    state.timerText = "00:00";
    state.simpleMode = false;
    state.simpleScoreA = "0";
    state.simpleScoreB = "0";

    timerSeconds = 0;
    stopTimer();

    writeState(state);
  });
}

/* ================= PREVIEW SCALE ================= */

function resizeObsPreview() {
  const viewport = document.getElementById("previewViewport");
  const iframe = document.getElementById("obsPreview");

  if (!viewport || !iframe) return;

  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;

  const baseWidth = 1920;
  const baseHeight = 1080;

  if (!viewportWidth || !viewportHeight) return;

  const scale = Math.min(viewportWidth / baseWidth, viewportHeight / baseHeight);
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  const offsetX = (viewportWidth - scaledWidth) / 2;
  const offsetY = (viewportHeight - scaledHeight) / 2;

  iframe.style.width = `${baseWidth}px`;
  iframe.style.height = `${baseHeight}px`;
  iframe.style.transformOrigin = "top left";
  iframe.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale}) translateZ(0)`;
  iframe.style.left = "0px";
  iframe.style.top = "0px";
}

/* ================= IOS SAFARI HARD LOCK ================= */

function lockPreviewDockToViewport() {
  const dock = document.getElementById("stickyPreviewDock");
  if (!dock || dock.style.display === "none") return;

  const vv = window.visualViewport;
  const isMobile = window.innerWidth <= 640;
  const sideGap = isMobile ? 8 : 20;
  const bottomGap = isMobile ? 6 : 12;

  if (!vv) {
    dock.style.left = "50%";
    dock.style.top = "";
    dock.style.bottom = `${bottomGap}px`;
    dock.style.transform = "translateX(-50%)";
    return;
  }

  const width = Math.min(980, vv.width - (sideGap * 2));
  const dockHeight = dock.offsetHeight || (isMobile ? 174 : 214);

  const centerX = vv.offsetLeft + (vv.width / 2);
  const topY = vv.offsetTop + vv.height - dockHeight - bottomGap;

  dock.style.width = `${width}px`;
  dock.style.left = `${centerX}px`;
  dock.style.top = `${Math.max(topY, 0)}px`;
  dock.style.bottom = "auto";
  dock.style.transform = "translateX(-50%)";
}

function updateFloatingPreviewLayout() {
  resizeObsPreview();
  requestAnimationFrame(lockPreviewDockToViewport);
}

window.addEventListener("resize", updateFloatingPreviewLayout);
window.addEventListener("orientationchange", () => {
  setTimeout(updateFloatingPreviewLayout, 120);
});

window.addEventListener("scroll", () => {
  requestAnimationFrame(lockPreviewDockToViewport);
}, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateFloatingPreviewLayout);
  window.visualViewport.addEventListener("scroll", () => {
    requestAnimationFrame(lockPreviewDockToViewport);
  });
}

window.addEventListener("load", () => {
  ensureSimpleModeToggleButton();
  setTimeout(updateFloatingPreviewLayout, 80);
  updateCourtButtons();
  updateCourtPreview(false);

  readState(state => {
    renderControllerState(state);
  });
});

/* ================= INIT INPUTS FROM STATE ================= */

bindCourtStateListener();

/* ================= GLOBAL EXPORTS FOR HTML onclick ================= */

window.updateNameA = updateNameA;
window.updateNameB = updateNameB;
window.updateSponsor = updateSponsor;
window.addPoint = addPoint;
window.switchServe = switchServe;
window.undo = undo;
window.toggleScoreboard = toggleScoreboard;
window.resetMatch = resetMatch;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resetTimer = resetTimer;
window.switchCourtUI = switchCourtUI;
window.toggleSimpleMode = toggleSimpleMode;
window.updateSimpleScore = updateSimpleScore;
