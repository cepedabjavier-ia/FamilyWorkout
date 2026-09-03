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
const emptyState = document.getElementById("emptyState");
const exerciseCount = document.getElementById("exerciseCount");
const activeDayTitle = document.getElementById("activeDayTitle");
const rowTemplate = document.getElementById("exerciseRowTemplate");
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
    routineBody.querySelector("tr:last-child .exercise-name")?.focus();
  });
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
  const exercise = database.days[activeDay].find(item => item.id === exerciseId);
  if (!exercise) return;

  exercise[key] = value;
  saveDatabase();
}

function renderActiveDay() {
  cancelActiveReorder();
  routineBody.innerHTML = "";
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

    const nameInput = row.querySelector(".exercise-name");
    const setsInput = row.querySelector(".exercise-sets");
    const repsInput = row.querySelector(".exercise-reps");
    const weightInput = row.querySelector(".exercise-weight");
    const restInput = row.querySelector(".exercise-rest");
    const timerButton = row.querySelector(".timer-button");
    const viewButton = row.querySelector(".view-button");
    const mobileToggle = row.querySelector(".mobile-exercise-toggle");
    const mobileName = row.querySelector(".mobile-exercise-name");
    const dragHandles = [...row.querySelectorAll(".drag-handle")];

    nameInput.value = exercise.name ?? "";
    setsInput.value = exercise.sets ?? "";
    repsInput.value = exercise.reps ?? "";
    weightInput.value = exercise.weight ?? "";
    restInput.value = sanitizeRestSeconds(exercise.restSeconds, getDefaultRestSeconds());
    timerButton.dataset.defaultSeconds = String(restInput.value);
    resetTimerButton(timerButton);

    mobileName.textContent = getMobileExerciseName(exercise.name);
    setMobileRowExpanded(row, expandedExerciseByDay[activeDay] === exercise.id);

    bindInput(nameInput, exercise.id, "name");
    nameInput.addEventListener("input", event => {
      mobileName.textContent = getMobileExerciseName(event.target.value);
    });
    bindInput(setsInput, exercise.id, "sets");
    bindInput(repsInput, exercise.id, "reps");
    bindInput(weightInput, exercise.id, "weight");
    bindRestInput(restInput, timerButton, exercise.id);

    mobileToggle.addEventListener("click", () => toggleMobileExercise(row, exercise.id));

    const isLibraryLinked = Boolean(exercise.libraryId && EXERCISE_BY_ID.has(exercise.libraryId));
    viewButton.classList.toggle("is-custom", !isLibraryLinked);
    viewButton.title = isLibraryLinked
      ? "Ver GIF e instrucciones"
      : "Ver información del ejercicio personalizado";
    viewButton.addEventListener("click", () => openExerciseDetail(exercise));

    timerButton.addEventListener("click", () => startTimer(exercise.id, timerButton));
    dragHandles.forEach(handle => setupDragHandle(handle, row, exercise.id));
    row.querySelector(".delete-button").addEventListener("click", () => deleteExercise(exercise.id));

    routineBody.appendChild(row);
  });
}

function getMobileExerciseName(value) {
  return String(value ?? "").trim() || "Ejercicio sin nombre";
}

function setMobileRowExpanded(row, expanded) {
  row.classList.toggle("is-mobile-expanded", expanded);
  const toggle = row.querySelector(".mobile-exercise-toggle");
  toggle?.setAttribute("aria-expanded", String(expanded));
}

function toggleMobileExercise(row, exerciseId) {
  const shouldExpand = !row.classList.contains("is-mobile-expanded");

  routineBody.querySelectorAll("tr[data-exercise-id].is-mobile-expanded").forEach(candidate => {
    if (candidate !== row) setMobileRowExpanded(candidate, false);
  });

  setMobileRowExpanded(row, shouldExpand);
  expandedExerciseByDay[activeDay] = shouldExpand ? exerciseId : null;
}

