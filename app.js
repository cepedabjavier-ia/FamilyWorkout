const STORAGE_KEY = "gymRoutineDb_v1";
const CURRENT_DB_VERSION = 7;
const APP_BUILD = "7.0.0";
window.GYM_ROUTINE_APP_BUILD = APP_BUILD;

const EXERCISE_LIBRARY = Array.isArray(window.EXERCISE_LIBRARY) ? window.EXERCISE_LIBRARY : [];
const WARMUP_LIBRARY = Array.isArray(window.WARMUP_LIBRARY) ? window.WARMUP_LIBRARY : [];
const STRETCH_LIBRARY = Array.isArray(window.STRETCH_LIBRARY) ? window.STRETCH_LIBRARY : [];

const EXERCISE_BY_ID = new Map(EXERCISE_LIBRARY.map(exercise => [exercise.id, exercise]));
const WARMUP_BY_ID = new Map(WARMUP_LIBRARY.map(item => [item.id, item]));
const STRETCH_BY_ID = new Map(STRETCH_LIBRARY.map(item => [item.id, item]));

const STRETCH_GROUPS = [...STRETCH_LIBRARY.reduce((groups, item) => {
  if (item?.groupKey && !groups.has(item.groupKey)) {
    groups.set(item.groupKey, item.group || item.groupKey);
  }
  return groups;
}, new Map()).entries()].map(([key, label]) => ({ key, label }));

const DEFAULT_STRETCH_SECTIONS = STRETCH_GROUPS.map(group => ({
  id: group.key,
  name: group.label,
  builtIn: true,
  libraryGroupKey: group.key,
  items: []
}));

const DEFAULT_DATA = {
  version: CURRENT_DB_VERSION,
  updatedAt: null,
  settings: {
    defaultRestSeconds: 90
  },
  days: {
    jueves: [],
    viernes: [],
    sabado: [],
    personalizado: []
  },
  warmups: {
    upper: [],
    lower: []
  },
  stretchSections: DEFAULT_STRETCH_SECTIONS
};

const DAY_LABELS = {
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  personalizado: "Personalizado"
};

let database = loadDatabase();
let activeDay = "jueves";
let activeSection = "routine";
let activeLibraryCategory = "Todos";
let recoveryPickerState = { kind: null, group: null };
const expandedRecoverySections = new Set();
const activeTimers = new Map();
let activeReorder = null;
const expandedExerciseByDay = {
  jueves: null,
  viernes: null,
  sabado: null,
  personalizado: null
};

const routineBody = document.getElementById("routineBody");
const mobileRoutineList = document.getElementById("mobileRoutineList");
const emptyState = document.getElementById("emptyState");
const exerciseCount = document.getElementById("exerciseCount");
const activeDayTitle = document.getElementById("activeDayTitle");
const rowTemplate = document.getElementById("exerciseRowTemplate");
const mobileExerciseTemplate = document.getElementById("mobileExerciseTemplate");
const settingsMessage = document.getElementById("settingsMessage");
const importInput = document.getElementById("importInput");
const exerciseSearch = document.getElementById("exerciseSearch");
const categoryFilters = document.getElementById("categoryFilters");
const exerciseLibraryGrid = document.getElementById("exerciseLibraryGrid");
const libraryEmptyState = document.getElementById("libraryEmptyState");
const pickerDayLabel = document.getElementById("pickerDayLabel");
const defaultRestInput = document.getElementById("defaultRestInput");

const routineView = document.getElementById("routineView");
const warmupView = document.getElementById("warmupView");
const stretchView = document.getElementById("stretchView");
const stretchGroupsContainer = document.getElementById("stretchGroupsContainer");
const recoverySearch = document.getElementById("recoverySearch");
const recoveryLibraryGrid = document.getElementById("recoveryLibraryGrid");
const recoveryLibraryEmpty = document.getElementById("recoveryLibraryEmpty");
const recoveryPickerEyebrow = document.getElementById("recoveryPickerEyebrow");
const recoveryPickerTitle = document.getElementById("recoveryPickerTitle");
const recoveryPickerSubtitle = document.getElementById("recoveryPickerSubtitle");
const addCustomStretchBtn = document.getElementById("addCustomStretchBtn");
const addStretchSectionBtn = document.getElementById("addStretchSectionBtn");
const stretchSectionForm = document.getElementById("stretchSectionForm");
const stretchSectionName = document.getElementById("stretchSectionName");
const stretchSectionMessage = document.getElementById("stretchSectionMessage");
const customStretchForm = document.getElementById("customStretchForm");
const customStretchName = document.getElementById("customStretchName");
const customStretchDoseType = document.getElementById("customStretchDoseType");
const customStretchDose = document.getElementById("customStretchDose");
const customStretchDoseUnit = document.getElementById("customStretchDoseUnit");
const customStretchSubtitle = document.getElementById("customStretchSubtitle");
const customStretchMessage = document.getElementById("customStretchMessage");

const exerciseDetailTitle = document.getElementById("exerciseDetailTitle");
const exerciseDetailCategory = document.getElementById("exerciseDetailCategory");
const exerciseGif = document.getElementById("exerciseGif");
const exerciseGifMissing = document.getElementById("exerciseGifMissing");
const exerciseGifPath = document.getElementById("exerciseGifPath");
const exerciseInstructions = document.getElementById("exerciseInstructions");
const customExerciseHint = document.getElementById("customExerciseHint");

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function generateId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultData();

    const parsed = JSON.parse(raw);
    if (!isValidDatabase(parsed)) return cloneDefaultData();

    return normalizeDatabase(parsed);
  } catch (error) {
    console.warn("No fue posible leer la base de datos local.", error);
    return cloneDefaultData();
  }
}

function normalizeDatabase(data) {
  const defaultRestSeconds = sanitizeRestSeconds(data?.settings?.defaultRestSeconds, 90);
  const rawWarmups = data?.warmups && typeof data.warmups === "object" ? data.warmups : {};

  return {
    version: CURRENT_DB_VERSION,
    updatedAt: data.updatedAt ?? null,
    settings: {
      defaultRestSeconds
    },
    days: {
      jueves: data.days.jueves.map(exercise => normalizeExercise(exercise, defaultRestSeconds)),
      viernes: data.days.viernes.map(exercise => normalizeExercise(exercise, defaultRestSeconds)),
      sabado: data.days.sabado.map(exercise => normalizeExercise(exercise, defaultRestSeconds)),
      personalizado: (Array.isArray(data.days.personalizado) ? data.days.personalizado : [])
        .map(exercise => normalizeExercise(exercise, defaultRestSeconds))
    },
    warmups: {
      upper: (Array.isArray(rawWarmups.upper) ? rawWarmups.upper : []).map(normalizeWarmupItem),
      lower: (Array.isArray(rawWarmups.lower) ? rawWarmups.lower : []).map(normalizeWarmupItem)
    },
    stretchSections: normalizeStretchSections(data)
  };
}

function normalizeStretchSections(data) {
  const incomingSections = Array.isArray(data?.stretchSections)
    ? data.stretchSections.map(normalizeStretchSection).filter(Boolean)
    : [];

  if (incomingSections.length > 0) {
    const usedIds = new Set();
    const builtIns = STRETCH_GROUPS.map(group => {
      const existing = incomingSections.find(section =>
        (section.builtIn && section.libraryGroupKey === group.key) || section.id === group.key
      );
      const normalized = existing
        ? { ...existing, id: group.key, name: group.label, builtIn: true, libraryGroupKey: group.key }
        : { id: group.key, name: group.label, builtIn: true, libraryGroupKey: group.key, items: [] };
      usedIds.add(existing?.id ?? group.key);
      return normalized;
    });

    const custom = incomingSections
      .filter(section => !usedIds.has(section.id))
      .map(section => section.builtIn
        ? { ...section, builtIn: false, libraryGroupKey: null }
        : section);
    return [...builtIns, ...custom];
  }

  const rawStretches = data?.stretches && typeof data.stretches === "object" ? data.stretches : {};
  const builtInKeys = new Set(STRETCH_GROUPS.map(group => group.key));
  const builtIns = STRETCH_GROUPS.map(group => ({
    id: group.key,
    name: group.label,
    builtIn: true,
    libraryGroupKey: group.key,
    items: (Array.isArray(rawStretches[group.key]) ? rawStretches[group.key] : []).map(normalizeStretchItem)
  }));

  const migratedCustom = Object.entries(rawStretches)
    .filter(([key, value]) => !builtInKeys.has(key) && Array.isArray(value))
    .map(([key, value]) => ({
      id: `migrated-${key}`,
      name: key,
      builtIn: false,
      libraryGroupKey: null,
      items: value.map(normalizeStretchItem)
    }));

  return [...builtIns, ...migratedCustom];
}

