// Splitline — workout tracker app logic
// Uses the Supabase JS client (loaded via CDN in index.html) and
// the SUPABASE_URL / SUPABASE_ANON_KEY constants from config.js

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = { Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" };

let currentUser = null;
let workouts = [];           // flat list: { id, day_of_week, name, splits: [...] }
let editorDay = null;        // day currently open in the editor modal
let editorWorkout = null;    // workout object currently open in the editor modal

let runState = null;         // { workout, index, timer, remaining }

// ---------- small DOM helpers ----------
const $ = (id) => document.getElementById(id);
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  show(t);
  clearTimeout(toast._h);
  toast._h = setTimeout(() => hide(t), 2600);
}

// =================================================================
// AUTH
// =================================================================
document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.tab === "login") {
      show($("login-form")); hide($("register-form"));
    } else {
      hide($("login-form")); show($("register-form"));
    }
  });
});

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login-error").textContent = "";
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) $("login-error").textContent = error.message;
});

$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("register-error").textContent = "";
  $("register-note").textContent = "";
  const email = $("register-email").value.trim();
  const password = $("register-password").value;
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    $("register-error").textContent = error.message;
    return;
  }
  if (data.session) {
    // Email confirmation disabled in the Supabase project -> logged in immediately.
  } else {
    $("register-note").textContent = "Account created. Check your email to confirm, then log in.";
  }
});

$("logout-btn").addEventListener("click", async () => {
  await sb.auth.signOut();
});

sb.auth.onAuthStateChange((_event, session) => {
  currentUser = session ? session.user : null;
  if (currentUser) {
    hide($("auth-screen"));
    show($("app-shell"));
    $("user-email").textContent = currentUser.email;
    loadWorkouts();
  } else {
    show($("auth-screen"));
    hide($("app-shell"));
  }
});

// =================================================================
// NAVIGATION
// =================================================================
document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => hide(v));
    show($(`view-${btn.dataset.view}`));
  });
});

// =================================================================
// DATA LOADING
// =================================================================
async function loadWorkouts() {
  const { data, error } = await sb
    .from("workouts")
    .select("*, splits(*)")
    .order("order_index", { referencedTable: "splits" });

  if (error) { toast("Couldn't load workouts: " + error.message); return; }
  workouts = data || [];
  renderSchedule();
  renderAllWorkouts();
}

function workoutForDay(day) {
  return workouts.find(w => w.day_of_week === day) || null;
}

