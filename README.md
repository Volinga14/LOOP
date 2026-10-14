# LOOP MVP

Versión actualizada mezclando lo mejor de la versión antigua CSV con la UI tipo Shorts actual.

## Cambios de esta iteración

- Pantalla de inicio recuperada de la versión antigua: título LOOP, subtítulo, buscador, categorías y botón Empezar.
- Feed simplificado tipo Shorts: arriba solo queda el logo LOOP a la izquierda y una lupa a la derecha.
- El buscador y las categorías ya no ocupan espacio encima del vídeo; aparecen solo al tocar la lupa.
- Los vídeos se reproducen en orden aleatorio desde la base de datos inicial.
- Al elegir una categoría o búsqueda, los resultados también se barajan aleatoriamente.
- Swipe vertical rehecho: ahora funciona desde prácticamente cualquier parte del vídeo.
- Toque corto sobre el vídeo: play/pause.
- Mantiene controles actuales: Más, Menos, Comentario, Mute e Info.
- Mantiene barra de progreso minimalista con seeking.
- Mantiene PWA instalable.

## Probar localmente

Servidor local recomendado (requiere Node.js):

```bash
node server.mjs
```

Abrir `http://127.0.0.1:8000`. El servidor escucha únicamente en el equipo local por defecto y sirve una lista de archivos públicos. La escritura del catálogo por HTTP está desactivada; el cliente conserva feedback y vídeos vistos en el navegador. Para revisar regresiones:

```bash
node scripts/test-regressions.mjs
```

Alternativa para servir la aplicación estática:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abrir:

```text
http://localhost:8000
```

En GitHub Pages funciona como app estatica. La busqueda escrita lee resultados de YouTube mediante una API publica compatible con CORS, conserva el orden de la busqueda y va cargando mas resultados cuando el usuario avanza por el feed. Si esa API no responde, usa el catalogo incluido como respaldo.

El respaldo solo ofrece coincidencias locales y avisa de su origen. Una búsqueda sin coincidencias muestra un estado vacío, sin sustituirla por vídeos aleatorios. El feedback se conserva por identificador de vídeo y se migra desde el formato anterior; todavía no cambia la recomendación. Sin acceso a almacenamiento, los cambios permanecen durante la sesión. La PWA puede abrir su interfaz offline; los vídeos y búsquedas externas requieren conexión.

La revisión inicial está en `docs/revision-fase-1.md`. Las correcciones y pendientes actuales se documentan en `docs/correcciones-estabilizacion.md`.

## Estructura

- `index.html`: shell principal y metadatos PWA.
- `styles.css`: diseño responsive, intro y feed tipo Shorts.
- `src/app.js`: lógica de búsqueda, categorías, aleatorización, swipe y reproductor.
- `src/data.js`: base inicial generada desde los CSV.
- `src/discovered-data.js`: catalogo incremental de categorias y videos vistos.
- `src/config.js`: configuracion opcional para YouTube Data API.
- `data1/*.csv`: CSV originales.
- `manifest.webmanifest`, `service-worker.js`, `icons/`: instalación PWA.
