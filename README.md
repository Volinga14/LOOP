# LOOP MVP

https://volinga14.github.io/LOOP/

LOOP es un prototipo de microaprendizaje en formato de vídeos cortos. Esta versión se centra en la visualización y toma como referencia la experiencia de YouTube Shorts: vídeo a pantalla completa, navegación vertical, acciones flotantes y contenido educativo integrado sobre el propio vídeo.

## Estado actual

- Aplicación estática sin dependencias de build.
- Pantalla de entrada simple con propuesta de valor y preview tipo Shorts.
- Feed fullscreen con reproductor YouTube controlado mediante YouTube IFrame API.
- Navegación vertical mediante swipe, rueda de ratón y teclado.
- El vídeo ya no cambia por toque accidental sobre la pantalla.
- Controles flotantes sobre el vídeo: Más, Menos, Comentario, Play/Pausa, Sonido/Mute, Ocultar texto e Info.
- Botón Trash retirado temporalmente.
- Texto del vídeo compacto, con opción para ocultarlo y recuperarlo.
- Barra inferior de categorías con scroll horizontal.
- Info educativa embebida en una sheet inferior: motivo de recomendación, calidad, utilidad y duración.
- Feedback local guardado en `localStorage`.
- Dataset seed en `src/data.js` con campos compatibles con la base antigua: `video_id`, `title`, `url`, `views`, `duration`, `publishedAt`, `channel`.

## Cómo probar

Abrir `index.html` directamente o entrar en GitHub Pages:

https://volinga14.github.io/LOOP/

## Próximos pasos

1. Sustituir el dataset seed por las bases reales antiguas.
2. Añadir backend/API para guardar feedback real.
3. Implementar scoring educativo y filtrado automático.
4. Añadir historial y guardados.
5. Convertirlo en PWA instalable.
