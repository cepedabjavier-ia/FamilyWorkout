# Mi Rutina — GitHub Pages (v7.0)

Aplicación web estática para administrar rutina de gimnasio, calentamientos y elongación/movilidad. No requiere backend: los datos se guardan en `localStorage` y pueden exportarse/importarse como JSON.

## Navegación principal

- **Mi Rutina**: Jueves, Viernes, Sábado y Personalizado.
- **Calentamiento**: acordeones de Tren Superior y Tren Inferior.
- **Elongación**: secciones dinámicas. Incluye grupos musculares predeterminados y permite crear categorías personalizadas ilimitadas.

## Bibliotecas y assets

- Rutina: `exercise-library.js` → `assets/exercises/`
- Calentamiento: `warmup-library.js` → `assets/warmup/`
- Elongación: `stretch-library.js` → `assets/stretch/`

Los movimientos que pertenecen a una biblioteca conservan su GIF e instrucciones mediante `libraryId`. Los movimientos personalizados se almacenan íntegramente en el JSON y no necesitan un archivo GIF.

## Calentamiento

Cada ejercicio de `warmup-library.js` define `id`, `name`, `region`, `doseType`, `defaultDose`, `gif` e `instructions`. La interfaz muestra nombre, repeticiones/tiempo y botón **Ver**. Los calentamientos ya utilizados se marcan en verde suave dentro del selector.

## Elongación y movilidad

### Secciones predeterminadas

Los grupos presentes en `stretch-library.js` generan secciones protegidas, por ejemplo Pecho, Espalda, Hombros o Cuádriceps. Estas secciones no se pueden borrar accidentalmente.

### Secciones personalizadas

El botón **+ Nueva sección** permite crear tantas secciones como se necesiten, por ejemplo:

- Movilidad de cadera
- Movilidad de hombro
- Movilidad general
- Pre-sentadilla
- Recuperación

Las secciones personalizadas muestran **Eliminar sección**. Al eliminar una sección que contiene movimientos, la aplicación pide confirmación e informa que también se eliminará su contenido.

Dentro de una sección personalizada, **+ Añadir movimiento** muestra toda la biblioteca de `stretch-library.js`, sin restringir por grupo muscular. Los elementos de biblioteca ya utilizados en cualquier sección aparecen marcados en verde suave.

### Movimiento personalizado

Desde el selector de Elongación puede elegirse **+ Movimiento personalizado**. Se configura:

- Nombre
- Medida: Tiempo o Repeticiones
- Cantidad

Un movimiento personalizado no tiene `libraryId`, por lo que el botón **Ver** informa que no existe GIF asociado. Su nombre y dosis sí se guardan en `localStorage` y en las exportaciones JSON.

## Base de datos v7

Elongación cambia de un objeto fijo por grupos a un arreglo ordenado de secciones:

```json
{
  "version": 7,
  "days": {
    "jueves": [],
    "viernes": [],
    "sabado": [],
    "personalizado": []
  },
  "warmups": {
    "upper": [],
    "lower": []
  },
  "stretchSections": [
    {
      "id": "pecho",
      "name": "Pecho",
      "builtIn": true,
      "libraryGroupKey": "pecho",
      "items": []
    },
    {
      "id": "...",
      "name": "Movilidad de cadera",
      "builtIn": false,
      "libraryGroupKey": null,
      "items": [
        {
          "id": "...",
          "libraryId": null,
          "name": "Hip CARs",
          "doseType": "reps",
          "dose": 5
        }
      ]
    }
  ]
}
```

## Migración desde v6

Los archivos v6 que utilizan:

```json
"stretches": {
  "pecho": [],
  "espalda": []
}
```

se convierten automáticamente a `stretchSections` al cargar o importar. Las elongaciones existentes mantienen nombre, `libraryId` y tiempo configurado.

Las secciones predeterminadas se reconstruyen desde la biblioteca actual. Si en una configuración futura existe una sección predeterminada antigua que ya no está en `stretch-library.js`, la aplicación la conserva como sección personalizada para evitar pérdida de datos.

## Actualización

Reemplaza juntos:

- `index.html`
- `styles.css`
- `app.js`
- `exercise-library.js`
- `warmup-library.js`
- `stretch-library.js`

Conserva tus GIF dentro de `assets/exercises/`, `assets/warmup/` y `assets/stretch/`.

Los recursos usan `?v=7.0.0` para evitar que GitHub Pages mezcle archivos de versiones anteriores desde caché.