function normalizeStretchSection(section) {
  if (!section || typeof section !== "object") return null;
  const builtIn = Boolean(section.builtIn);
  return {
    id: typeof section.id === "string" && section.id ? section.id : generateId(),
    name: String(section.name ?? "Sección personalizada").trim() || "Sección personalizada",
    builtIn,
    libraryGroupKey: builtIn && typeof section.libraryGroupKey === "string" ? section.libraryGroupKey : null,
    items: (Array.isArray(section.items) ? section.items : []).map(normalizeStretchItem)
  };
}

function sanitizeRestSeconds(value, fallback = 90) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(3600, Math.max(5, Math.round(numericValue)));
}

function sanitizePlates(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  const rounded = Math.round(numericValue);
  return rounded >= 0 && rounded <= 2 ? rounded : 0;
}

function normalizeExercise(exercise, defaultRestSeconds = 90) {
  return {
    id: typeof exercise?.id === "string" && exercise.id ? exercise.id : generateId(),
    libraryId: typeof exercise?.libraryId === "string" && exercise.libraryId ? exercise.libraryId : null,
    name: exercise?.name ?? "",
    sets: exercise?.sets ?? "",
    reps: exercise?.reps ?? "",
    weight: exercise?.weight ?? "",
    plates: sanitizePlates(exercise?.plates),
    increaseWeightNextWeek: Boolean(exercise?.increaseWeightNextWeek),
    restSeconds: sanitizeRestSeconds(exercise?.restSeconds, defaultRestSeconds)
  };
}

function normalizeWarmupItem(item) {
  const libraryItem = item?.libraryId ? WARMUP_BY_ID.get(item.libraryId) : null;
  const fallbackDose = Number(libraryItem?.defaultDose ?? 10);
  return {
    id: typeof item?.id === "string" && item.id ? item.id : generateId(),
    libraryId: typeof item?.libraryId === "string" && item.libraryId ? item.libraryId : null,
    name: item?.name ?? libraryItem?.name ?? "Calentamiento",
    dose: sanitizeDose(item?.dose, fallbackDose)
  };
}

function normalizeStretchItem(item) {
  const libraryItem = item?.libraryId ? STRETCH_BY_ID.get(item.libraryId) : null;
  const doseType = item?.doseType === "reps" ? "reps" : "time";
  const fallback = Number(libraryItem?.defaultTime ?? (doseType === "reps" ? 10 : 30));
  const legacyValue = item?.dose ?? item?.timeSeconds;
  const dose = doseType === "reps"
    ? sanitizeDose(legacyValue, fallback)
    : sanitizeStretchTime(legacyValue, fallback);

  return {
    id: typeof item?.id === "string" && item.id ? item.id : generateId(),
    libraryId: typeof item?.libraryId === "string" && item.libraryId ? item.libraryId : null,
    name: item?.name ?? libraryItem?.name ?? "Elongación",
    doseType,
    dose
  };
}

function sanitizeDose(value, fallback = 10) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Math.max(1, Math.round(fallback || 10));
  return Math.min(9999, Math.max(1, Math.round(numeric)));
}

function sanitizeStretchTime(value, fallback = 30) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Math.min(3600, Math.max(5, Math.round(fallback || 30)));
  return Math.min(3600, Math.max(5, Math.round(numeric)));
}

function saveDatabase() {
  database.version = CURRENT_DB_VERSION;
  database.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function isValidDatabase(data) {
  return Boolean(
    data &&
    typeof data === "object" &&
    data.days &&
    Array.isArray(data.days.jueves) &&
    Array.isArray(data.days.viernes) &&
    Array.isArray(data.days.sabado) &&
    (data.days.personalizado === undefined || Array.isArray(data.days.personalizado))
  );
}

function getDefaultRestSeconds() {
  return sanitizeRestSeconds(database?.settings?.defaultRestSeconds, 90);
}

function createExerciseFromLibrary(libraryExercise) {
  return {
    id: generateId(),
    libraryId: libraryExercise.id,
    name: libraryExercise.name,
    sets: "",
    reps: "",
    weight: "",
    plates: 0,
    increaseWeightNextWeek: false,
    restSeconds: getDefaultRestSeconds()
  };
}

function createCustomExercise() {
  return {
    id: generateId(),
    libraryId: null,
    name: "",
    sets: "",
    reps: "",
    weight: "",
    plates: 0,
    increaseWeightNextWeek: false,
    restSeconds: getDefaultRestSeconds()
  };
}

function addLibraryExercise(libraryId) {
  const libraryExercise = EXERCISE_BY_ID.get(libraryId);
  if (!libraryExercise) return;

  const exercise = createExerciseFromLibrary(libraryExercise);
  database.days[activeDay].push(exercise);
  expandedExerciseByDay[activeDay] = exercise.id;
  saveDatabase();
  renderActiveDay();
  closeModal("exercisePickerModal");
}

function addCustomExercise() {
  const exercise = createCustomExercise();
  database.days[activeDay].push(exercise);
  expandedExerciseByDay[activeDay] = exercise.id;
  saveDatabase();
  renderActiveDay();
  closeModal("exercisePickerModal");

  requestAnimationFrame(() => {
    const selector = window.matchMedia("(max-width: 760px)").matches
      ? `.mobile-exercise-card[data-exercise-id="${exercise.id}"] .exercise-name`
      : `#routineBody tr[data-exercise-id="${exercise.id}"] .exercise-name`;
    document.querySelector(selector)?.focus();
  });
}

function getExerciseById(exerciseId, day = activeDay) {
  return database.days[day]?.find(item => item.id === exerciseId) ?? null;
}

function deleteExercise(exerciseId) {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return;

  const exerciseName = String(exercise.name ?? "").trim() || "este ejercicio";
  const confirmed = window.confirm(`¿Seguro que quieres eliminar “${exerciseName}” de ${DAY_LABELS[activeDay]}?`);
  if (!confirmed) return;

  clearTimer(exerciseId);
  if (expandedExerciseByDay[activeDay] === exerciseId) {
    expandedExerciseByDay[activeDay] = null;
  }
  database.days[activeDay] = database.days[activeDay].filter(item => item.id !== exerciseId);
  saveDatabase();
  renderActiveDay();
}

function updateExercise(exerciseId, key, value) {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return;
  exercise[key] = value;
  saveDatabase();
}

function getExerciseDomInstances(exerciseId) {
  return [
    ...routineBody.querySelectorAll(`tr[data-exercise-id="${exerciseId}"]`),
    ...mobileRoutineList.querySelectorAll(`.mobile-exercise-card[data-exercise-id="${exerciseId}"]`)
  ];
}

function syncMirroredField(exerciseId, fieldClass, value, sourceInput = null) {
  getExerciseDomInstances(exerciseId).forEach(instance => {
    const input = instance.querySelector(`.${fieldClass}`);
    if (input && input !== sourceInput) input.value = value;
  });
}

function syncMobileExerciseTitle(exerciseId, value) {
  const card = mobileRoutineList.querySelector(`.mobile-exercise-card[data-exercise-id="${exerciseId}"]`);
  const title = card?.querySelector(".mobile-exercise-name");
  if (title) title.textContent = getMobileExerciseName(value);
}

function renderActiveDay() {
  cancelActiveReorder();
  routineBody.innerHTML = "";
  mobileRoutineList.innerHTML = "";
  activeDayTitle.textContent = DAY_LABELS[activeDay];

  const exercises = database.days[activeDay];
  exerciseCount.textContent = `${exercises.length} ${exercises.length === 1 ? "ejercicio configurado" : "ejercicios configurados"}`;
  emptyState.classList.toggle("is-visible", exercises.length === 0);

  if (!exercises.some(exercise => exercise.id === expandedExerciseByDay[activeDay])) {
    expandedExerciseByDay[activeDay] = null;
  }

  exercises.forEach(exercise => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.exerciseId = exercise.id;
    bindExerciseControls(row, exercise, "desktop");
    routineBody.appendChild(row);

    const card = mobileExerciseTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.exerciseId = exercise.id;
    bindExerciseControls(card, exercise, "mobile");
    setMobileCardExpanded(card, expandedExerciseByDay[activeDay] === exercise.id);
    mobileRoutineList.appendChild(card);
  });
}

