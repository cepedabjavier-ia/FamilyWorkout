/*
  Biblioteca de calentamientos
  ---------------------------
  Guarda los GIFs en /assets/warmup/ usando exactamente la ruta indicada en `gif`.
  `region` puede ser "upper" (Tren Superior) o "lower" (Tren Inferior).
  `doseType` puede ser "reps" o "time". `defaultDose` es el valor sugerido.
*/

window.WARMUP_LIBRARY = [
  {
    id: "arm-circles",
    name: "Círculos de brazos",
    region: "upper",
    doseType: "time",
    defaultDose: 30,
    gif: "assets/warmup/arm-circles.gif",
    instructions: [
      "Mantén el torso erguido y los hombros relajados.",
      "Realiza círculos progresivamente más amplios hacia delante y hacia atrás.",
      "Usa un ritmo suave: el objetivo es aumentar movilidad y temperatura, no fatigarte."
    ]
  },
  {
    id: "band-pull-apart",
    name: "Band Pull-Apart",
    region: "upper",
    doseType: "reps",
    defaultDose: 15,
    gif: "assets/warmup/band-pull-apart.gif",
    instructions: [
      "Sujeta la banda a la altura del pecho con los brazos extendidos.",
      "Separa las manos llevando las escápulas suavemente hacia atrás.",
      "Regresa con control sin elevar los hombros."
    ]
  },
  {
    id: "scapular-push-up",
    name: "Flexiones escapulares",
    region: "upper",
    doseType: "reps",
    defaultDose: 12,
    gif: "assets/warmup/scapular-push-up.gif",
    instructions: [
      "Mantén los codos extendidos y el cuerpo alineado.",
      "Deja que el pecho descienda ligeramente juntando las escápulas.",
      "Empuja el suelo separando las escápulas sin flexionar los codos."
    ]
  },
  {
    id: "wall-slides",
    name: "Wall Slides",
    region: "upper",
    doseType: "reps",
    defaultDose: 10,
    gif: "assets/warmup/wall-slides.gif",
    instructions: [
      "Apoya espalda y antebrazos contra la pared dentro de un rango cómodo.",
      "Desliza los brazos hacia arriba sin arquear excesivamente la zona lumbar.",
      "Mantén el movimiento lento y controlado."
    ]
  },
  {
    id: "thoracic-rotation",
    name: "Rotación torácica",
    region: "upper",
    doseType: "reps",
    defaultDose: 8,
    gif: "assets/warmup/thoracic-rotation.gif",
    instructions: [
      "Mantén la pelvis estable mientras rotas la zona torácica.",
      "Sigue la mano con la mirada sin forzar el cuello.",
      "Realiza las repeticiones en ambos lados."
    ]
  },
  {
    id: "light-cable-row",
    name: "Remo liviano de activación",
    region: "upper",
    doseType: "reps",
    defaultDose: 15,
    gif: "assets/warmup/light-cable-row.gif",
    instructions: [
      "Utiliza una carga muy ligera.",
      "Concéntrate en llevar los codos atrás y activar la espalda.",
      "Evita acercarte al fallo; debe sentirse como preparación."
    ]
  },
  {
    id: "bodyweight-squat",
    name: "Sentadilla con peso corporal",
    region: "lower",
    doseType: "reps",
    defaultDose: 15,
    gif: "assets/warmup/bodyweight-squat.gif",
    instructions: [
      "Mantén los pies firmes y las rodillas siguiendo la dirección de los dedos.",
      "Desciende hasta una profundidad cómoda manteniendo el torso estable.",
      "Usa un ritmo fluido y sin fatiga excesiva."
    ]
  },
  {
    id: "leg-swing-front-back",
    name: "Balanceo de pierna adelante y atrás",
    region: "lower",
    doseType: "reps",
    defaultDose: 12,
    gif: "assets/warmup/leg-swing-front-back.gif",
    instructions: [
      "Apóyate si es necesario para mantener el equilibrio.",
      "Balancea la pierna desde la cadera sin arquear la espalda.",
      "Aumenta gradualmente el rango y repite en ambos lados."
    ]
  },
  {
    id: "leg-swing-lateral",
    name: "Balanceo lateral de pierna",
    region: "lower",
    doseType: "reps",
    defaultDose: 12,
    gif: "assets/warmup/leg-swing-lateral.gif",
    instructions: [
      "Mantén el tronco relativamente estable.",
      "Mueve la pierna de lado a lado desde la cadera.",
      "No busques amplitud máxima de inmediato; progresa gradualmente."
    ]
  },
  {
    id: "glute-bridge-warmup",
    name: "Puente de glúteos",
    region: "lower",
    doseType: "reps",
    defaultDose: 15,
    gif: "assets/warmup/glute-bridge-warmup.gif",
    instructions: [
      "Apoya completamente los pies y mantén las costillas controladas.",
      "Eleva la cadera contrayendo los glúteos.",
      "Evita hiperextender la espalda al finalizar."
    ]
  },
  {
    id: "walking-lunge-warmup",
    name: "Zancadas caminando",
    region: "lower",
    doseType: "reps",
    defaultDose: 10,
    gif: "assets/warmup/walking-lunge-warmup.gif",
    instructions: [
      "Da pasos controlados manteniendo equilibrio y postura.",
      "Desciende dentro de un rango cómodo y empuja con el pie delantero.",
      "Cuenta las repeticiones por pierna o alternadas según tu preferencia."
    ]
  },
  {
    id: "ankle-rocks",
    name: "Movilidad de tobillo",
    region: "lower",
    doseType: "reps",
    defaultDose: 12,
    gif: "assets/warmup/ankle-rocks.gif",
    instructions: [
      "Mantén el talón apoyado mientras llevas la rodilla hacia delante.",
      "La rodilla debe seguir una trayectoria cómoda sobre el pie.",
      "Haz el movimiento lentamente en ambos lados."
    ]
  }
];
