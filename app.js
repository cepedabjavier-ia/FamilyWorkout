const STORAGE_KEY = "gymRoutineDb_v1";
const CURRENT_DB_VERSION = 2;

const EXERCISE_LIBRARY = Array.isArray(window.EXERCISE_LIBRARY) ? window.EXERCISE_LIBRARY : [];
const EXERCISE_BY_ID = new Map(EXERCISE_LIBRARY.map(exercise => [exercise.id, exercise]));

const DEFAULT_DATA = {
  version: CURRENT_DB_VERSION,
  updatedAt: null,
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
  return {
    version: CURRENT_DB_VERSION,
    updatedAt: data.updatedAt ?? null,
    days: {
      jueves: data.days.jueves.map(normalizeExercise),
      viernes: data.days.viernes.map(normalizeExercise),
      sabado: data.days.sabado.map(normalizeExercise)
    }
  };
}

function normalizeExercise(exercise) {
  return {
    id: typeof exercise?.id === "string" && exercise.id ? exercise.id : generateId(),
    libraryId: typeof exercise?.libraryId === "string" && exercise.libraryId ? exercise.libraryId : null,
    name: exercise?.name ?? "",
    sets: exercise?.sets ?? "",
    reps: exercise?.reps ?? "",
    weight: exercise?.weight ?? ""
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

function createExerciseFromLibrary(libraryExercise) {
  return {
    id: generateId(),
    libraryId: libraryExercise.id,
    name: libraryExercise.name,
    sets: "",
    reps: "",
    weight: ""
  };
}

function createCustomExercise() {
  return {
    id: generateId(),
    libraryId: null,
    name: "",
    sets: "",
    reps: "",
    weight: ""
  };
}

function addLibraryExercise(libraryId) {
  const libraryExercise = EXERCISE_BY_ID.get(libraryId);
  if (!libraryExercise) return;

  database.days[activeDay].push(createExerciseFromLibrary(libraryExercise));
  saveDatabase();
  renderActiveDay();
  closeModal("exercisePickerModal");
}

function addCustomExercise() {
  database.days[activeDay].push(createCustomExercise());
  saveDatabase();
  renderActiveDay();
  closeModal("exercisePickerModal");

  requestAnimationFrame(() => {
    routineBody.querySelector("tr:last-child .exercise-name")?.focus();
  });
}

function deleteExercise(exerciseId) {
  clearTimer(exerciseId);
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
  routineBody.innerHTML = "";
  activeDayTitle.textContent = DAY_LABELS[activeDay];

  const exercises = database.days[activeDay];
  exerciseCount.textContent = `${exercises.length} ${exercises.length === 1 ? "ejercicio configurado" : "ejercicios configurados"}`;
  emptyState.classList.toggle("is-visible", exercises.length === 0);

  exercises.forEach(exercise => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.exerciseId = exercise.id;

    const nameInput = row.querySelector(".exercise-name");
    const setsInput = row.querySelector(".exercise-sets");
    const repsInput = row.querySelector(".exercise-reps");
    const weightInput = row.querySelector(".exercise-weight");
    const timerButton = row.querySelector(".timer-button");
    const viewButton = row.querySelector(".view-button");

    nameInput.value = exercise.name ?? "";
    setsInput.value = exercise.sets ?? "";
    repsInput.value = exercise.reps ?? "";
    weightInput.value = exercise.weight ?? "";

    bindInput(nameInput, exercise.id, "name");
    bindInput(setsInput, exercise.id, "sets");
    bindInput(repsInput, exercise.id, "reps");
    bindInput(weightInput, exercise.id, "weight");

    const isLibraryLinked = Boolean(exercise.libraryId && EXERCISE_BY_ID.has(exercise.libraryId));
    viewButton.classList.toggle("is-custom", !isLibraryLinked);
    viewButton.title = isLibraryLinked
      ? "Ver GIF e instrucciones"
      : "Ver información del ejercicio personalizado";
    viewButton.addEventListener("click", () => openExerciseDetail(exercise));

    timerButton.addEventListener("click", () => startTimer(exercise.id, timerButton));
    row.querySelector(".delete-button").addEventListener("click", () => deleteExercise(exercise.id));

    routineBody.appendChild(row);
  });
}

function bindInput(input, exerciseId, key) {
  input.addEventListener("input", event => {
    updateExercise(exerciseId, key, event.target.value);
  });
}

/* TEMPORIZADOR */
function startTimer(exerciseId, button) {
  if (activeTimers.has(exerciseId)) {
    clearTimer(exerciseId);
    resetTimerButton(button);
    return;
  }

  let remaining = 90;
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
  button.classList.remove("is-running", "is-done");
  button.textContent = "90 s";
  button.title = "Iniciar descanso de 90 segundos";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/* PESTAÑAS */
function switchDay(day) {
  if (!DAY_LABELS[day]) return;

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