function bindExerciseControls(container, exercise, mode) {
  const nameInput = container.querySelector(".exercise-name");
  const setsInput = container.querySelector(".exercise-sets");
  const repsInput = container.querySelector(".exercise-reps");
  const weightInput = container.querySelector(".exercise-weight");
  const restInput = container.querySelector(".exercise-rest");
  const timerButton = container.querySelector(".timer-button");
  const platesButton = container.querySelector(".plates-button");
  const increaseWeightCheckbox = container.querySelector(".increase-weight-checkbox");
  const viewButton = container.querySelector(".view-button");
  const dragHandle = container.querySelector(".drag-handle");
  const deleteButton = container.querySelector(".delete-button");

  nameInput.value = exercise.name ?? "";
  setsInput.value = exercise.sets ?? "";
  repsInput.value = exercise.reps ?? "";
  weightInput.value = exercise.weight ?? "";
  restInput.value = sanitizeRestSeconds(exercise.restSeconds, getDefaultRestSeconds());
  timerButton.dataset.defaultSeconds = String(restInput.value);
  syncTimerButtonState(exercise.id, timerButton);
  paintPlatesButton(platesButton, sanitizePlates(exercise.plates));
  increaseWeightCheckbox.checked = Boolean(exercise.increaseWeightNextWeek);

  bindInput(nameInput, exercise.id, "name", "exercise-name", value => {
    syncMobileExerciseTitle(exercise.id, value);
  });
  bindInput(setsInput, exercise.id, "sets", "exercise-sets");
  bindInput(repsInput, exercise.id, "reps", "exercise-reps");
  bindInput(weightInput, exercise.id, "weight", "exercise-weight");
  bindRestInput(restInput, timerButton, exercise.id);
  bindPlatesButton(platesButton, exercise.id);
  bindIncreaseWeightCheckbox(increaseWeightCheckbox, exercise.id);

  const isLibraryLinked = Boolean(exercise.libraryId && EXERCISE_BY_ID.has(exercise.libraryId));
  viewButton.classList.toggle("is-custom", !isLibraryLinked);
  viewButton.title = isLibraryLinked
    ? "Ver GIF e instrucciones"
    : "Ver información del ejercicio personalizado";
  viewButton.addEventListener("click", () => openExerciseDetail(getExerciseById(exercise.id) ?? exercise));

  timerButton.addEventListener("click", () => startTimer(exercise.id));
  setupDragHandle(dragHandle, container, exercise.id, mode);
  deleteButton.addEventListener("click", () => deleteExercise(exercise.id));

  if (mode === "mobile") {
    const toggle = container.querySelector(".mobile-exercise-toggle");
    const title = container.querySelector(".mobile-exercise-name");
    title.textContent = getMobileExerciseName(exercise.name);
    toggle.addEventListener("click", () => toggleMobileExercise(container, exercise.id));
  }
}

function getMobileExerciseName(value) {
  return String(value ?? "").trim() || "Ejercicio sin nombre";
}

function setMobileCardExpanded(card, expanded) {
  card.classList.toggle("is-expanded", expanded);
  const toggle = card.querySelector(".mobile-exercise-toggle");
  toggle?.setAttribute("aria-expanded", String(expanded));
}

function toggleMobileExercise(card, exerciseId) {
  const shouldExpand = !card.classList.contains("is-expanded");

  mobileRoutineList.querySelectorAll(".mobile-exercise-card.is-expanded").forEach(candidate => {
    if (candidate !== card) setMobileCardExpanded(candidate, false);
  });

  setMobileCardExpanded(card, shouldExpand);
  expandedExerciseByDay[activeDay] = shouldExpand ? exerciseId : null;
}

function bindInput(input, exerciseId, key, fieldClass, afterChange = null) {
  input.addEventListener("input", event => {
    const value = event.target.value;
    updateExercise(exerciseId, key, value);
    syncMirroredField(exerciseId, fieldClass, value, event.target);
    afterChange?.(value);
  });
}

function bindRestInput(input, timerButton, exerciseId) {
  const commit = () => {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;

    const seconds = sanitizeRestSeconds(input.value, getDefaultRestSeconds());
    input.value = seconds;
    exercise.restSeconds = seconds;
    saveDatabase();

    getExerciseDomInstances(exerciseId).forEach(instance => {
      const mirrorInput = instance.querySelector(".exercise-rest");
      const mirrorButton = instance.querySelector(".timer-button");
      if (mirrorInput && mirrorInput !== input) mirrorInput.value = seconds;
      if (mirrorButton) mirrorButton.dataset.defaultSeconds = String(seconds);
    });

    if (!activeTimers.has(exerciseId)) {
      resetTimerButtons(exerciseId);
    }
  };

  input.addEventListener("change", commit);
  input.addEventListener("blur", commit);
}

function paintPlatesButton(button, value) {
  if (!button) return;
  const plates = sanitizePlates(value);
  button.textContent = String(plates);
  button.dataset.plates = String(plates);
  button.setAttribute("aria-label", `Cantidad de placas: ${plates}`);
}

function syncPlatesButtons(exerciseId, value) {
  getExerciseDomInstances(exerciseId).forEach(instance => {
    paintPlatesButton(instance.querySelector(".plates-button"), value);
  });
}

function bindPlatesButton(button, exerciseId) {
  if (!button) return;
  button.addEventListener("click", () => {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;
    const nextValue = (sanitizePlates(exercise.plates) + 1) % 3;
    exercise.plates = nextValue;
    saveDatabase();
    syncPlatesButtons(exerciseId, nextValue);
  });
}

function syncIncreaseWeightCheckboxes(exerciseId, checked, source = null) {
  getExerciseDomInstances(exerciseId).forEach(instance => {
    const checkbox = instance.querySelector(".increase-weight-checkbox");
    if (checkbox && checkbox !== source) checkbox.checked = checked;
  });
}

function bindIncreaseWeightCheckbox(checkbox, exerciseId) {
  if (!checkbox) return;
  checkbox.addEventListener("change", event => {
    const checked = Boolean(event.target.checked);
    updateExercise(exerciseId, "increaseWeightNextWeek", checked);
    syncIncreaseWeightCheckboxes(exerciseId, checked, event.target);
  });
}


/* REORDENAMIENTO */
function setupDragHandle(handle, sourceElement, exerciseId, mode) {
  if (!handle) return;

  handle.addEventListener("pointerdown", event => {
    if (activeReorder) return;
    if (event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();

    if (mode === "mobile") {
      mobileRoutineList.querySelectorAll(".mobile-exercise-card.is-expanded").forEach(card => {
        setMobileCardExpanded(card, false);
      });
      expandedExerciseByDay[activeDay] = null;
    }

    beginPointerReorder(handle, sourceElement, exerciseId, mode, event);
  });

  handle.addEventListener("keydown", event => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    moveExerciseByKeyboard(exerciseId, event.key === "ArrowUp" ? -1 : 1);
  });
}

function getReorderContainer(mode) {
  return mode === "mobile" ? mobileRoutineList : routineBody;
}

