# Mi Rutina de Gimnasio — GitHub Pages

Aplicación web estática para organizar una rutina de gimnasio de **Jueves, Viernes y Sábado**.

No requiere servidor, Node.js ni base de datos externa. Los datos del usuario se guardan en `localStorage` y pueden exportarse/importarse mediante JSON.

## Funciones

- Pestañas independientes para Jueves, Viernes y Sábado.
- Columnas: Ver, Nombre, Series, Repeticiones, Peso y Descanso.
- Temporizador de descanso de 90 segundos por ejercicio.
- Biblioteca de ejercicios con buscador y filtros por grupo muscular.
- Posibilidad de crear ejercicios personalizados.
- Botón **Ver** con popup de GIF + instrucciones breves.
- Detección automática de GIF faltante y visualización de la ruta esperada.
- Exportación e importación de la rutina mediante JSON.
- Compatibilidad con configuraciones antiguas de la versión inicial.
- Diseño responsive para teléfono, tablet y computador.

## Estructura

```text
gym-routine-github/
├── index.html
├── styles.css
├── exercise-library.js
├── app.js
├── README.md
└── assets/
    └── exercises/
        ├── README.md
        ├── bench-press.gif
        ├── cable-chest-fly.gif
        └── ...
```

## Cómo cargar los GIFs

Los nombres y rutas están definidos en `exercise-library.js`.

Por ejemplo:

```javascript
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
}
```

Para ese ejercicio debes subir el archivo:

```text
assets/exercises/cable-chest-fly.gif
```

Si todavía no existe, el botón **Ver** mostrará un aviso con la ruta exacta que falta. La aplicación no se rompe.

> Usa únicamente GIFs propios o archivos que tengas permiso/licencia para publicar.

## Cómo agregar un nuevo ejercicio a la biblioteca

1. Copia uno de los objetos existentes en `exercise-library.js`.
2. Cambia `id`, `name`, `category`, `gif` e `instructions`.
3. Guarda el GIF con el mismo nombre indicado en `gif`.
4. Sube ambos cambios a GitHub.

El ejercicio aparecerá automáticamente en el selector.

## Datos y copias de seguridad

La rutina se guarda en el navegador mediante:

```text
localStorage
```

Los ejercicios de la rutina guardan un `libraryId`, pero **no duplican el GIF ni las instrucciones**. Esto mantiene pequeño el archivo JSON.

Desde **Configuración** puedes:

- Exportar la rutina a JSON.
- Importar una copia JSON en otro dispositivo.
- Borrar todos los datos locales.

Las configuraciones creadas con la primera versión de la aplicación se importan como ejercicios personalizados para no perder información.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube todo el contenido de esta carpeta a la raíz del repositorio.
3. En GitHub abre **Settings → Pages**.
4. Selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`.
6. Guarda los cambios.

GitHub entregará una URL pública para la aplicación.

## Descanso configurable y reordenamiento

- El descanso predeterminado es 90 segundos y puede cambiarse desde Configuración. Este valor se aplica a ejercicios nuevos.
- Cada ejercicio guarda su propio `restSeconds`, editable directamente en la columna Descanso.
- Los ejercicios pueden reordenarse arrastrando el botón ☰ tanto con mouse como con pantalla táctil. Con teclado, enfoca el botón ☰ y usa Flecha Arriba/Flecha Abajo.
- El orden de los ejercicios y todos los valores de descanso se almacenan en `localStorage` y se incluyen en el JSON exportado.
