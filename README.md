# LOOP MVP

https://volinga14.github.io/LOOP/

LOOP es un prototipo de microaprendizaje en formato de vídeos cortos. Esta versión se centra en la visualización y toma como referencia la experiencia de YouTube Shorts: vídeo a pantalla completa, navegación vertical, acciones flotantes y contenido educativo integrado sobre el propio vídeo.

## Estado actual

- Aplicación estática sin dependencias de build.
- App instalable en móvil como PWA con `manifest.webmanifest`, service worker e iconos.
- Pantalla de entrada simple con propuesta de valor y preview tipo Shorts.
- Feed fullscreen con reproductor YouTube controlado mediante YouTube IFrame API.
- Navegación vertical mediante swipe, rueda de ratón y teclado.
- El vídeo ya no cambia por toque accidental sobre la pantalla.
- Pausa/reproducción tocando la zona central del vídeo o con la barra espaciadora.
- Controles flotantes sobre el vídeo: Más, Menos, Comentario, Sonido/Mute e Info.
- Botón Play retirado del lateral; solo aparece indicador central cuando el vídeo está pausado.
- Botón Trash retirado temporalmente.
- Texto del vídeo compacto, con pestaña inferior izquierda para ocultarlo o recuperarlo.
- Barra de progreso minimalista con tiempo actual/duración y seeking manual.
- Sheet de Info cerrable con botón `×` o tirador superior, sin reiniciar el vídeo.
- Barra inferior de categorías con scroll horizontal.
- Feedback local guardado en `localStorage`.
- Dataset seed en `src/data.js` con campos compatibles con la base antigua: `video_id`, `title`, `url`, `views`, `duration`, `publishedAt`, `channel`.

## Cómo probar

Abrir `index.html` directamente o entrar en GitHub Pages:

https://volinga14.github.io/LOOP/

En móvil, abrir la URL en Chrome/Safari y usar la opción de añadir a pantalla de inicio o instalar app. Al abrirla desde el icono, se verá en modo standalone/pantalla completa.

## Próximos pasos

1. Sustituir el dataset seed por las bases reales antiguas.
2. Añadir backend/API para guardar feedback real.
3. Implementar scoring educativo y filtrado automático.
4. Añadir historial y guardados.
5. Pulir la experiencia de vídeo con datos reales y clips verificados.