function beginPointerReorder(handle, sourceElement, exerciseId, mode, startEvent) {
  const container = getReorderContainer(mode);
  const sourceRect = sourceElement.getBoundingClientRect();
  const placeholder = createDragPlaceholder(mode, sourceRect.height);
  const preview = createDragPreview(sourceElement, sourceRect.width);
  const pointerId = startEvent.pointerId;

  container.insertBefore(placeholder, sourceElement);
  sourceElement.classList.add("is-drag-source");
  handle.setAttribute("aria-grabbed", "true");
  document.body.classList.add("is-reordering");

  activeReorder = {
    handle,
    sourceElement,
    exerciseId,
    day: activeDay,
    mode,
    container,
    placeholder,
    preview,
    pointerId,
    clientX: startEvent.clientX,
    clientY: startEvent.clientY,
    autoScrollFrame: null
  };

  positionDragPreview(preview, startEvent.clientX, startEvent.clientY);

  const move = event => {
    if (!activeReorder || event.pointerId !== pointerId) return;
    event.preventDefault();
    activeReorder.clientX = event.clientX;
    activeReorder.clientY = event.clientY;
    positionDragPreview(preview, event.clientX, event.clientY);
    movePlaceholderToPointer(event.clientX, event.clientY, activeReorder);
  };

  const finish = event => {
    if (!activeReorder || (event?.pointerId !== undefined && event.pointerId !== pointerId)) return;
    event?.preventDefault?.();
    finishPointerReorder(true);
  };

  const cancel = event => {
    if (!activeReorder || (event?.pointerId !== undefined && event.pointerId !== pointerId)) return;
    finishPointerReorder(false);
  };

  activeReorder.moveListener = move;
  activeReorder.finishListener = finish;
  activeReorder.cancelListener = cancel;

  document.addEventListener("pointermove", move, { passive: false });
  document.addEventListener("pointerup", finish, { passive: false });
  document.addEventListener("pointercancel", cancel, { passive: false });
  window.addEventListener("blur", cancel);

  activeReorder.autoScrollFrame = requestAnimationFrame(runDragAutoScroll);
}

