console.log("Obs loaded");

const overlayWrapper = document.getElementById("overlayWrapper");

const serveBallEl = document.getElementById("serveBall");

const nameAEl = document.getElementById("nameA");
const nameBEl = document.getElementById("nameB");

const set1AEl = document.getElementById("set1A");
const set1BEl = document.getElementById("set1B");

const set2AEl = document.getElementById("set2A");
const set2BEl = document.getElementById("set2B");

const gamesAEl = document.getElementById("gamesA");
const gamesBEl = document.getElementById("gamesB");

const pointsAEl = document.getElementById("pointsA");
const pointsBEl = document.getElementById("pointsB");

const goldenBannerEl = document.getElementById("goldenBanner");
const tiebreakBannerEl = document.getElementById("tiebreakBanner");
const winnerBannerEl = document.getElementById("winnerBanner");

const organizerEl = document.getElementById("organizer");
const timerEl = document.getElementById("timer");

let previousPointsA = null;
let previousPointsB = null;
let previousGamesA = null;
let previousGamesB = null;

/* =========================================
   SIMPLE MODE HELPERS
========================================= */

function applySimpleMode(state) {
  const isSimple = state.simpleMode === true;

  if (isSimple) {
    // hide sets
    set1AEl.classList.add("hiddenSet");
    set1BEl.classList.add("hiddenSet");
    set2AEl.classList.add("hiddenSet");
    set2BEl.classList.add("hiddenSet");

    // use games cells σαν main score
    gamesAEl.textContent = state.simpleScoreA || "0";
    gamesBEl.textContent = state.simpleScoreB || "0";

    // hide points
    pointsAEl.textContent = "";
    pointsBEl.textContent = "";

    goldenBannerEl.classList.remove("active");
    tiebreakBannerEl.classList.remove("active");
    winnerBannerEl.classList.remove("active");

    nameAEl.classList.remove("winnerName", "loserName");
    nameBEl.classList.remove("winnerName", "loserName");

    return true;
  }

  return false;
}

/* =========================================
   SAFE SHOW / HIDE
========================================= */

const OVERLAY_ANIM_MS = 760;

let overlayIsVisible = true;
let overlayHideTimer = null;

function setupOverlayAnimationBase() {
  overlayWrapper.style.display = "flex";
  overlayWrapper.style.opacity = "1";
  overlayWrapper.style.transform = "translateY(0px) scale(1)";
  overlayWrapper.style.filter = "blur(0px)";
  overlayWrapper.style.pointerEvents = "none";
  overlayWrapper.style.willChange = "opacity, transform, filter";
  overlayWrapper.style.transition = [
    `opacity ${OVERLAY_ANIM_MS}ms cubic-bezier(.18,.84,.24,1)`,
    `transform ${OVERLAY_ANIM_MS}ms cubic-bezier(.18,.84,.24,1)`,
    `filter ${OVERLAY_ANIM_MS}ms cubic-bezier(.18,.84,.24,1)`
  ].join(", ");
}

function showOverlaySmooth() {
  clearTimeout(overlayHideTimer);
  overlayWrapper.style.display = "flex";
  overlayWrapper.style.opacity = "1";
}

function hideOverlaySmooth() {
  clearTimeout(overlayHideTimer);
  overlayWrapper.style.opacity = "0";

  overlayHideTimer = setTimeout(() => {
    overlayWrapper.style.display = "none";
  }, OVERLAY_ANIM_MS);
}

setupOverlayAnimationBase();

/* =========================================
   HELPERS
========================================= */

function tennisPoints(p) {
  const map = ["0", "15", "30", "40", "AD"];
  return map[p] ?? "0";
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function clearWinnerStyles() {
  nameAEl.classList.remove("winnerName", "loserName");
  nameBEl.classList.remove("winnerName", "loserName");
  winnerBannerEl.classList.remove("active");
}

function popScore(el) {
  el.classList.remove("scorePop");
  void el.offsetWidth;
  el.classList.add("scorePop");

  setTimeout(() => {
    el.classList.remove("scorePop");
  }, 180);
}

/* =========================================
   STATE SYNC
========================================= */

onStateChange(function (state) {
  if (!state) return;

  if (state.visible === false) {
    hideOverlaySmooth();
    return;
  } else {
    showOverlaySmooth();
  }

  if (state.serve === "B") {
    serveBallEl.classList.add("toBottom");
  } else {
    serveBallEl.classList.remove("toBottom");
  }

  nameAEl.textContent = safeText(state.nameA, "Player A1 / Player A2");
  nameBEl.textContent = safeText(state.nameB, "Player B1 / Player B2");

  /* ================= SIMPLE MODE ================= */

  if (applySimpleMode(state)) {
    organizerEl.textContent = safeText(state.organizer, "@sponsor");
    timerEl.textContent = safeText(state.timerText, "00:00");
    return;
  }

  /* ================= NORMAL MODE ================= */

  const historyA = Array.isArray(state.setHistoryA) ? state.setHistoryA : [];
  const historyB = Array.isArray(state.setHistoryB) ? state.setHistoryB : [];

  if (historyA.length >= 1 && historyB.length >= 1) {
    set1AEl.classList.remove("hiddenSet");
    set1BEl.classList.remove("hiddenSet");
    set1AEl.textContent = safeText(historyA[0], "0");
    set1BEl.textContent = safeText(historyB[0], "0");
  } else {
    set1AEl.classList.add("hiddenSet");
    set1BEl.classList.add("hiddenSet");
  }

  if (historyA.length >= 2 && historyB.length >= 2) {
    set2AEl.classList.remove("hiddenSet");
    set2BEl.classList.remove("hiddenSet");
    set2AEl.textContent = safeText(historyA[1], "0");
    set2BEl.textContent = safeText(historyB[1], "0");
  } else {
    set2AEl.classList.add("hiddenSet");
    set2BEl.classList.add("hiddenSet");
  }

  gamesAEl.textContent = safeText(state.gamesA, "0");
  gamesBEl.textContent = safeText(state.gamesB, "0");

  if (state.mode === "tiebreak") {
    pointsAEl.textContent = safeText(state.pointsA, "0");
    pointsBEl.textContent = safeText(state.pointsB, "0");
  } else if (state.mode === "finished") {
    pointsAEl.textContent = "-";
    pointsBEl.textContent = "-";
  } else {
    pointsAEl.textContent = tennisPoints(state.pointsA ?? 0);
    pointsBEl.textContent = tennisPoints(state.pointsB ?? 0);
  }

  if (state.mode === "tiebreak") {
    tiebreakBannerEl.classList.add("active");
  } else {
    tiebreakBannerEl.classList.remove("active");
  }

  clearWinnerStyles();

  if (state.matchOver === true) {
    winnerBannerEl.classList.add("active");

    if ((state.setsA ?? 0) > (state.setsB ?? 0)) {
      nameAEl.classList.add("winnerName");
      nameBEl.classList.add("loserName");
    } else {
      nameBEl.classList.add("winnerName");
      nameAEl.classList.add("loserName");
    }
  }

  organizerEl.textContent = safeText(state.organizer, "@sponsor");
  timerEl.textContent = safeText(state.timerText, "00:00");

  previousPointsA = state.pointsA;
  previousPointsB = state.pointsB;
  previousGamesA = state.gamesA;
  previousGamesB = state.gamesB;
});
