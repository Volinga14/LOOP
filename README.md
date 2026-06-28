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

```bash
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000
```

En GitHub Pages funciona como app estatica. La busqueda escrita intenta leer resultados publicos de YouTube desde el navegador, usa el catalogo incluido como respaldo y, si no hay coincidencias exactas, carga una mezcla de videos de YouTube de LOOP para no dejar la pantalla vacia. Para activar busqueda oficial con YouTube Data API desde el navegador, poner una API key restringida al dominio en `src/config.js`.

## Estructura

- `index.html`: shell principal y metadatos PWA.
- `styles.css`: diseño responsive, intro y feed tipo Shorts.
- `src/app.js`: lógica de búsqueda, categorías, aleatorización, swipe y reproductor.
- `src/data.js`: base inicial generada desde los CSV.
- `src/discovered-data.js`: catalogo incremental de categorias y videos vistos.
- `src/config.js`: configuracion opcional para YouTube Data API.
- `data1/*.csv`: CSV originales.
- `manifest.webmanifest`, `service-worker.js`, `icons/`: instalación PWA.