function createDragPlaceholder(mode, height) {
  if (mode === "desktop") {
    const placeholder = document.createElement("tr");
    placeholder.className = "drag-placeholder desktop-drag-placeholder";
    const cell = document.createElement("td");
    cell.colSpan = 9;
    const inner = document.createElement("div");
    inner.className = "drag-placeholder-inner";
    inner.style.minHeight = `${Math.max(54, Math.round(height))}px`;
    inner.textContent = "Suelta aquí";
    cell.appendChild(inner);
    placeholder.appendChild(cell);
    return placeholder;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "drag-placeholder mobile-drag-placeholder";
  const inner = document.createElement("div");
  inner.className = "drag-placeholder-inner";
  inner.style.minHeight = `${Math.max(62, Math.round(height))}px`;
  inner.textContent = "Suelta aquí";
  placeholder.appendChild(inner);
  return placeholder;
}

function createDragPreview(sourceElement, sourceWidth) {
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.style.width = `${Math.min(Math.max(sourceWidth * 0.62, 230), 520)}px`;

  const icon = document.createElement("span");
  icon.className = "drag-preview-icon";
  icon.textContent = "☰";

  const label = document.createElement("strong");
  label.textContent = sourceElement.querySelector(".exercise-name")?.value?.trim()
    || sourceElement.querySelector(".mobile-exercise-name")?.textContent?.trim()
    || "Ejercicio";

  preview.append(icon, label);
  document.body.appendChild(preview);
  return preview;
}

function positionDragPreview(preview, clientX, clientY) {
  const margin = 12;
  const rect = preview.getBoundingClientRect();
  const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
  const x = Math.min(Math.max(margin, clientX + 16), maxX);
  const y = Math.min(Math.max(margin, clientY + 16), maxY);
  preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function movePlaceholderToPointer(clientX, clientY, drag) {
  const { container, sourceElement, placeholder } = drag;
  const candidates = [...container.children].filter(element =>
    element !== sourceElement && element !== placeholder && element.dataset?.exerciseId
  );

  if (!candidates.length) {
    container.appendChild(placeholder);
    return;
  }

  const elementUnderPointer = document.elementFromPoint(clientX, clientY);
  const directTarget = elementUnderPointer?.closest?.("[data-exercise-id]");

  if (directTarget && directTarget !== sourceElement && directTarget.parentElement === container) {
    const rect = directTarget.getBoundingClientRect();
    container.insertBefore(
      placeholder,
      clientY < rect.top + rect.height / 2 ? directTarget : directTarget.nextSibling
    );
    return;
  }

  const insertBeforeElement = candidates.find(candidate => {
    const rect = candidate.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2;
  });

  if (insertBeforeElement) container.insertBefore(placeholder, insertBeforeElement);
  else container.appendChild(placeholder);
}

function runDragAutoScroll() {
  if (!activeReorder) return;

  const threshold = Math.min(120, window.innerHeight * 0.2);
  const maxSpeed = 18;
  const y = activeReorder.clientY;
  let delta = 0;

  if (y < threshold) {
    const intensity = Math.min(1, Math.max(0, (threshold - y) / threshold));
    delta = -Math.max(3, Math.round(maxSpeed * intensity));
  } else if (y > window.innerHeight - threshold) {
    const intensity = Math.min(1, Math.max(0, (y - (window.innerHeight - threshold)) / threshold));
    delta = Math.max(3, Math.round(maxSpeed * intensity));
  }

  if (delta !== 0) {
    window.scrollBy(0, delta);
    movePlaceholderToPointer(activeReorder.clientX, activeReorder.clientY, activeReorder);
  }

  activeReorder.autoScrollFrame = requestAnimationFrame(runDragAutoScroll);
}

function finishPointerReorder(commitOrder) {
  const drag = activeReorder;
  if (!drag) return;

  document.removeEventListener("pointermove", drag.moveListener);
  document.removeEventListener("pointerup", drag.finishListener);
  document.removeEventListener("pointercancel", drag.cancelListener);
  window.removeEventListener("blur", drag.cancelListener);
  if (drag.autoScrollFrame) cancelAnimationFrame(drag.autoScrollFrame);

  drag.sourceElement.classList.remove("is-drag-source");
  drag.handle.removeAttribute("aria-grabbed");
  document.body.classList.remove("is-reordering");

  if (commitOrder) drag.container.insertBefore(drag.sourceElement, drag.placeholder);

  drag.placeholder.remove();
  drag.preview.remove();
  activeReorder = null;

  if (commitOrder) {
    persistCurrentDomOrder(drag.container, drag.day);
    renderActiveDay();
  }
}

function cancelActiveReorder() {
  if (activeReorder) finishPointerReorder(false);
}

function persistCurrentDomOrder(container, day = activeDay) {
  const ids = [...container.children]
    .filter(element => element.dataset?.exerciseId)
    .map(element => element.dataset.exerciseId);
  const byId = new Map(database.days[day].map(exercise => [exercise.id, exercise]));
  database.days[day] = ids.map(id => byId.get(id)).filter(Boolean);
  saveDatabase();
}

function moveExerciseByKeyboard(exerciseId, direction) {
  const exercises = database.days[activeDay];
  const currentIndex = exercises.findIndex(exercise => exercise.id === exerciseId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= exercises.length) return;

  [exercises[currentIndex], exercises[nextIndex]] = [exercises[nextIndex], exercises[currentIndex]];
  saveDatabase();
  renderActiveDay();

  requestAnimationFrame(() => {
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const target = isMobile
      ? mobileRoutineList.querySelector(`.mobile-exercise-card[data-exercise-id="${exerciseId}"] .mobile-drag-handle`)
      : routineBody.querySelector(`tr[data-exercise-id="${exerciseId}"] .desktop-drag-handle`);
    target?.focus();
  });
}

/* TEMPORIZADOR */
function getTimerButtons(exerciseId) {
  return getExerciseDomInstances(exerciseId)
    .map(instance => instance.querySelector(".timer-button"))
    .filter(Boolean);
}

function syncTimerButtonState(exerciseId, button) {
  const timer = activeTimers.get(exerciseId);
  if (!timer) {
    resetTimerButton(button);
    return;
  }

  button.classList.add("is-running");
  button.classList.remove("is-done");
  button.textContent = formatTime(timer.remaining);
  button.title = "Pulsa para cancelar el descanso";
}

function startTimer(exerciseId) {
  if (activeTimers.has(exerciseId)) {
    clearTimer(exerciseId);
    resetTimerButtons(exerciseId);
    return;
  }

  const exercise = getExerciseById(exerciseId);
  const duration = sanitizeRestSeconds(exercise?.restSeconds, getDefaultRestSeconds());
  const timer = {
    intervalId: null,
    remaining: duration,
    duration
  };

  activeTimers.set(exerciseId, timer);
  paintRunningTimer(exerciseId, timer.remaining);

  timer.intervalId = window.setInterval(() => {
    const current = activeTimers.get(exerciseId);
    if (!current) return;
    current.remaining -= 1;
    paintRunningTimer(exerciseId, current.remaining);

    if (current.remaining <= 0) {
      window.clearInterval(current.intervalId);
      activeTimers.delete(exerciseId);
      paintFinishedTimer(exerciseId);

      if ("vibrate" in navigator) navigator.vibrate([180, 100, 180]);

      window.setTimeout(() => {
        if (!activeTimers.has(exerciseId)) resetTimerButtons(exerciseId);
      }, 2500);
    }
  }, 1000);
}

function paintRunningTimer(exerciseId, remaining) {
  getTimerButtons(exerciseId).forEach(button => {
    button.classList.add("is-running");
    button.classList.remove("is-done");
    button.textContent = formatTime(Math.max(0, remaining));
    button.title = "Pulsa para cancelar el descanso";
  });
}

function paintFinishedTimer(exerciseId) {
  getTimerButtons(exerciseId).forEach(button => {
    button.classList.remove("is-running");
    button.classList.add("is-done");
    button.textContent = "¡Listo!";
    button.title = "Pulsa para iniciar otro descanso";
  });
}

function clearTimer(exerciseId) {
  const timer = activeTimers.get(exerciseId);
  if (timer?.intervalId) window.clearInterval(timer.intervalId);
  activeTimers.delete(exerciseId);
}

function clearAllTimers() {
  for (const timer of activeTimers.values()) {
    if (timer?.intervalId) window.clearInterval(timer.intervalId);
  }
  activeTimers.clear();
}

function resetTimerButtons(exerciseId) {
  getTimerButtons(exerciseId).forEach(resetTimerButton);
}

function resetTimerButton(button) {
  const seconds = sanitizeRestSeconds(button.dataset.defaultSeconds, 90);
  button.classList.remove("is-running", "is-done");
  button.textContent = `${seconds} s`;
  button.title = `Iniciar descanso de ${seconds} segundos`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/* PESTAÑAS */
function switchDay(day) {
  if (!DAY_LABELS[day]) return;

  cancelActiveReorder();
  clearAllTimers();
  activeDay = day;

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("is-active", tab.dataset.day === day);
  });

  renderActiveDay();
}

/* NAVEGACIÓN PRINCIPAL */
function switchAppSection(section) {
  if (!["routine", "warmup", "stretch"].includes(section)) return;
  cancelActiveReorder();
  activeSection = section;

  document.querySelectorAll(".app-section-tab").forEach(tab => {
    tab.classList.toggle("is-active", tab.dataset.section === section);
  });

  routineView.hidden = section !== "routine";
  warmupView.hidden = section !== "warmup";
  stretchView.hidden = section !== "stretch";

  if (section === "warmup") renderWarmups();
  if (section === "stretch") renderStretchGroups();
}

/* CALENTAMIENTO / ELONGACIÓN */
function getWarmupRegionLabel(region) {
  return region === "lower" ? "Tren Inferior" : "Tren Superior";
}

function getRecoveryLibrary(kind) {
  return kind === "stretch" ? STRETCH_LIBRARY : WARMUP_LIBRARY;
}

function getRecoveryMap(kind) {
  return kind === "stretch" ? STRETCH_BY_ID : WARMUP_BY_ID;
}

function getStretchSection(sectionId) {
  return database.stretchSections?.find(section => section.id === sectionId) ?? null;
}

function getRecoveryEntries(kind, group) {
  if (kind === "stretch") return getStretchSection(group)?.items ?? [];
  return database.warmups?.[group] ?? [];
}

function setRecoveryEntries(kind, group, entries) {
  if (kind === "stretch") {
    const section = getStretchSection(group);
    if (section) section.items = entries;
  } else {
    database.warmups[group] = entries;
  }
}

function getRecoveryPickerItems(kind, group) {
  if (kind === "stretch") {
    const section = getStretchSection(group);
    if (!section) return [];
    return section.builtIn && section.libraryGroupKey
      ? STRETCH_LIBRARY.filter(item => item.groupKey === section.libraryGroupKey)
      : STRETCH_LIBRARY;
  }
  return WARMUP_LIBRARY.filter(item => item.region === group);
}

function getRecoveryGroupLabel(kind, group) {
  if (kind === "warmup") return getWarmupRegionLabel(group);
  return getStretchSection(group)?.name ?? group;
}

function openRecoveryPicker(kind, group) {
  recoveryPickerState = { kind, group };
  const isStretch = kind === "stretch";
  const groupLabel = getRecoveryGroupLabel(kind, group);

  recoveryPickerEyebrow.textContent = isStretch ? "BIBLIOTECA DE ELONGACIÓN" : "BIBLIOTECA DE CALENTAMIENTO";
  recoveryPickerTitle.textContent = isStretch ? "Añadir elongación o movilidad" : "Añadir calentamiento";
  recoveryPickerSubtitle.innerHTML = `Selecciona una opción para <strong>${escapeHtml(groupLabel)}</strong>.`;
  recoverySearch.placeholder = isStretch ? "Buscar elongación o movilidad..." : "Buscar calentamiento...";
  recoverySearch.value = "";
  addCustomStretchBtn.hidden = !isStretch;
  renderRecoveryLibrary();
  openModal("recoveryPickerModal");
  requestAnimationFrame(() => recoverySearch.focus());
}

function renderRecoveryLibrary() {
  const { kind, group } = recoveryPickerState;
  if (!kind || !group) return;

  const searchTerm = normalizeText(recoverySearch.value.trim());
  const usedIds = kind === "stretch"
    ? new Set(database.stretchSections.flatMap(section => section.items).map(item => item.libraryId).filter(Boolean))
    : new Set([...database.warmups.upper, ...database.warmups.lower].map(item => item.libraryId).filter(Boolean));
  const matches = getRecoveryPickerItems(kind, group).filter(item => {
    const searchable = normalizeText(`${item.name} ${item.group || ""}`);
    return !searchTerm || searchable.includes(searchTerm);
  });

  recoveryLibraryGrid.innerHTML = "";
  recoveryLibraryEmpty.hidden = matches.length > 0;

  matches.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "library-exercise-card recovery-library-card";
    const isUsed = usedIds.has(item.id);
    button.classList.toggle("is-used", isUsed);

    const category = document.createElement("span");
    category.className = "library-category";
    category.textContent = kind === "stretch" ? (item.group || "Elongación") : getRecoveryGroupLabel(kind, group);

    const name = document.createElement("strong");
    name.textContent = item.name;

    const hint = document.createElement("span");
    hint.className = "library-add-hint";
    hint.textContent = isUsed ? "✓ Ya añadido · Agregar otra vez" : "+ Agregar";

    button.append(category, name, hint);
    button.addEventListener("click", () => addRecoveryItem(kind, group, item.id));
    recoveryLibraryGrid.appendChild(button);
  });
}

function addRecoveryItem(kind, group, libraryId) {
  const libraryItem = getRecoveryMap(kind).get(libraryId);
  if (!libraryItem) return;

  let item;
  if (kind === "stretch") {
    item = {
      id: generateId(),
      libraryId,
      name: libraryItem.name,
      doseType: "time",
      dose: sanitizeStretchTime(libraryItem.defaultTime, 30)
    };
  } else {
    item = {
      id: generateId(),
      libraryId,
      name: libraryItem.name,
      dose: sanitizeDose(libraryItem.defaultDose, 10)
    };
  }

  getRecoveryEntries(kind, group).push(item);
  expandedRecoverySections.add(`${kind}:${group}`);
  saveDatabase();
  kind === "stretch" ? renderStretchGroups() : renderWarmups();
  closeModal("recoveryPickerModal");
}

