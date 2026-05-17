# LOOP MVP — CSV + Shorts UI

Versión actualizada combinando lo mejor de la versión antigua con el diseño actual:

- Base inicial real desde los CSV antiguos: 9 categorías y 604 vídeos.
- Datos embebidos en `src/data.js` para que funcione sin backend.
- Copia de los CSV originales en `data1/` para futuras pruebas.
- Pantalla de inicio con búsqueda y categorías visibles.
- Búsqueda por categoría o por texto en título/tema.
- Categorías superiores durante la reproducción.
- Feed vertical tipo Shorts.
- Navegación por swipe, rueda de ratón o flechas.
- Tap central para play/pause.
- Controles laterales actuales: Más, Menos, Comentario, Mute e Info.
- Barra de progreso minimalista con seeking.
- Texto ocultable mediante pestaña sobre el bloque de texto.
- Info sheet cerrable sin reiniciar el vídeo.
- PWA instalable en móvil con manifest, service worker e iconos.

## Cómo probar

Abrir `index.html` directamente o servir la carpeta con un servidor local:

```bash
python -m http.server 8000
```

Y abrir:

```text
http://localhost:8000
```

Para instalar en móvil, publicar por HTTPS o GitHub Pages y usar “Añadir a pantalla de inicio” / “Instalar app”.
