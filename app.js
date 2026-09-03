const STORAGE_KEY = "gymRoutineDb_v1";

const DEFAULT_DATA = {
  version: 1,
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
const activeTimers = new Map();

const routineBody = document.getElementById("routineBody");
const emptyState = document.getElementById("emptyState");
const exerciseCount = document.getElementById("exerciseCount");
const activeDayTitle = document.getElementById("activeDayTitle");
const rowTemplate = document.getElementById("exerciseRowTemplate");
const settingsModal = document.getElementById("settingsModal");
const settingsMessage = document.getElementById("settingsMessage");
const importInput = document.getElementById("importInput");

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultData();

    const parsed = JSON.parse(raw);
    if (!isValidDatabase(parsed)) return cloneDefaultData();

    return parsed;
  } catch (error) {
    console.warn("No fue posible leer la base de datos local.", error);
    return cloneDefaultData();
  }
}

function saveDatabase() {
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

function createExercise() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: "",
    sets: "",
    reps: "",
    weight: ""
  };
}

function addExercise() {
  database.days[activeDay].push(createExercise());
  saveDatabase();
  renderActiveDay();

  requestAnimationFrame(() => {
    const lastNameInput = routineBody.querySelector("tr:last-child .exercise-name");
    lastNameInput?.focus();
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

    nameInput.value = exercise.name ?? "";
    setsInput.value = exercise.sets ?? "";
    repsInput.value = exercise.reps ?? "";
    weightInput.value = exercise.weight ?? "";

    bindInput(nameInput, exercise.id, "name");
    bindInput(setsInput, exercise.id, "sets");
    bindInput(repsInput, exercise.id, "reps");
    bindInput(weightInput, exercise.id, "weight");

    row.querySelector(".view-button").addEventListener("click", () => {
      // Reservado para una futura vista de ejercicio: imagen, video, técnica, etc.
    });

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
  for (const [exerciseId, intervalId] of activeTimers.entries()) {
    window.clearInterval(intervalId);
    activeTimers.delete(exerciseId);
  }
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

function switchDay(day) {
  if (!DAY_LABELS[day]) return;

  clearAllTimers();
  activeDay = day;

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("is-active", tab.dataset.day === day);
  });

  renderActiveDay();
}

function openSettings() {
  settingsMessage.textContent = "";
  settingsModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSettings() {
  settingsModal.hidden = true;
  document.body.style.overflow = "";
}

function exportDatabase() {
  const exportPayload = {
    ...database,
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
    database = {
      version: parsed.version ?? 1,
      updatedAt: new Date().toISOString(),
      days: {
        jueves: parsed.days.jueves,
        viernes: parsed.days.viernes,
        sabado: parsed.days.sabado
      }
    };

    saveDatabase();
    renderActiveDay();
    settingsMessage.textContent = "Configuración importada correctamente.";
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

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => switchDay(tab.dataset.day));
});

document.getElementById("addExerciseBtn").addEventListener("click", addExercise);
document.getElementById("emptyAddBtn").addEventListener("click", addExercise);
document.getElementById("settingsBtn").addEventListener("click", openSettings);
document.getElementById("exportBtn").addEventListener("click", exportDatabase);
document.getElementById("resetBtn").addEventListener("click", resetDatabase);

importInput.addEventListener("change", event => importDatabase(event.target.files?.[0]));

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", closeSettings);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !settingsModal.hidden) {
    closeSettings();
  }
});

renderActiveDay();