function deleteRecoveryItem(kind, group, itemId) {
  const items = getRecoveryEntries(kind, group);
  const item = items.find(candidate => candidate.id === itemId);
  if (!item) return;

  const confirmed = window.confirm(`¿Seguro que quieres eliminar “${item.name}” de ${getRecoveryGroupLabel(kind, group)}?`);
  if (!confirmed) return;

  setRecoveryEntries(kind, group, items.filter(candidate => candidate.id !== itemId));
  saveDatabase();
  kind === "stretch" ? renderStretchGroups() : renderWarmups();
}

function updateWarmupDose(group, itemId, value, input) {
  const item = getRecoveryEntries("warmup", group).find(candidate => candidate.id === itemId);
  if (!item) return;
  const libraryItem = item.libraryId ? WARMUP_BY_ID.get(item.libraryId) : null;
  const sanitized = sanitizeDose(value, libraryItem?.defaultDose ?? 10);
  item.dose = sanitized;
  input.value = sanitized;
  saveDatabase();
}

function updateStretchDose(group, itemId, value, input) {
  const item = getRecoveryEntries("stretch", group).find(candidate => candidate.id === itemId);
  if (!item) return;
  const libraryItem = item.libraryId ? STRETCH_BY_ID.get(item.libraryId) : null;
  const doseType = item.doseType === "reps" ? "reps" : "time";
  const sanitized = doseType === "reps"
    ? sanitizeDose(value, 10)
    : sanitizeStretchTime(value, libraryItem?.defaultTime ?? 30);
  item.dose = sanitized;
  input.value = sanitized;
  saveDatabase();
}

function createRecoveryItemElement(kind, group, item) {
  const libraryItem = item.libraryId ? getRecoveryMap(kind).get(item.libraryId) : null;
  const row = document.createElement("article");
  row.className = "recovery-item";
  row.dataset.itemId = item.id;

  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "view-button recovery-view-button";
  viewButton.textContent = "Ver";
  viewButton.addEventListener("click", () => {
    if (libraryItem) {
      openLibraryDetail(libraryItem, kind);
    } else {
      openCustomRecoveryDetail(item, kind, group);
    }
  });

  const name = document.createElement("strong");
  name.className = "recovery-item-name";
  name.textContent = item.name;

  const doseWrap = document.createElement("label");
  doseWrap.className = "recovery-dose";
  const doseLabel = document.createElement("span");
  doseLabel.className = "recovery-dose-label";

  const input = document.createElement("input");
  input.className = "field compact-field recovery-dose-input";
  input.type = "number";
  input.inputMode = "numeric";

  const unit = document.createElement("span");
  unit.className = "recovery-dose-unit";

  if (kind === "stretch") {
    const doseType = item.doseType === "reps" ? "reps" : "time";
    doseLabel.textContent = doseType === "reps" ? "Repeticiones" : "Tiempo";
    input.min = doseType === "reps" ? "1" : "5";
    input.max = doseType === "reps" ? "9999" : "3600";
    input.step = doseType === "reps" ? "1" : "5";
    input.value = doseType === "reps"
      ? sanitizeDose(item.dose, 10)
      : sanitizeStretchTime(item.dose, libraryItem?.defaultTime ?? 30);
    unit.textContent = doseType === "reps" ? "reps" : "s";
    input.addEventListener("change", () => updateStretchDose(group, item.id, input.value, input));
  } else {
    const doseType = libraryItem?.doseType === "time" ? "time" : "reps";
    doseLabel.textContent = doseType === "time" ? "Tiempo" : "Repeticiones";
    input.min = "1";
    input.max = "9999";
    input.step = doseType === "time" ? "5" : "1";
    input.value = sanitizeDose(item.dose, libraryItem?.defaultDose ?? 10);
    unit.textContent = doseType === "time" ? "s" : "reps";
    input.addEventListener("change", () => updateWarmupDose(group, item.id, input.value, input));
  }

  doseWrap.append(doseLabel, input, unit);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button recovery-delete-button";
  deleteButton.setAttribute("aria-label", `Eliminar ${item.name}`);
  deleteButton.title = "Eliminar";
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => deleteRecoveryItem(kind, group, item.id));

  row.append(name, doseWrap, viewButton, deleteButton);
  return row;
}

function renderWarmups() {
  [["upper", "warmupUpperList", "warmupUpperEmpty", "warmupUpperCount"], ["lower", "warmupLowerList", "warmupLowerEmpty", "warmupLowerCount"]]
    .forEach(([group, listId, emptyId, countId]) => {
      const list = document.getElementById(listId);
      const empty = document.getElementById(emptyId);
      const count = document.getElementById(countId);
      const items = getRecoveryEntries("warmup", group);
      list.innerHTML = "";
      items.forEach(item => list.appendChild(createRecoveryItemElement("warmup", group, item)));
      empty.hidden = items.length > 0;
      count.textContent = `${items.length} ${items.length === 1 ? "ejercicio" : "ejercicios"}`;

      const accordion = document.querySelector(`.recovery-accordion[data-recovery-kind="warmup"][data-recovery-group="${group}"]`);
      setRecoveryAccordionExpanded(accordion, expandedRecoverySections.has(`warmup:${group}`));
    });
}

function renderStretchGroups() {
  stretchGroupsContainer.innerHTML = "";

  database.stretchSections.forEach(section => {
    const items = section.items;
    const accordion = document.createElement("article");
    accordion.className = "recovery-accordion stretch-section-accordion";
    accordion.dataset.recoveryKind = "stretch";
    accordion.dataset.recoveryGroup = section.id;
    accordion.classList.toggle("is-custom-section", !section.builtIn);

    const header = document.createElement("div");
    header.className = "stretch-section-header";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "recovery-accordion-toggle stretch-section-toggle";
    toggle.setAttribute("aria-expanded", "false");

    const titleWrap = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = section.name;
    const meta = document.createElement("small");
    const kindLabel = section.builtIn ? "Predeterminada" : "Personalizada";
    meta.textContent = `${items.length} ${items.length === 1 ? "movimiento" : "movimientos"} · ${kindLabel}`;
    titleWrap.append(title, meta);

    const chevron = document.createElement("span");
    chevron.className = "recovery-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    toggle.append(titleWrap, chevron);
    toggle.addEventListener("click", () => toggleRecoveryAccordion(accordion));
    header.appendChild(toggle);

    if (!section.builtIn) {
      const deleteSectionButton = document.createElement("button");
      deleteSectionButton.type = "button";
      deleteSectionButton.className = "stretch-section-delete";
      deleteSectionButton.title = `Eliminar sección ${section.name}`;
      deleteSectionButton.setAttribute("aria-label", `Eliminar sección ${section.name}`);
      deleteSectionButton.textContent = "Eliminar sección";
      deleteSectionButton.addEventListener("click", () => deleteStretchSection(section.id));
      header.appendChild(deleteSectionButton);
    }

    const body = document.createElement("div");
    body.className = "recovery-accordion-body";

    const toolbar = document.createElement("div");
    toolbar.className = "recovery-section-toolbar";
    const description = document.createElement("p");
    description.textContent = section.builtIn
      ? `Elongaciones de biblioteca para ${section.name.toLocaleLowerCase("es")}. También puedes añadir un movimiento personalizado.`
      : "Sección libre: puedes mezclar cualquier elemento de la biblioteca o crear movimientos propios.";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "secondary-button recovery-add-button";
    addButton.textContent = "+ Añadir movimiento";
    addButton.addEventListener("click", () => openRecoveryPicker("stretch", section.id));
    toolbar.append(description, addButton);

    const list = document.createElement("div");
    list.className = "recovery-item-list";
    items.forEach(item => list.appendChild(createRecoveryItemElement("stretch", section.id, item)));

    const empty = document.createElement("div");
    empty.className = "recovery-empty";
    empty.hidden = items.length > 0;
    empty.textContent = `Aún no hay movimientos en ${section.name}.`;

    body.append(toolbar, list, empty);
    accordion.append(header, body);
    setRecoveryAccordionExpanded(accordion, expandedRecoverySections.has(`stretch:${section.id}`));
    stretchGroupsContainer.appendChild(accordion);
  });
}

