/*
  Biblioteca de ejercicios
  ------------------------
  1) Guarda cada GIF en /assets/exercises/
  2) Usa exactamente el nombre indicado en la propiedad `gif`.
  3) Puedes agregar, quitar o editar ejercicios en este archivo sin tocar app.js.

  IMPORTANTE: usa únicamente GIFs propios o que tengas permiso/licencia para publicar.
*/

window.EXERCISE_LIBRARY = [
  // PECHO
  {
    id: "bench-press",
    name: "Press banca con barra",
    category: "Pecho",
    gif: "assets/exercises/bench-press.gif",
    instructions: [
      "Retrae las escápulas y mantén los pies firmes en el suelo.",
      "Baja la barra de forma controlada hacia la zona media del pecho.",
      "Empuja sin despegar los hombros del banco y evita rebotar la barra."
    ]
  },
  {
    id: "incline-dumbbell-press",
    name: "Press inclinado con mancuernas",
    category: "Pecho",
    gif: "assets/exercises/incline-dumbbell-press.gif",
    instructions: [
      "Usa una inclinación moderada y mantén las escápulas estables.",
      "Baja las mancuernas con control hasta una posición cómoda.",
      "Empuja hacia arriba sin chocar las mancuernas."
    ]
  },
  {
    id: "cable-chest-fly",
    name: "Cable Chest Fly",
    category: "Pecho",
    gif: "assets/exercises/cable-chest-fly.gif",
    instructions: [
      "Mantén una ligera flexión de codos durante todo el recorrido.",
      "Junta las manos frente al pecho sin encoger los hombros.",
      "Regresa lentamente hasta sentir un estiramiento cómodo."
    ]
  },
  {
    id: "pec-deck",
    name: "Pec Deck / Contractor de pecho",
    category: "Pecho",
    gif: "assets/exercises/pec-deck.gif",
    instructions: [
      "Ajusta el asiento para que los brazos queden alineados con el pecho.",
      "Mantén el torso apoyado y junta los brazos de forma controlada.",
      "Evita adelantar los hombros al cerrar."
    ]
  },
  {
    id: "push-up",
    name: "Flexiones de pecho",
    category: "Pecho",
    gif: "assets/exercises/push-up.gif",
    instructions: [
      "Mantén cuerpo, cadera y cabeza alineados.",
      "Desciende con control hasta acercar el pecho al suelo.",
      "Empuja manteniendo el abdomen activo."
    ]
  },

  // ESPALDA
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    category: "Espalda",
    gif: "assets/exercises/lat-pulldown.gif",
    instructions: [
      "Mantén el pecho elevado y una ligera inclinación del torso.",
      "Lleva la barra hacia la parte alta del pecho dirigiendo los codos abajo.",
      "Controla el regreso sin soltar de golpe el peso."
    ]
  },
  {
    id: "seated-cable-row",
    name: "Remo sentado en cable",
    category: "Espalda",
    gif: "assets/exercises/seated-cable-row.gif",
    instructions: [
      "Mantén la espalda neutra y el pecho abierto.",
      "Tira del agarre hacia el abdomen llevando los codos atrás.",
      "Evita impulsarte con el torso."
    ]
  },
  {
    id: "chest-supported-row",
    name: "Remo con pecho apoyado",
    category: "Espalda",
    gif: "assets/exercises/chest-supported-row.gif",
    instructions: [
      "Mantén el pecho apoyado durante toda la serie.",
      "Lleva los codos atrás y junta suavemente las escápulas.",
      "Baja el peso de forma controlada."
    ]
  },
  {
    id: "one-arm-dumbbell-row",
    name: "Remo con mancuerna a una mano",
    category: "Espalda",
    gif: "assets/exercises/one-arm-dumbbell-row.gif",
    instructions: [
      "Mantén la columna estable y evita rotar el tronco.",
      "Lleva el codo hacia la cadera.",
      "Controla la extensión del brazo antes de repetir."
    ]
  },
  {
    id: "pull-up",
    name: "Dominadas",
    category: "Espalda",
    gif: "assets/exercises/pull-up.gif",
    instructions: [
      "Inicia desde una posición estable y activa las escápulas.",
      "Sube llevando el pecho hacia la barra.",
      "Desciende con control sin perder tensión."
    ]
  },
  {
    id: "straight-arm-pulldown",
    name: "Pullover en polea / Straight Arm Pulldown",
    category: "Espalda",
    gif: "assets/exercises/straight-arm-pulldown.gif",
    instructions: [
      "Mantén una ligera flexión de codos.",
      "Lleva la barra hacia los muslos usando los dorsales.",
      "Evita convertir el movimiento en un empuje de tríceps."
    ]
  },

  // HOMBROS
  {
    id: "overhead-press",
    name: "Press militar",
    category: "Hombros",
    gif: "assets/exercises/overhead-press.gif",
    instructions: [
      "Mantén abdomen y glúteos activos para estabilizar el torso.",
      "Empuja el peso sobre la cabeza sin arquear excesivamente la espalda.",
      "Desciende de forma controlada."
    ]
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Press de hombro con mancuernas",
    category: "Hombros",
    gif: "assets/exercises/dumbbell-shoulder-press.gif",
    instructions: [
      "Mantén el torso estable y las muñecas alineadas.",
      "Empuja las mancuernas arriba sin bloquear agresivamente los codos.",
      "Controla la bajada hasta una profundidad cómoda."
    ]
  },
  {
    id: "lateral-raise",
    name: "Elevaciones laterales",
    category: "Hombros",
    gif: "assets/exercises/lateral-raise.gif",
    instructions: [
      "Eleva los brazos hacia los lados con una ligera flexión de codos.",
      "Evita encoger los hombros o balancear el cuerpo.",
      "Usa un peso que permita controlar la bajada."
    ]
  },
  {
    id: "cable-lateral-raise",
    name: "Elevación lateral en cable",
    category: "Hombros",
    gif: "assets/exercises/cable-lateral-raise.gif",
    instructions: [
      "Mantén tensión continua desde el inicio del recorrido.",
      "Eleva el brazo lateralmente sin impulsar el torso.",
      "Regresa lentamente hasta la posición inicial."
    ]
  },
  {
    id: "reverse-pec-deck",
    name: "Reverse Pec Deck",
    category: "Hombros",
    gif: "assets/exercises/reverse-pec-deck.gif",
    instructions: [
      "Mantén el pecho apoyado y los hombros bajos.",
      "Abre los brazos controlando el movimiento con el deltoides posterior.",
      "Evita usar impulso."
    ]
  },
  {
    id: "face-pull",
    name: "Face Pull",
    category: "Hombros",
    gif: "assets/exercises/face-pull.gif",
    instructions: [
      "Lleva la cuerda hacia la cara con los codos altos.",
      "Separa las manos al final del recorrido.",
      "Mantén el cuello relajado y controla el regreso."
    ]
  },

  // BÍCEPS
  {
    id: "barbell-curl",
    name: "Curl con barra",
    category: "Bíceps",
    gif: "assets/exercises/barbell-curl.gif",
    instructions: [
      "Mantén los codos cerca del torso.",
      "Flexiona el codo sin balancear la espalda.",
      "Desciende lentamente hasta extender los brazos."
    ]
  },
  {
    id: "incline-dumbbell-curl",
    name: "Curl inclinado con mancuernas",
    category: "Bíceps",
    gif: "assets/exercises/incline-dumbbell-curl.gif",
    instructions: [
      "Mantén los hombros apoyados y los brazos ligeramente detrás del torso.",
      "Flexiona sin adelantar el codo.",
      "Controla especialmente la fase de bajada."
    ]
  },
  {
    id: "hammer-curl",
    name: "Curl martillo",
    category: "Bíceps",
    gif: "assets/exercises/hammer-curl.gif",
    instructions: [
      "Usa un agarre neutro con las palmas enfrentadas.",
      "Mantén los codos estables junto al cuerpo.",
      "Evita balancear las mancuernas."
    ]
  },
  {
    id: "cable-curl",
    name: "Curl de bíceps en polea",
    category: "Bíceps",
    gif: "assets/exercises/cable-curl.gif",
    instructions: [
      "Mantén tensión constante en el cable.",
      "Flexiona el codo sin mover los hombros hacia delante.",
      "Extiende de forma controlada al finalizar cada repetición."
    ]
  },

  // TRÍCEPS
  {
    id: "triceps-pushdown",
    name: "Triceps Pushdown",
    category: "Tríceps",
    gif: "assets/exercises/triceps-pushdown.gif",
    instructions: [
      "Mantén los codos pegados al torso.",
      "Extiende los brazos sin mover los hombros.",
      "Controla el regreso hasta aproximadamente 90° de flexión."
    ]
  },
  {
    id: "overhead-triceps-extension",
    name: "Extensión de tríceps sobre la cabeza",
    category: "Tríceps",
    gif: "assets/exercises/overhead-triceps-extension.gif",
    instructions: [
      "Mantén los codos orientados al frente y relativamente juntos.",
      "Flexiona el codo para llevar la carga detrás de la cabeza.",
      "Extiende sin arquear excesivamente la espalda."
    ]
  },
  {
    id: "close-grip-bench-press",
    name: "Press banca agarre cerrado",
    category: "Tríceps",
    gif: "assets/exercises/close-grip-bench-press.gif",
    instructions: [
      "Usa un agarre cómodo, algo más estrecho que el press convencional.",
      "Mantén los codos relativamente cerca del torso.",
      "Baja y empuja con control, manteniendo las escápulas estables."
    ]
  },

  // PIERNAS
  {
    id: "back-squat",
    name: "Sentadilla con barra",
    category: "Piernas",
    gif: "assets/exercises/back-squat.gif",
    instructions: [
      "Mantén el pie completo apoyado y el tronco firme.",
      "Desciende con las rodillas siguiendo la dirección de los pies.",
      "Sube empujando el suelo y manteniendo la columna estable."
    ]
  },
  {
    id: "leg-press",
    name: "Prensa de piernas",
    category: "Piernas",
    gif: "assets/exercises/leg-press.gif",
    instructions: [
      "Apoya completamente la espalda y la pelvis.",
      "Desciende hasta una profundidad que puedas controlar sin despegar la cadera.",
      "Empuja sin bloquear bruscamente las rodillas."
    ]
  },
  {
    id: "romanian-deadlift",
    name: "Peso muerto rumano",
    category: "Piernas",
    gif: "assets/exercises/romanian-deadlift.gif",
    instructions: [
      "Lleva la cadera hacia atrás con una ligera flexión de rodillas.",
      "Mantén la carga cerca de las piernas y la espalda neutra.",
      "Sube extendiendo la cadera, no tirando con la zona lumbar."
    ]
  },
  {
    id: "leg-extension",
    name: "Extensión de cuádriceps",
    category: "Piernas",
    gif: "assets/exercises/leg-extension.gif",
    instructions: [
      "Alinea la rodilla con el eje de giro de la máquina.",
      "Extiende las piernas de forma controlada.",
      "Evita golpear o soltar el peso al bajar."
    ]
  },
  {
    id: "seated-leg-curl",
    name: "Curl femoral sentado",
    category: "Piernas",
    gif: "assets/exercises/seated-leg-curl.gif",
    instructions: [
      "Ajusta la máquina para que la rodilla coincida con el eje de giro.",
      "Flexiona las rodillas manteniendo la cadera estable.",
      "Regresa lentamente sin dejar caer el peso."
    ]
  },
  {
    id: "lying-leg-curl",
    name: "Curl femoral acostado",
    category: "Piernas",
    gif: "assets/exercises/lying-leg-curl.gif",
    instructions: [
      "Mantén la pelvis estable sobre el banco.",
      "Flexiona las rodillas sin arquear la zona lumbar.",
      "Controla completamente la bajada."
    ]
  },
  {
    id: "bulgarian-split-squat",
    name: "Sentadilla búlgara",
    category: "Piernas",
    gif: "assets/exercises/bulgarian-split-squat.gif",
    instructions: [
      "Coloca el pie delantero a una distancia que te permita estabilidad.",
      "Desciende de manera vertical y controlada.",
      "Impulsa principalmente con la pierna delantera."
    ]
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    category: "Piernas",
    gif: "assets/exercises/hip-thrust.gif",
    instructions: [
      "Apoya la parte alta de la espalda sobre el banco.",
      "Eleva la cadera contrayendo glúteos sin hiperextender la espalda.",
      "Haz una breve pausa arriba y baja con control."
    ]
  },
  {
    id: "standing-calf-raise",
    name: "Elevación de pantorrillas de pie",
    category: "Piernas",
    gif: "assets/exercises/standing-calf-raise.gif",
    instructions: [
      "Desciende el talón de forma controlada para lograr un buen estiramiento.",
      "Eleva el talón empujando sobre la parte anterior del pie.",
      "Evita rebotar entre repeticiones."
    ]
  },

  // CORE
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    category: "Core",
    gif: "assets/exercises/cable-crunch.gif",
    instructions: [
      "Mantén la cadera relativamente estable.",
      "Flexiona el tronco acercando costillas y pelvis.",
      "No tires del cable solamente con los brazos."
    ]
  },
  {
    id: "plank",
    name: "Plancha",
    category: "Core",
    gif: "assets/exercises/plank.gif",
    instructions: [
      "Mantén cabeza, tronco y cadera alineados.",
      "Contrae abdomen y glúteos durante toda la serie.",
      "Evita hundir o elevar excesivamente la cadera."
    ]
  },
  {
    id: "hanging-leg-raise",
    name: "Elevación de piernas colgado",
    category: "Core",
    gif: "assets/exercises/hanging-leg-raise.gif",
    instructions: [
      "Evita balancear el cuerpo antes de iniciar la repetición.",
      "Eleva las piernas usando el abdomen y controlando la pelvis.",
      "Desciende lentamente."
    ]
  }
];