function bindInput(input, exerciseId, key) {
  input.addEventListener("input", event => {
    updateExercise(exerciseId, key, event.target.value);
  });
}

function bindRestInput(input, timerButton, exerciseId) {
  const commit = () => {
    const exercise = database.days[activeDay].find(item => item.id === exerciseId);
    if (!exercise) return;

    const seconds = sanitizeRestSeconds(input.value, getDefaultRestSeconds());
    input.value = seconds;
    exercise.restSeconds = seconds;
    timerButton.dataset.defaultSeconds = String(seconds);
    saveDatabase();

    if (!activeTimers.has(exerciseId)) {
      resetTimerButton(timerButton);
    }
  };

  input.addEventListener("change", commit);
  input.addEventListener("blur", commit);
}

/* REORDENAMIENTO */
function setupDragHandle(handle, row, exerciseId) {
  if (!handle) return;

  handle.addEventListener("pointerdown", event => {
    if (activeReorder) return;
    if (event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();

    if (handle.classList.contains("mobile-drag-handle")) {
      routineBody.querySelectorAll("tr[data-exercise-id].is-mobile-expanded").forEach(candidate => {
        setMobileRowExpanded(candidate, false);
      });
      expandedExerciseByDay[activeDay] = null;
    }

    beginPointerReorder(handle, row, exerciseId, event);
  });

  handle.addEventListener("keydown", event => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    moveExerciseByKeyboard(exerciseId, event.key === "ArrowUp" ? -1 : 1);
  });
}

function beginPointerReorder(handle, row, exerciseId, startEvent) {
  const rowRect = row.getBoundingClientRect();
  const placeholder = createDragPlaceholder(rowRect.height);
  const preview = createDragPreview(row, rowRect.width);
  const pointerId = startEvent.pointerId;

  routineBody.insertBefore(placeholder, row);
  row.classList.add("is-drag-source");
  handle.setAttribute("aria-grabbed", "true");
  document.body.classList.add("is-reordering");

  activeReorder = {
    handle,
    row,
    exerciseId,
    day: activeDay,
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
    movePlaceholderToPointer(event.clientX, event.clientY, placeholder, row);
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

function createDragPlaceholder(height) {
  const placeholder = document.createElement("tr");
  placeholder.className = "drag-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.style.setProperty("--drag-placeholder-height", `${Math.max(54, Math.round(height))}px`);

  const cell = document.createElement("td");
  cell.colSpan = 7;
  cell.className = "drag-placeholder-cell";

  const inner = document.createElement("div");
  inner.className = "drag-placeholder-inner";
  inner.textContent = "Suelta aquí";

  cell.appendChild(inner);
  placeholder.appendChild(cell);
  return placeholder;
}

function createDragPreview(row, rowWidth) {
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.style.width = `${Math.min(Math.max(rowWidth * 0.62, 240), 520)}px`;

  const icon = document.createElement("span");
  icon.className = "drag-preview-icon";
  icon.textContent = "☰";

  const label = document.createElement("strong");
  label.textContent = row.querySelector(".exercise-name")?.value?.trim() || "Ejercicio";

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

function movePlaceholderToPointer(clientX, clientY, placeholder, sourceRow) {
  const rows = [...routineBody.querySelectorAll("tr[data-exercise-id]")]
    .filter(candidate => candidate !== sourceRow);

  if (!rows.length) {
    routineBody.appendChild(placeholder);
    return;
  }

  // Primero intentamos usar el elemento que está exactamente bajo el dedo/cursor.
  const elementUnderPointer = document.elementFromPoint(clientX, clientY);
  const directTarget = elementUnderPointer?.closest?.("tr[data-exercise-id]");

  if (directTarget && directTarget !== sourceRow && routineBody.contains(directTarget)) {
    const rect = directTarget.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      routineBody.insertBefore(placeholder, directTarget);
    } else {
      routineBody.insertBefore(placeholder, directTarget.nextSibling);
    }
    return;
  }

  // Si el dedo está sobre el propio marcador o entre filas, usamos sus puntos medios.
  const insertBeforeRow = rows.find(candidate => {
    const rect = candidate.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2;
  });

  if (insertBeforeRow) {
    routineBody.insertBefore(placeholder, insertBeforeRow);
  } else {
    routineBody.appendChild(placeholder);
  }
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
    movePlaceholderToPointer(
      activeReorder.clientX,
      activeReorder.clientY,
      activeReorder.placeholder,
      activeReorder.row
    );
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

  drag.row.classList.remove("is-drag-source");
  drag.handle.removeAttribute("aria-grabbed");
  document.body.classList.remove("is-reordering");

  if (commitOrder) {
    routineBody.insertBefore(drag.row, drag.placeholder);
  } else {
    // Si el gesto se cancela, restauramos el orden que sigue en la base de datos.
    const originalOrder = database.days[drag.day].map(exercise => exercise.id);
    const currentRows = new Map(
      [...routineBody.querySelectorAll("tr[data-exercise-id]")].map(candidate => [candidate.dataset.exerciseId, candidate])
    );
    originalOrder.forEach(id => {
      const candidate = currentRows.get(id);
      if (candidate) routineBody.appendChild(candidate);
    });
  }

  drag.placeholder.remove();
  drag.preview.remove();
  activeReorder = null;

  if (commitOrder) persistCurrentDomOrder(drag.day);
}

function cancelActiveReorder() {
  if (activeReorder) finishPointerReorder(false);
}

function persistCurrentDomOrder(day = activeDay) {
  const ids = [...routineBody.querySelectorAll("tr[data-exercise-id]")].map(row => row.dataset.exerciseId);
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
    const row = routineBody.querySelector(`tr[data-exercise-id="${exerciseId}"]`);
    const preferredHandle = window.matchMedia("(max-width: 760px)").matches
      ? row?.querySelector(".mobile-drag-handle")
      : row?.querySelector(".desktop-drag-handle");
    preferredHandle?.focus();
  });
}

