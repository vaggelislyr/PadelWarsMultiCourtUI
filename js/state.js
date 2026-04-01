console.log("state loaded");

function getCourtIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const court = params.get("court");

  if (!court) return "court1";

  const cleaned = String(court).toLowerCase().replace(/[^a-z0-9]/g, "");

  if (cleaned.startsWith("court")) return cleaned;

  return `court${cleaned}`;
}

let activeCourtId = getCourtIdFromUrl();

function getStateRef() {
  return db.ref(`courts/${activeCourtId}`);
}

const DEFAULT_STATE = {
  nameA: "Player A1 / Player A2",
  nameB: "Player B1 / Player B2",

  organizer: "@sponsor",
  sponsorLocked: true,

  pointsA: 0,
  pointsB: 0,

  gamesA: 0,
  gamesB: 0,

  setsA: 0,
  setsB: 0,

  setHistoryA: [],
  setHistoryB: [],

  mode: "normal", // normal | tiebreak | finished
  serve: "A",
  visible: true,

  goldenActive: false,
  deuceCount: 0,

  timerText: "00:00",
  matchOver: false,

  // NEW: simple scoreboard mode
  simpleMode: false,
  simpleScoreA: "0",
  simpleScoreB: "0"
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeState(raw) {
  const incoming = raw || {};

  return {
    ...clone(DEFAULT_STATE),
    ...incoming,
    setHistoryA: Array.isArray(incoming.setHistoryA) ? incoming.setHistoryA : [],
    setHistoryB: Array.isArray(incoming.setHistoryB) ? incoming.setHistoryB : [],
    simpleMode: incoming.simpleMode === true,
    simpleScoreA:
      incoming.simpleScoreA !== undefined && incoming.simpleScoreA !== null
        ? String(incoming.simpleScoreA)
        : "0",
    simpleScoreB:
      incoming.simpleScoreB !== undefined && incoming.simpleScoreB !== null
        ? String(incoming.simpleScoreB)
        : "0"
  };
}

function initState() {
  const stateRef = getStateRef();

  stateRef.once("value", snap => {
    if (!snap.exists()) {
      stateRef.set(clone(DEFAULT_STATE));
    } else {
      stateRef.set(normalizeState(snap.val()));
    }
  });
}

function readState(callback) {
  const stateRef = getStateRef();

  stateRef.once("value").then(snap => {
    callback(normalizeState(snap.val()));
  });
}

function writeState(state) {
  const stateRef = getStateRef();
  stateRef.set(normalizeState(state));
}

function updateState(updater) {
  readState(state => {
    updater(state);
    writeState(state);
  });
}

let stateListenerRef = null;

function onStateChange(callback) {
  if (stateListenerRef) {
    stateListenerRef.off();
  }

  stateListenerRef = getStateRef();

  stateListenerRef.on("value", snap => {
    callback(normalizeState(snap.val()));
  });
}

function switchCourt(courtId) {
  const cleaned = String(courtId).toLowerCase().replace(/[^a-z0-9]/g, "");
  activeCourtId = cleaned.startsWith("court") ? cleaned : `court${cleaned}`;
  initState();
}

function getActiveCourtId() {
  return activeCourtId;
}

window.switchCourt = switchCourt;
window.getActiveCourtId = getActiveCourtId;

initState();