// =================================================================
// SCHEDULE VIEW (weekly grid)
// =================================================================
function renderSchedule() {
  const grid = $("week-grid");
  grid.innerHTML = "";
  DAYS.forEach(day => {
    const w = workoutForDay(day);
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day-label">${DAY_FULL[day]}</div>
      ${w
        ? `<div class="day-workout-name">${escapeHtml(w.name)}</div>
           <div class="day-split-count">${w.splits.length} split${w.splits.length === 1 ? "" : "s"}</div>`
        : `<div class="day-empty">Add workout</div>`}
    `;
    card.addEventListener("click", () => openEditor(day));
    grid.appendChild(card);
  });
}

// =================================================================
// ALL WORKOUTS VIEW
// =================================================================
function renderAllWorkouts() {
  const list = $("workout-list");
  list.innerHTML = "";
  if (workouts.length === 0) {
    list.innerHTML = `<p class="subtitle">No workouts yet — assign one from the Schedule tab.</p>`;
    return;
  }
  workouts
    .slice()
    .sort((a, b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week))
    .forEach(w => {
      const row = document.createElement("div");
      row.className = "workout-row";
      row.innerHTML = `
        <div>
          <div class="workout-row-name">${escapeHtml(w.name)}</div>
          <div class="workout-row-meta">${w.splits.length} split${w.splits.length === 1 ? "" : "s"}</div>
        </div>
        <span class="day-pill">${w.day_of_week}</span>
      `;
      row.addEventListener("click", () => openEditor(w.day_of_week));
      list.appendChild(row);
    });
}

// =================================================================
// EDITOR MODAL (create/edit a day's workout + its splits)
// =================================================================
function openEditor(day) {
  editorDay = day;
  editorWorkout = workoutForDay(day);
  $("editor-title").textContent = DAY_FULL[day];
  $("editor-day-label").textContent = DAY_FULL[day];

  if (!editorWorkout) {
    show($("editor-empty"));
    hide($("editor-body"));
    $("new-workout-name").value = "";
  } else {
    hide($("editor-empty"));
    show($("editor-body"));
    renderEditorBody();
  }
  show($("editor-modal"));
}

$("editor-close").addEventListener("click", () => hide($("editor-modal")));

$("create-workout-btn").addEventListener("click", async () => {
  const name = $("new-workout-name").value.trim();
  if (!name) { toast("Give the workout a name first."); return; }
  const { data, error } = await sb
    .from("workouts")
    .insert({ user_id: currentUser.id, day_of_week: editorDay, name })
    .select("*, splits(*)")
    .single();
  if (error) { toast("Couldn't create workout: " + error.message); return; }
  workouts.push(data);
  editorWorkout = data;
  hide($("editor-empty"));
  show($("editor-body"));
  renderEditorBody();
  renderSchedule();
  renderAllWorkouts();
});

function renderEditorBody() {
  $("workout-name-input").value = editorWorkout.name;
  renderSplitList();
}

$("workout-name-input").addEventListener("blur", async () => {
  const newName = $("workout-name-input").value.trim();
  if (!editorWorkout || !newName || newName === editorWorkout.name) return;
  const { error } = await sb.from("workouts").update({ name: newName }).eq("id", editorWorkout.id);
  if (error) { toast("Couldn't rename: " + error.message); return; }
  editorWorkout.name = newName;
  renderSchedule();
  renderAllWorkouts();
});

$("delete-workout-btn").addEventListener("click", async () => {
  if (!editorWorkout) return;
  if (!confirm(`Delete "${editorWorkout.name}"? This removes all its splits too.`)) return;
  const { error } = await sb.from("workouts").delete().eq("id", editorWorkout.id);
  if (error) { toast("Couldn't delete: " + error.message); return; }
  workouts = workouts.filter(w => w.id !== editorWorkout.id);
  hide($("editor-modal"));
  renderSchedule();
  renderAllWorkouts();
});

function renderSplitList() {
  const list = $("split-list");
  list.innerHTML = "";
  const splits = editorWorkout.splits.slice().sort((a, b) => a.order_index - b.order_index);
  splits.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "split-item";
    const meta = [
      s.sets ? `${s.sets} sets` : null,
      s.reps ? `${s.reps} reps` : null,
      `${s.rest_seconds}s rest`
    ].filter(Boolean).join(" · ");
    li.innerHTML = `
      <div class="split-item-main">
        <span class="split-order">${i + 1}</span>
        <div>
          <div class="split-name">${escapeHtml(s.name)}</div>
          <div class="split-meta">${meta}</div>
        </div>
      </div>
      <button class="split-remove" aria-label="Remove split">&times;</button>
    `;
    li.querySelector(".split-remove").addEventListener("click", () => deleteSplit(s.id));
    list.appendChild(li);
  });
}

$("add-split-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("split-name").value.trim();
  const sets = parseInt($("split-sets").value) || null;
  const reps = parseInt($("split-reps").value) || null;
  const rest_seconds = parseInt($("split-rest").value) || 60;
  if (!name) return;

  const maxOrder = editorWorkout.splits.reduce((m, s) => Math.max(m, s.order_index), -1);
  const { data, error } = await sb
    .from("splits")
    .insert({ workout_id: editorWorkout.id, name, sets, reps, rest_seconds, order_index: maxOrder + 1 })
    .select()
    .single();
  if (error) { toast("Couldn't add split: " + error.message); return; }

  editorWorkout.splits.push(data);
  renderSplitList();
  renderSchedule();
  e.target.reset();
  $("split-rest").value = 60;
  $("split-name").focus();
});

async function deleteSplit(splitId) {
  const { error } = await sb.from("splits").delete().eq("id", splitId);
  if (error) { toast("Couldn't remove split: " + error.message); return; }
  editorWorkout.splits = editorWorkout.splits.filter(s => s.id !== splitId);
  renderSplitList();
  renderSchedule();
}

// =================================================================
// RUN WORKOUT (sequential splits + rest timer between them)
// =================================================================
$("start-workout-btn").addEventListener("click", () => {
  if (!editorWorkout || editorWorkout.splits.length === 0) {
    toast("Add at least one split before starting.");
    return;
  }
  hide($("editor-modal"));
  startRun(editorWorkout);
});

function startRun(workout) {
  const splits = workout.splits.slice().sort((a, b) => a.order_index - b.order_index);
  runState = { workout, splits, index: 0, timer: null, remaining: 0 };
  $("run-workout-name").textContent = workout.name;
  show($("run-modal"));
  showSplitPhase();
}

function showSplitPhase() {
  clearRunTimer();
  const { splits, index } = runState;
  const split = splits[index];
  $("run-progress").textContent = `Split ${index + 1} of ${splits.length}`;
  $("run-split-name").textContent = split.name;
  const meta = [split.sets ? `${split.sets} sets` : null, split.reps ? `${split.reps} reps` : null]
    .filter(Boolean).join(" · ") || "—";
  $("run-split-meta").textContent = meta;

  hide($("run-phase-rest"));
  hide($("run-phase-done"));
  show($("run-phase-split"));
}

$("finish-split-btn").addEventListener("click", () => {
  const { splits, index } = runState;
  const isLast = index === splits.length - 1;
  if (isLast) {
    showDonePhase();
  } else {
    showRestPhase();
  }
});

function showRestPhase() {
  const { splits, index } = runState;
  const finishedSplit = splits[index];
  const nextSplit = splits[index + 1];

  $("run-progress").textContent = `Resting after ${finishedSplit.name}`;
  $("run-next-split-name").textContent = nextSplit.name;
  runState.remaining = finishedSplit.rest_seconds;
  updateTimerDisplay();

  hide($("run-phase-split"));
  hide($("run-phase-done"));
  show($("run-phase-rest"));

  runState.timer = setInterval(() => {
    runState.remaining -= 1;
    if (runState.remaining <= 0) {
      advanceAfterRest();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(runState.remaining / 60);
  const s = runState.remaining % 60;
  $("timer-display").textContent = `${m}:${String(s).padStart(2, "0")}`;
}

function advanceAfterRest() {
  clearRunTimer();
  runState.index += 1;
  showSplitPhase();
}

$("skip-rest-btn").addEventListener("click", () => advanceAfterRest());
$("rest-add-15").addEventListener("click", () => {
  if (!runState) return;
  runState.remaining += 15;
  updateTimerDisplay();
});

function showDonePhase() {
  clearRunTimer();
  hide($("run-phase-split"));
  hide($("run-phase-rest"));
  show($("run-phase-done"));
  $("run-progress").textContent = "";
}

function clearRunTimer() {
  if (runState && runState.timer) {
    clearInterval(runState.timer);
    runState.timer = null;
  }
}

function closeRun() {
  clearRunTimer();
  runState = null;
  hide($("run-modal"));
}
$("run-close").addEventListener("click", closeRun);
$("run-done-btn").addEventListener("click", closeRun);

// =================================================================
// UTIL
// =================================================================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