/* TEMPORIZADOR */
function startTimer(exerciseId, button) {
  if (activeTimers.has(exerciseId)) {
    clearTimer(exerciseId);
    resetTimerButton(button);
    return;
  }

  const exercise = database.days[activeDay].find(item => item.id === exerciseId);
  const duration = sanitizeRestSeconds(exercise?.restSeconds, getDefaultRestSeconds());
  let remaining = duration;
  button.dataset.defaultSeconds = String(duration);
  button.classList.add("is-running");
  button.classList.remove("is-done");
  button.textContent = formatTime(remaining);
  button.title = "Pulsa para cancelar el descanso";

  const intervalId = window.setInterval(() => {
    remaining -= 1;
    button.textContent = formatTime(remaining);

    if (remaining <= 0) {
      window.clearInterval(intervalId);
      activeTimers.delete(exerciseId);
      button.classList.remove("is-running");
      button.classList.add("is-done");
      button.textContent = "¡Listo!";
      button.title = "Pulsa para iniciar otro descanso";

      if ("vibrate" in navigator) {
        navigator.vibrate([180, 100, 180]);
      }

      window.setTimeout(() => {
        if (document.body.contains(button) && !activeTimers.has(exerciseId)) {
          resetTimerButton(button);
        }
      }, 2500);
    }
  }, 1000);

  activeTimers.set(exerciseId, intervalId);
}

function clearTimer(exerciseId) {
  const intervalId = activeTimers.get(exerciseId);
  if (intervalId) window.clearInterval(intervalId);
  activeTimers.delete(exerciseId);
}

function clearAllTimers() {
  for (const intervalId of activeTimers.values()) {
    window.clearInterval(intervalId);
  }
  activeTimers.clear();
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