function openStretchSectionModal() {
  stretchSectionName.value = "";
  stretchSectionMessage.textContent = "";
  openModal("stretchSectionModal");
  requestAnimationFrame(() => stretchSectionName.focus());
}

function createStretchSection(name) {
  const cleanName = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!cleanName) return null;
  const duplicate = database.stretchSections.some(section => normalizeText(section.name) === normalizeText(cleanName));
  if (duplicate) return null;

  const section = {
    id: generateId(),
    name: cleanName,
    builtIn: false,
    libraryGroupKey: null,
    items: []
  };
  database.stretchSections.push(section);
  expandedRecoverySections.add(`stretch:${section.id}`);
  saveDatabase();
  renderStretchGroups();
  return section;
}

function deleteStretchSection(sectionId) {
  const section = getStretchSection(sectionId);
  if (!section || section.builtIn) return;
  const suffix = section.items.length
    ? ` También se eliminarán ${section.items.length} ${section.items.length === 1 ? "movimiento contenido" : "movimientos contenidos"}.`
    : "";
  const confirmed = window.confirm(`¿Seguro que quieres eliminar la sección “${section.name}”?${suffix}`);
  if (!confirmed) return;

  database.stretchSections = database.stretchSections.filter(candidate => candidate.id !== sectionId);
  expandedRecoverySections.delete(`stretch:${sectionId}`);
  saveDatabase();
  renderStretchGroups();
}

function openCustomStretchModal() {
  const { kind, group } = recoveryPickerState;
  if (kind !== "stretch" || !getStretchSection(group)) return;
  customStretchName.value = "";
  customStretchDoseType.value = "time";
  customStretchDose.value = "30";
  customStretchDoseUnit.textContent = "s";
  customStretchSubtitle.innerHTML = `Se añadirá a <strong>${escapeHtml(getRecoveryGroupLabel("stretch", group))}</strong>.`;
  customStretchMessage.textContent = "";
  closeModal("recoveryPickerModal");
  openModal("customStretchModal");
  requestAnimationFrame(() => customStretchName.focus());
}

function addCustomStretchItem() {
  const { kind, group } = recoveryPickerState;
  const section = kind === "stretch" ? getStretchSection(group) : null;
  if (!section) return false;

  const name = customStretchName.value.trim().replace(/\s+/g, " ");
  if (!name) {
    customStretchMessage.textContent = "Ingresa un nombre para el movimiento.";
    customStretchName.focus();
    return false;
  }

  const doseType = customStretchDoseType.value === "reps" ? "reps" : "time";
  const dose = doseType === "reps"
    ? sanitizeDose(customStretchDose.value, 10)
    : sanitizeStretchTime(customStretchDose.value, 30);

  section.items.push({
    id: generateId(),
    libraryId: null,
    name,
    doseType,
    dose
  });
  expandedRecoverySections.add(`stretch:${group}`);
  saveDatabase();
  renderStretchGroups();
  closeModal("customStretchModal");
  return true;
}

function syncCustomStretchDoseFields() {
  const isReps = customStretchDoseType.value === "reps";
  customStretchDoseUnit.textContent = isReps ? "reps" : "s";
  customStretchDose.min = isReps ? "1" : "5";
  customStretchDose.max = isReps ? "9999" : "3600";
  customStretchDose.step = isReps ? "1" : "5";
  if (isReps && Number(customStretchDose.value) === 30) customStretchDose.value = "10";
  if (!isReps && Number(customStretchDose.value) === 10) customStretchDose.value = "30";
}

function openCustomRecoveryDetail(item, kind, group) {
  resetExerciseDetailState();
  exerciseDetailTitle.textContent = item.name || "Movimiento personalizado";
  exerciseDetailCategory.textContent = kind === "stretch"
    ? `ELONGACIÓN · ${getRecoveryGroupLabel("stretch", group).toUpperCase()}`
    : "CALENTAMIENTO PERSONALIZADO";
  populateInstructions([
    "Este movimiento fue creado manualmente y no está vinculado a una biblioteca.",
    "La dosis configurada se conserva en tu base de datos y en las exportaciones JSON."
  ]);
  showMissingGif({
    title: "Movimiento personalizado",
    message: "No hay un GIF asociado porque este elemento no pertenece a stretch-library.js.",
    path: ""
  });
  customExerciseHint.hidden = true;
  openModal("exerciseDetailModal");
}

function setRecoveryAccordionExpanded(accordion, expanded) {
  if (!accordion) return;
  accordion.classList.toggle("is-expanded", expanded);
  accordion.querySelector(".recovery-accordion-toggle")?.setAttribute("aria-expanded", String(expanded));
}

function toggleRecoveryAccordion(accordion) {
  if (!accordion) return;
  const kind = accordion.dataset.recoveryKind;
  const group = accordion.dataset.recoveryGroup;
  const key = `${kind}:${group}`;
  const expanded = !accordion.classList.contains("is-expanded");
  setRecoveryAccordionExpanded(accordion, expanded);
  expanded ? expandedRecoverySections.add(key) : expandedRecoverySections.delete(key);
}

function openLibraryDetail(libraryItem, kind) {
  resetExerciseDetailState();
  exerciseDetailTitle.textContent = libraryItem.name || "Detalle";

  if (kind === "warmup") {
    exerciseDetailCategory.textContent = `CALENTAMIENTO · ${getWarmupRegionLabel(libraryItem.region).toUpperCase()}`;
  } else if (kind === "stretch") {
    exerciseDetailCategory.textContent = `ELONGACIÓN · ${(libraryItem.group || "").toUpperCase()}`;
  } else {
    exerciseDetailCategory.textContent = (libraryItem.category || "EJERCICIO").toUpperCase();
  }

  populateInstructions(libraryItem.instructions);
  loadExerciseGif(libraryItem.gif, libraryItem.name);
  customExerciseHint.hidden = true;
  openModal("exerciseDetailModal");
}

/* BIBLIOTECA */
function openExercisePicker() {
  pickerDayLabel.textContent = DAY_LABELS[activeDay];
  exerciseSearch.value = "";
  activeLibraryCategory = "Todos";
  renderCategoryFilters();
  renderExerciseLibrary();
  openModal("exercisePickerModal");

  requestAnimationFrame(() => exerciseSearch.focus());
}

function renderCategoryFilters() {
  const categories = ["Todos", ...new Set(EXERCISE_LIBRARY.map(item => item.category).filter(Boolean))];
  categoryFilters.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-chip";
    button.textContent = category;
    button.classList.toggle("is-active", category === activeLibraryCategory);
    button.addEventListener("click", () => {
      activeLibraryCategory = category;
      renderCategoryFilters();
      renderExerciseLibrary();
    });
    categoryFilters.appendChild(button);
  });
}

function getUsedLibraryIds() {
  return new Set(
    Object.values(database.days)
      .flat()
      .map(exercise => exercise.libraryId)
      .filter(Boolean)
  );
}

