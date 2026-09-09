/*
  Biblioteca de elongación
  ------------------------
  Guarda los GIFs en /assets/stretch/ usando exactamente la ruta indicada en `gif`.
  `group` es el nombre visible y `groupKey` es la clave estable utilizada por la app.
  `defaultTime` corresponde al tiempo sugerido en segundos.
*/

window.STRETCH_LIBRARY = [
  {
    id: "doorway-chest-stretch",
    name: "Elongación de pecho en marco de puerta",
    group: "Pecho",
    groupKey: "pecho",
    defaultTime: 30,
    gif: "assets/stretch/doorway-chest-stretch.gif",
    instructions: [
      "Apoya el antebrazo en un marco de puerta con el hombro relajado.",
      "Gira suavemente el torso hasta sentir tensión cómoda en el pecho.",
      "No rebotes y evita dolor punzante en el hombro."
    ]
  },
  {
    id: "floor-chest-stretch",
    name: "Elongación de pecho en suelo",
    group: "Pecho",
    groupKey: "pecho",
    defaultTime: 30,
    gif: "assets/stretch/floor-chest-stretch.gif",
    instructions: [
      "Extiende un brazo lateralmente y rota el cuerpo en sentido contrario.",
      "Mantén el hombro en una posición cómoda.",
      "Respira lentamente y repite en ambos lados."
    ]
  },
  {
    id: "lat-prayer-stretch",
    name: "Elongación de dorsales tipo oración",
    group: "Espalda",
    groupKey: "espalda",
    defaultTime: 30,
    gif: "assets/stretch/lat-prayer-stretch.gif",
    instructions: [
      "Apoya las manos al frente y lleva la cadera hacia atrás.",
      "Mantén el abdomen suave y el cuello relajado.",
      "Busca tensión en dorsales sin forzar los hombros."
    ]
  },
  {
    id: "child-pose-lat-stretch",
    name: "Postura del niño con alcance lateral",
    group: "Espalda",
    groupKey: "espalda",
    defaultTime: 30,
    gif: "assets/stretch/child-pose-lat-stretch.gif",
    instructions: [
      "Desde la postura del niño, camina las manos hacia un lado.",
      "Mantén la cadera hacia atrás y respira de forma tranquila.",
      "Cambia de lado después del tiempo indicado."
    ]
  },
  {
    id: "cross-body-shoulder-stretch",
    name: "Elongación de hombro cruzado",
    group: "Hombros",
    groupKey: "hombros",
    defaultTime: 25,
    gif: "assets/stretch/cross-body-shoulder-stretch.gif",
    instructions: [
      "Lleva un brazo por delante del pecho.",
      "Ayuda suavemente con el brazo contrario sin elevar el hombro.",
      "Mantén una tensión cómoda y cambia de lado."
    ]
  },
  {
    id: "overhead-triceps-stretch",
    name: "Elongación de tríceps sobre la cabeza",
    group: "Tríceps",
    groupKey: "triceps",
    defaultTime: 25,
    gif: "assets/stretch/overhead-triceps-stretch.gif",
    instructions: [
      "Flexiona un codo llevando la mano hacia la espalda.",
      "Con la otra mano aplica una presión leve sobre el codo.",
      "Mantén las costillas controladas y cambia de lado."
    ]
  },
  {
    id: "biceps-wall-stretch",
    name: "Elongación de bíceps en pared",
    group: "Bíceps",
    groupKey: "biceps",
    defaultTime: 25,
    gif: "assets/stretch/biceps-wall-stretch.gif",
    instructions: [
      "Apoya la palma o el brazo en la pared con el codo extendido.",
      "Gira lentamente el torso en sentido contrario.",
      "Reduce el rango si sientes molestia en el hombro."
    ]
  },
  {
    id: "standing-quad-stretch",
    name: "Elongación de cuádriceps de pie",
    group: "Cuádriceps",
    groupKey: "cuadriceps",
    defaultTime: 30,
    gif: "assets/stretch/standing-quad-stretch.gif",
    instructions: [
      "Lleva el talón hacia el glúteo sujetando el pie o tobillo.",
      "Mantén las rodillas cercanas y la pelvis estable.",
      "Evita arquear la espalda para aumentar artificialmente el rango."
    ]
  },
  {
    id: "hamstring-stretch",
    name: "Elongación de isquiotibiales",
    group: "Isquiotibiales",
    groupKey: "isquiotibiales",
    defaultTime: 30,
    gif: "assets/stretch/hamstring-stretch.gif",
    instructions: [
      "Extiende una pierna y lleva la cadera hacia atrás manteniendo la espalda neutra.",
      "Inclínate desde la cadera hasta sentir tensión detrás del muslo.",
      "No necesitas alcanzar el pie para que sea efectivo."
    ]
  },
  {
    id: "figure-four-glute-stretch",
    name: "Elongación de glúteos en figura 4",
    group: "Glúteos",
    groupKey: "gluteos",
    defaultTime: 30,
    gif: "assets/stretch/figure-four-glute-stretch.gif",
    instructions: [
      "Cruza un tobillo sobre la pierna contraria formando una figura 4.",
      "Acerca suavemente las piernas o inclina el torso según la variante.",
      "Mantén la pelvis estable y cambia de lado."
    ]
  },
  {
    id: "kneeling-hip-flexor-stretch",
    name: "Elongación de flexores de cadera",
    group: "Flexores de cadera",
    groupKey: "flexores-cadera",
    defaultTime: 30,
    gif: "assets/stretch/kneeling-hip-flexor-stretch.gif",
    instructions: [
      "Adopta una posición de media rodilla.",
      "Lleva suavemente la pelvis hacia delante manteniendo glúteo y abdomen activos.",
      "Evita compensar arqueando la zona lumbar."
    ]
  },
  {
    id: "wall-calf-stretch",
    name: "Elongación de pantorrilla en pared",
    group: "Pantorrillas",
    groupKey: "pantorrillas",
    defaultTime: 30,
    gif: "assets/stretch/wall-calf-stretch.gif",
    instructions: [
      "Mantén el talón de la pierna posterior apoyado en el suelo.",
      "Inclina el cuerpo hacia la pared sin que el pie trasero gire.",
      "Mantén la rodilla extendida para enfatizar gastrocnemio."
    ]
  }
];
