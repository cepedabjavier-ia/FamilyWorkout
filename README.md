# Mi Rutina de Gimnasio

Aplicación web estática para gestionar rutinas de entrenamiento de **Jueves, Viernes y Sábado**.

## Características

- Tres pestañas independientes: Jueves, Viernes y Sábado.
- Columnas: Ver, Nombre, Series, Repeticiones, Peso y Descanso.
- Botón **Ver** preparado para funciones futuras.
- Temporizador individual de descanso de 90 segundos por ejercicio.
- Guardado automático en `localStorage` del navegador.
- Exportación de la configuración a un archivo `.json`.
- Importación de una configuración previamente exportada.
- Diseño responsive para computador y teléfono.
- No requiere backend ni base de datos externa.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube `index.html`, `styles.css` y `app.js` a la raíz del repositorio.
3. En GitHub entra a **Settings > Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`.
6. Guarda los cambios.

GitHub publicará una URL para acceder a la aplicación.

## Persistencia de datos

Los ejercicios se guardan solamente en el navegador/dispositivo actual mediante `localStorage`.

Para mover la rutina a otro dispositivo:

1. Abre **Configuración**.
2. Pulsa **Exportar configuración**.
3. Copia el archivo JSON al nuevo dispositivo.
4. En el nuevo dispositivo abre la página.
5. Ve a **Configuración > Importar configuración** y selecciona el archivo.

## Estructura del archivo exportado

```json
{
  "version": 1,
  "updatedAt": "...",
  "days": {
    "jueves": [],
    "viernes": [],
    "sabado": []
  }
}
```