function renderExerciseLibrary() {
  const searchTerm = normalizeText(exerciseSearch.value.trim());
  const usedLibraryIds = getUsedLibraryIds();

  const matches = EXERCISE_LIBRARY.filter(exercise => {
    const matchesCategory = activeLibraryCategory === "Todos" || exercise.category === activeLibraryCategory;
    const searchable = normalizeText(`${exercise.name} ${exercise.category}`);
    const matchesSearch = !searchTerm || searchable.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  exerciseLibraryGrid.innerHTML = "";
  libraryEmptyState.hidden = matches.length > 0;

  matches.forEach(exercise => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "library-exercise-card";
    const isUsed = usedLibraryIds.has(exercise.id);
    button.classList.toggle("is-used", isUsed);

    const category = document.createElement("span");
    category.className = "library-category";
    category.textContent = exercise.category;

    const name = document.createElement("strong");
    name.textContent = exercise.name;

    const hint = document.createElement("span");
    hint.className = "library-add-hint";
    hint.textContent = isUsed ? "✓ Ya está en tu rutina · Agregar otra vez" : "+ Agregar a la rutina";

    button.append(category, name, hint);
    button.addEventListener("click", () => addLibraryExercise(exercise.id));
    exerciseLibraryGrid.appendChild(button);
  });
}

function normalizeText(value) {
  return String(value)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* POPUP VER */
function openExerciseDetail(exercise) {
  const libraryExercise = exercise.libraryId ? EXERCISE_BY_ID.get(exercise.libraryId) : null;

  resetExerciseDetailState();
  exerciseDetailTitle.textContent = exercise.name?.trim() || libraryExercise?.name || "Ejercicio sin nombre";

  if (libraryExercise) {
    exerciseDetailCategory.textContent = libraryExercise.category?.toUpperCase() || "EJERCICIO";
    populateInstructions(libraryExercise.instructions);
    loadExerciseGif(libraryExercise.gif, libraryExercise.name);
    customExerciseHint.hidden = true;
  } else {
    exerciseDetailCategory.textContent = "PERSONALIZADO";
    populateInstructions([]);
    showMissingGif({
      title: "Ejercicio personalizado",
      message: "Este ejercicio todavía no tiene un GIF asociado a la biblioteca.",
      path: ""
    });
    customExerciseHint.hidden = false;
  }

  openModal("exerciseDetailModal");
}

function resetExerciseDetailState() {
  exerciseGif.onload = null;
  exerciseGif.onerror = null;
  exerciseGif.removeAttribute("src");
  exerciseGif.hidden = true;
  exerciseGifMissing.hidden = true;
  exerciseInstructions.innerHTML = "";
  customExerciseHint.hidden = true;
}

function populateInstructions(instructions) {
  exerciseInstructions.innerHTML = "";

  if (!Array.isArray(instructions) || instructions.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No hay instrucciones asociadas a este ejercicio.";
    exerciseInstructions.appendChild(item);
    return;
  }

  instructions.forEach(text => {
    const item = document.createElement("li");
    item.textContent = text;
    exerciseInstructions.appendChild(item);
  });
}

function loadExerciseGif(path, altName) {
  if (!path) {
    showMissingGif({
      title: "GIF no configurado",
      message: "Este elemento no tiene una ruta de GIF definida en su biblioteca.",
      path: ""
    });
    return;
  }

  exerciseGif.alt = `Demostración: ${altName}`;
  exerciseGif.hidden = true;
  exerciseGifMissing.hidden = true;

  exerciseGif.onload = () => {
    exerciseGifMissing.hidden = true;
    exerciseGif.hidden = false;
  };

  exerciseGif.onerror = () => {
    exerciseGif.hidden = true;
    showMissingGif({
      title: "GIF todavía no disponible",
      message: "La rutina funciona normalmente. Sube el archivo a GitHub usando esta ruta:",
      path
    });
  };

  exerciseGif.src = path;
}

function showMissingGif({ title, message, path }) {
  const titleElement = exerciseGifMissing.querySelector("strong");
  const messageElement = exerciseGifMissing.querySelector("p");

  titleElement.textContent = title;
  messageElement.textContent = message;
  exerciseGifPath.textContent = path;
  exerciseGifPath.hidden = !path;
  exerciseGifMissing.hidden = false;
}

/* MODALES */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = false;
  syncBodyScrollLock();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = true;
  syncBodyScrollLock();
}

function syncBodyScrollLock() {
  const anyModalOpen = [...document.querySelectorAll(".modal")].some(modal => !modal.hidden);
  document.body.style.overflow = anyModalOpen ? "hidden" : "";
}

function closeTopModal() {
  const priority = ["exerciseDetailModal", "customStretchModal", "stretchSectionModal", "recoveryPickerModal", "exercisePickerModal", "settingsModal"];
  const openId = priority.find(id => !document.getElementById(id).hidden);
  if (openId) closeModal(openId);
}

function renderAllData() {
  renderActiveDay();
  renderWarmups();
  renderStretchGroups();
}

/* CONFIGURACIÓN / JSON */
function openSettings() {
  settingsMessage.textContent = "";
  defaultRestInput.value = getDefaultRestSeconds();
  openModal("settingsModal");
}

function exportDatabase() {
  const exportPayload = {
    ...database,
    version: CURRENT_DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: "Mi Rutina"
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `mi-rutina-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  settingsMessage.textContent = "Configuración exportada correctamente.";
}

async function importDatabase(file) {
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!isValidDatabase(parsed)) {
      throw new Error("El archivo no tiene el formato esperado.");
    }

    clearAllTimers();
    database = normalizeDatabase(parsed);
    database.updatedAt = new Date().toISOString();

    saveDatabase();
    renderAllData();

    const importedVersion = Number(parsed.version ?? 1);
    settingsMessage.textContent = importedVersion < CURRENT_DB_VERSION
      ? "Configuración antigua importada y actualizada correctamente."
      : "Configuración importada correctamente.";
  } catch (error) {
    console.error(error);
    settingsMessage.textContent = "No se pudo importar el archivo. Verifica que sea una copia JSON válida.";
  } finally {
    importInput.value = "";
  }
}

function resetDatabase() {
  const confirmed = window.confirm("¿Seguro que quieres borrar la rutina, los calentamientos y todas las secciones de elongación/movilidad guardadas en este dispositivo?");
  if (!confirmed) return;

  clearAllTimers();
  database = cloneDefaultData();
  saveDatabase();
  expandedRecoverySections.clear();
  renderAllData();
  settingsMessage.textContent = "Todos los datos fueron restablecidos.";
}

/* EVENTOS */
document.querySelectorAll(".app-section-tab").forEach(tab => {
  tab.addEventListener("click", () => switchAppSection(tab.dataset.section));
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => switchDay(tab.dataset.day));
});

document.getElementById("addExerciseBtn").addEventListener("click", openExercisePicker);
document.getElementById("emptyAddBtn").addEventListener("click", openExercisePicker);
document.getElementById("addCustomExerciseBtn").addEventListener("click", addCustomExercise);

document.querySelectorAll('.recovery-accordion[data-recovery-kind="warmup"] .recovery-accordion-toggle').forEach(toggle => {
  toggle.addEventListener("click", () => toggleRecoveryAccordion(toggle.closest(".recovery-accordion")));
});

document.querySelectorAll('[data-add-recovery="warmup"]').forEach(button => {
  button.addEventListener("click", () => openRecoveryPicker("warmup", button.dataset.group));
});

addStretchSectionBtn.addEventListener("click", openStretchSectionModal);
addCustomStretchBtn.addEventListener("click", openCustomStretchModal);

stretchSectionForm.addEventListener("submit", event => {
  event.preventDefault();
  const created = createStretchSection(stretchSectionName.value);
  if (!created) {
    stretchSectionMessage.textContent = stretchSectionName.value.trim()
      ? "Ya existe una sección con ese nombre. Elige otro nombre."
      : "Ingresa un nombre para la sección.";
    stretchSectionName.focus();
    return;
  }
  closeModal("stretchSectionModal");
});

customStretchDoseType.addEventListener("change", syncCustomStretchDoseFields);
customStretchForm.addEventListener("submit", event => {
  event.preventDefault();
  addCustomStretchItem();
});

document.getElementById("settingsBtn").addEventListener("click", openSettings);
document.getElementById("exportBtn").addEventListener("click", exportDatabase);
document.getElementById("resetBtn").addEventListener("click", resetDatabase);

defaultRestInput.addEventListener("change", () => {
  const seconds = sanitizeRestSeconds(defaultRestInput.value, 90);
  defaultRestInput.value = seconds;
  database.settings.defaultRestSeconds = seconds;
  saveDatabase();
  settingsMessage.textContent = `Descanso predeterminado actualizado a ${seconds} segundos. Los ejercicios existentes conservan su valor.`;
});

exerciseSearch.addEventListener("input", renderExerciseLibrary);
recoverySearch.addEventListener("input", renderRecoveryLibrary);
importInput.addEventListener("change", event => importDatabase(event.target.files?.[0]));

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", () => closeModal(element.dataset.closeModal));
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeTopModal();
});

renderCategoryFilters();
renderAllData();
switchAppSection("routine");
