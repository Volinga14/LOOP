# LOOP MVP

LOOP es un prototipo de microaprendizaje en formato de vídeos cortos. Esta primera versión se centra en la visualización: pantalla de entrada, selección de tema y feed vertical tipo reels con datos de prueba basados en el esquema de las bases antiguas.

## Estado actual

- Aplicación estática sin dependencias.
- Pantalla de entrada con propuesta de valor y selección de temas.
- Visualizador vertical de vídeos con metadatos educativos.
- Feedback local: Más, Menos, Trash y Comentario.
- Dataset seed en `src/data.js` con campos compatibles con la base anterior: `title`, `url`, `video_id`, `duration`, `channel`, `publishedAt`, `views`.

## Cómo probar

Abrir `index.html` en el navegador o publicar el repositorio con GitHub Pages desde la rama `main`.

## Próximos pasos

1. Conectar la base de datos real.
2. Sustituir el dataset seed por vídeos validados automáticamente.
3. Añadir algoritmo de filtrado y scoring real.
4. Guardar feedback en backend.
5. Convertirlo en PWA instalable.
