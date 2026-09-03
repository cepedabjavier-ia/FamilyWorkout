const STORAGE_KEY = "gymRoutineDb_v1";
const CURRENT_DB_VERSION = 3;

const EXERCISE_LIBRARY = Array.isArray(window.EXERCISE_LIBRARY) ? window.EXERCISE_LIBRARY : [];
const EXERCISE_BY_ID = new Map(EXERCISE_LIBRARY.map(exercise => [exercise.id, exercise]));

const DEFAULT_DATA = {
  version: CURRENT_DB_VERSION,
  updatedAt: null,
  settings: {
    defaultRestSeconds: 90
  },
  days: {
    jueves: [],
    viernes: [],
    sabado: []
  }
};

const DAY_LABELS = {
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado"
};

let database = loadDatabase();
let activeDay = "jueves";
let activeLibraryCategory = "Todos";
const activeTimers = new Map();
let activeReorder = null;
const expandedExerciseByDay = {
  jueves: null,
  viernes: null,
  sabado: null
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

  return {
    version: CURRENT_DB_VERSION,
    updatedAt: data.updatedAt ?? null,
    settings: {
      defaultRestSeconds
    },
    days: {
      jueves: data.days.jueves.map(exercise => normalizeExercise(exercise, defaultRestSeconds)),
      viernes: data.days.viernes.map(exercise => normalizeExercise(exercise, defaultRestSeconds)),
      sabado: data.days.sabado.map(exercise => normalizeExercise(exercise, defaultRestSeconds))
    }
  };
}

function sanitizeRestSeconds(value, fallback = 90) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(3600, Math.max(5, Math.round(numericValue)));
}

function normalizeExercise(exercise, defaultRestSeconds = 90) {
  return {
    id: typeof exercise?.id === "string" && exercise.id ? exercise.id : generateId(),
    libraryId: typeof exercise?.libraryId === "string" && exercise.libraryId ? exercise.libraryId : null,
    name: exercise?.name ?? "",
    sets: exercise?.sets ?? "",
    reps: exercise?.reps ?? "",
    weight: exercise?.weight ?? "",
    restSeconds: sanitizeRestSeconds(exercise?.restSeconds, defaultRestSeconds)
  };
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
    Array.isArray(data.days.sabado)
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

  bindInput(nameInput, exercise.id, "name", "exercise-name", value => {
    syncMobileExerciseTitle(exercise.id, value);
  });
  bindInput(setsInput, exercise.id, "sets", "exercise-sets");
  bindInput(repsInput, exercise.id, "reps", "exercise-reps");
  bindInput(weightInput, exercise.id, "weight", "exercise-weight");
  bindRestInput(restInput, timerButton, exercise.id);

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
    cell.colSpan = 7;
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

function renderExerciseLibrary() {
  const searchTerm = normalizeText(exerciseSearch.value.trim());

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

    const category = document.createElement("span");
    category.className = "library-category";
    category.textContent = exercise.category;

    const name = document.createElement("strong");
    name.textContent = exercise.name;

    const hint = document.createElement("span");
    hint.className = "library-add-hint";
    hint.textContent = "+ Agregar a la rutina";

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
      message: "Este ejercicio no tiene una ruta de GIF definida en exercise-library.js.",
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
  const priority = ["exerciseDetailModal", "exercisePickerModal", "settingsModal"];
  const openId = priority.find(id => !document.getElementById(id).hidden);
  if (openId) closeModal(openId);
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
    app: "Mi Rutina de Gimnasio"
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `rutina-gimnasio-${date}.json`;
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
    renderActiveDay();

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
  const confirmed = window.confirm("¿Seguro que quieres borrar toda la rutina guardada en este dispositivo?");
  if (!confirmed) return;

  clearAllTimers();
  database = cloneDefaultData();
  saveDatabase();
  renderActiveDay();
  settingsMessage.textContent = "La rutina fue restablecida.";
}

/* EVENTOS */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => switchDay(tab.dataset.day));
});

document.getElementById("addExerciseBtn").addEventListener("click", openExercisePicker);
document.getElementById("emptyAddBtn").addEventListener("click", openExercisePicker);
document.getElementById("addCustomExerciseBtn").addEventListener("click", addCustomExercise);
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
importInput.addEventListener("change", event => importDatabase(event.target.files?.[0]));

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", () => closeModal(element.dataset.closeModal));
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeTopModal();
});

renderCategoryFilters();
renderActiveDay();
