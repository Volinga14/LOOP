# LOOP — Primera fase de análisis y revisión

Fecha: 14 de octubre de 2026.

## Conclusión

LOOP dispone de una base ligera para validar el microaprendizaje: bienvenida, categorías, feed vertical, reproducción de YouTube, búsqueda, feedback y estructura PWA. Conviene estabilizar esta base antes de ampliar funciones o automatizar recomendaciones. Los problemas principales están en la seguridad del servidor opcional, la coherencia de las búsquedas, las operaciones asíncronas, el almacenamiento y las actualizaciones de la PWA.

Esta fase añade documentación y comprobaciones reproducibles. No modifica el comportamiento de la aplicación ni publica cambios en GitHub.

## Alcance y evidencia

- Carpeta: `C:\PROYECTOSIA\GitHub\LOOP`.
- Repositorio: `https://github.com/Volinga14/LOOP`, público; rama local `main`.
- Commit local revisado: `4f0605b7dea378fa3ddf8ccb1b18d98342dd378f` (`V6`).
- La carpeta estaba limpia al iniciar la revisión.
- El conector GitHub confirma permisos de lectura, escritura y administración.
- El contenido de `src/app.js` coincide con el archivo remoto en `main`: blob `93e927aef70921ad01694978e9933222708da3c8`. Esto verifica ese archivo; no constituye una comparación completa de todas las ramas o archivos remotos.
- Se revisaron los archivos versionados de código, estilos, manifiesto, iconos, documentación y la estructura de los datos CSV.
- Pruebas: sintaxis de los seis archivos JavaScript, JSON del manifiesto, evaluación de lógica con un DOM simulado, simulación del service worker y peticiones HTTP a un servidor temporal.
- Resultados completos: `docs/revision-fase-1-resultados.json`.
- Reproducción: `node scripts/audit-phase1.mjs`, con Node.js instalado. El script informa observaciones, incluidos defectos conocidos; salir con código 0 significa que completó las pruebas, no que la aplicación carezca de errores.

No se ha validado visualmente en un navegador ni en móviles reales. Tampoco se ha comprobado la reproducción de cada vídeo, la disponibilidad actual de los proveedores externos, la instalación efectiva de la PWA o el despliegue público. Las pruebas usan respuestas simuladas para las búsquedas y no escriben en el catálogo.

## Arquitectura actual

| Componente | Implementación | Observación |
|---|---|---|
| Interfaz | HTML, CSS y JavaScript sin framework | Despliegue estático sencillo; `src/app.js` concentra 1.201 líneas de responsabilidades distintas. |
| Contenido inicial | Nueve CSV y `src/data.js` | Hay dos representaciones de los datos sin un generador versionado. |
| Contenido descubierto | `src/discovered-data.js` y almacenamiento local | Los vídeos se incorporan al arranque, pero las categorías descubiertas no. |
| Reproducción | YouTube IFrame API | Recrea el reproductor al renderizar cada vídeo; falta recuperación de errores. |
| Búsqueda | Piped/Invidious, API oficial opcional y respaldo local | Se consultan cuatro proveedores en paralelo; el primer resultado no vacío gana. |
| Feedback | `localStorage` | Se guarda por `id`, no por el identificador estable del vídeo; no modifica las recomendaciones. |
| Servidor opcional | `server.mjs`, sin dependencias externas | Sirve archivos y expone dos endpoints, que el cliente actual no consume. |
| PWA | Manifiesto y service worker | La estrategia de caché necesita revisión antes de futuras actualizaciones. |
| Calidad del desarrollo | Sin configuración de pruebas o CI versionada | No hay un comando de validación previo a publicar, salvo el diagnóstico añadido en esta fase. |

## Hallazgos priorizados

P1: abordar antes de ampliar funciones o exponer el servidor. P2: corregir durante la estabilización. P3: mejoras posteriores. Las prioridades se asignan según el modo de despliegue: los riesgos del servidor opcional no equivalen a vulnerabilidades del servidor de GitHub Pages.

### 1. P1 — El servidor sirve archivos internos

**Confirmado por HTTP.** `GET /.git/HEAD` y `GET /server.mjs` responden 200. La función `serveStatic` sirve cualquier archivo existente dentro de la raíz, sin una lista de recursos públicos ni bloqueo de archivos internos. `listen(PORT)` tampoco limita explícitamente la escucha a loopback.

Referencia: `server.mjs:45`, `server.mjs:338`.

Acción: limitar el servidor de desarrollo a loopback por defecto; servir solo los recursos públicos previstos; bloquear directorios internos; validar rutas mediante `path.relative` en lugar de una comparación de prefijos. Comprobar respuestas 403/404 para archivos internos y rutas inexistentes. No se intentó leer credenciales ni archivos sensibles.

### 2. P1 — Escritura del catálogo sin controles suficientes

**Confirmado por revisión de código; no se ejecutaron escrituras.** `POST /api/seen-video` acepta un objeto con `video_id` y escribe directamente `src/discovered-data.js`. No limita el cuerpo, valida el esquema completo, autentica la operación ni serializa las escrituras. Dos solicitudes pueden leer la misma versión y perder cambios al escribir. JSON inválido se trata como error interno.

Referencia: `server.mjs:71`, `server.mjs:319`, `server.mjs:327`, `server.mjs:332`.

Acción: definir si este endpoint sigue siendo necesario; si se conserva, restringir su acceso, validar campos y tamaños, devolver errores 400 coherentes y usar persistencia serializada y escritura atómica fuera de los archivos fuente.

### 3. P1 — Búsqueda sin coincidencias presentada como resultados del tema

**Reproducido.** Buscar `zzzz_no_match_987654` produce cero coincidencias locales, pero el respaldo devuelve 40 vídeos aleatorios. `normalizeSearchVideo` los etiqueta con el tema buscado. Se pierde la diferencia visible entre resultados reales y sugerencias generales; `searchError` queda vacío si llegan esos vídeos.

Referencia: `src/app.js:428`, `src/app.js:525`, `src/app.js:643`, `src/app.js:692`.

Acción: mostrar un estado de ausencia de resultados y, si se ofrecen sugerencias, identificarlas claramente, conservando su categoría original. Mostrar cuándo se usa contenido local por un fallo de red.

### 4. P1 — Respuestas antiguas alteran una pantalla nueva

**Reproducido con promesas controladas.** Una búsqueda que termina después de volver a inicio aplica resultados y vuelve a llamar a `renderFeed`, aunque `state.screen` ya sea `intro`. Una paginación pendiente añade un vídeo de la búsqueda anterior después de elegir Biology.

Referencia: `src/app.js:391`, `src/app.js:409`, `src/app.js:692`, `src/app.js:743`, `src/app.js:1075`.

El contador protege frente a otra búsqueda, pero no frente a volver al inicio o cambiar de modo; la paginación no comprueba la identidad de la consulta.

Acción: invalidar solicitudes al cambiar de pantalla o modo; cancelar lo cancelable; validar consulta, modo y generación antes de aplicar respuestas o finalizar estados de carga.

### 5. P1 — Atajos de teclado interfieren con escritura y comentarios

**Reproducido.** `ArrowDown` con destino `TEXTAREA` cambia el índice de vídeo de 0 a 1. El manejador global tampoco excluye inputs, contenido editable o el diálogo abierto. Espacio y las letras `m`, `l`, `c`, `s`, `t` ejecutan acciones mientras se escribe. Como Guardar consulta el vídeo actual, navegar durante un comentario puede guardarlo en otro vídeo.

Referencia: `src/app.js:1030`, `src/app.js:1039`, `src/app.js:1184`.

Acción: desactivar atajos en campos editables y diálogos, y fijar el identificador del vídeo al abrir el comentario.

### 6. P1 — Caché con actualización y respaldo inconsistentes

**Confirmado por inspección y simulación.** Los cuatro scripts del HTML llevan `?v=5`, pero el precache usa URLs sin esa consulta. Son claves diferentes. El service worker devuelve primero cualquier copia cacheada y no revalida; una nueva publicación con el mismo nombre de caché puede conservar código antiguo. También cachea GET de API y, ante fallo de red, devuelve `index.html` incluso para una petición de API. La activación borra todas las cachés del origen cuyo nombre no coincida, incluidas las de otras aplicaciones que compartan origen.

Referencia: `index.html:39`, `service-worker.js:1`, `service-worker.js:20`, `service-worker.js:26`.

Acción: definir una estrategia por tipo de recurso; alinear las URLs precacheadas con el HTML; excluir las APIs; usar respaldo HTML solo para navegación; cachear únicamente respuestas válidas y borrar solo cachés pertenecientes a LOOP. Verificar una instalación nueva offline y una actualización desde una versión previa.

### 7. P2 — Persistencia local vulnerable a errores y no integrada al catálogo

**Reproducido parcialmente.** Una excepción de `localStorage.setItem` se propaga desde `persistState`; puede interrumpir acciones y renderizados. `readJson` admite JSON válido de forma incorrecta, como `null`, sin validar estructura. El catálogo de vistos se guarda pero nunca se lee para alimentar `allVideos` al arrancar; los descubrimientos de una sesión no se recuperan del almacenamiento local en la siguiente.

Referencia: `src/app.js:74`, `src/app.js:98`, `src/app.js:109`, `src/app.js:125`.

Acción: centralizar lecturas y escrituras seguras, validar datos, establecer límites y migraciones y recuperar el catálogo local. Avisar al usuario si no puede persistirse su feedback.

### 8. P2 — Feedback fragmentado y sin efecto sobre el feed

**Reproducido y confirmado por código.** El mismo `video_id` aparece con distintos `id` según catálogo, búsqueda o proveedor. Una prueba muestra «Más contenido similar» en la versión original y «Sin feedback» en otra representación del mismo vídeo. La construcción de playlists no usa los votos: Más y Menos almacenan feedback pero no cambian la frecuencia futura.

Referencia: `src/app.js:205`, `src/app.js:510`, `src/app.js:773`, `src/app.js:983`.

Acción: guardar feedback por `video_id`, migrar los registros existentes y definir el comportamiento mínimo observable de Más y Menos. Separar diversidad, aleatoriedad e influencia del feedback.

### 9. P2 — Reproductor sin recuperación de errores

**Confirmado por código; pendiente de navegador.** La promesa de carga de la API de YouTube no tiene timeout ni manejador de error. El reproductor no implementa `onError`. Un script bloqueado, un vídeo retirado o un vídeo que no admita embed puede dejar al usuario sin explicación ni recuperación. El autoplay con sonido necesita comprobación por navegador.

Referencia: `src/app.js:251`, `src/app.js:282`.

Acción: estados explícitos de carga y error, posibilidad de reintentar o saltar, y pruebas en móvil y escritorio con reproducción bloqueada. Revisar callbacks que puedan pertenecer a un reproductor destruido.

### 10. P2 — Fuentes y formato de búsqueda poco controlados

**Confirmado por código.** Los proveedores Piped/Invidious solicitan vídeos generales sin aplicar un límite de duración. La API oficial devuelve como máximo 25 resultados y descarta su paginación. El servidor tiene una búsqueda distinta por scraping que el cliente no usa. La clave oficial está vacía; una clave configurada en `src/config.js` sería visible al cliente.

Referencia: `src/app.js:590`, `src/app.js:602`, `src/app.js:616`, `src/app.js:643`; `server.mjs:50`.

Acción: elegir un contrato y una política de proveedores; filtrar duración y disponibilidad para embed; conservar el proveedor y token de paginación. Si se usa una clave en cliente, configurar restricciones adecuadas y decidir cómo controlar cuota y acceso. No se ha verificado la disponibilidad actual de esos servicios.

### 11. P2 — Accesibilidad y adaptación requieren validación

**Confirmado por código; impacto visual pendiente.** Los inputs de búsqueda y comentario carecen de etiqueta explícita. El buscador cerrado conserva controles en el DOM con `opacity: 0` y `pointer-events: none`; `aria-hidden` no elimina por sí mismo su foco de teclado. Faltan estados anunciados para carga, errores y feedback. Se elimina el outline en campos sin un sustituto evidente. El bloqueo global de overflow requiere probar alturas pequeñas, zoom y teclado móvil.

Referencia: `index.html:31`; `src/app.js:795`, `src/app.js:859`; `styles.css:14`, `styles.css:67`, `styles.css:204`.

Acción: etiquetas, foco visible, estados anunciados, exclusión del foco cuando un panel está cerrado y gestión del foco al abrirlo. Validar navegación por teclado y tamaños reales antes de rediseñar.

### 12. P2 — Datos y documentación no representan un contrato único

**Confirmado.** Hay 604 entradas iniciales y dos descubiertas; al fusionarlas quedan 593 vídeos únicos, es decir, se consolidan 13 entradas repetidas. La fusión conserva una categoría por vídeo y puede sustituir una asociación previa. Los dos vídeos descubiertos tienen categorías ausentes de `allTopics`. Los identificadores tienen formato válido y las duraciones conocidas no superan 180 segundos; esto no confirma disponibilidad ni fiabilidad educativa.

La documentación viva describe feedback en base de datos, interfaz inglesa y funcionalidades pendientes que ya existen. La interfaz actual es principalmente española con categorías inglesas. Las puntuaciones de resultados remotos usan valores por defecto; el servidor estima calidad por visitas. Estos valores no acreditan revisión educativa.

Acción: definir identidad, pertenencia a múltiples temas, procedencia, estado de revisión y significado de cada puntuación. Versionar la generación del catálogo desde los CSV y actualizar las decisiones de producto, separando lo implementado de lo previsto.

### 13. P2 — Recursos inexistentes devuelven éxito

**Confirmado por HTTP.** `/not-found.js` devuelve 200 con HTML. Puede ocultar rutas rotas y alimentar incorrectamente la caché. La búsqueda remota del servidor tampoco establece un timeout explícito y solo valida hostname y pathname, sin restringir el protocolo a HTTPS.

Referencia: `server.mjs:50`, `server.mjs:92`, `server.mjs:347`.

Acción: responder 404 para recursos inexistentes; usar fallback de navegación solo donde corresponda; validar entradas y protocolo; fijar timeout y distinguir errores del usuario de fallos externos.

## Inventario del catálogo efectivo

| Categoría | Vídeos |
|---|---:|
| Astronomy | 66 |
| Biology | 37 |
| Physics | 53 |
| Social Sciences | 46 |
| Social Support | 62 |
| Subcultures | 60 |
| Cooking Recipes | 91 |
| Culinary Training | 87 |
| Non-alcoholic Drinks | 89 |
| Categorías descubiertas no incluidas en el selector | 2 |
| Total único | 593 |

## Plan de actualización

### Etapa A — Estabilización

1. Cerrar exposición de archivos internos y decidir el alcance del servidor de desarrollo.
2. Corregir búsquedas sin coincidencias y respuestas asíncronas antiguas.
3. Aislar teclado y comentarios del cambio de vídeo.
4. Corregir caché, versiones y respuestas para recursos inexistentes.
5. Proteger almacenamiento y recuperación del reproductor.

Criterio de salida: las pruebas anteriores pasan a comprobar el comportamiento esperado; un cambio de pantalla no aplica resultados viejos; escribir comentarios no cambia vídeos; los archivos internos no son accesibles; una actualización y un arranque offline funcionan en navegador.

### Etapa B — Datos y mantenimiento

1. Separar búsqueda, persistencia, reproductor y construcción de feed con interfaces pequeñas.
2. Adoptar identificadores estables y migrar feedback existente.
3. Unificar fuentes de datos, categorías descubiertas y generación del catálogo.
4. Añadir pruebas de regresión y validación automática de cambios.
5. Actualizar README y documentación viva para reflejar el estado real.

Criterio de salida: un vídeo conserva su feedback entre búsquedas y reinicios; el catálogo se puede regenerar; los cambios se validan antes de publicarse.

### Etapa C — Producto y experiencia

1. Definir idioma, tratamiento de sugerencias y efecto esperado de Más/Menos.
2. Definir aprobación educativa y separar candidatos de contenido revisado.
3. Elegir despliegue estático o backend según las necesidades de persistencia compartida; no añadir una base de datos solo por anticipación.
4. Validar accesibilidad, móvil, instalación, vídeo y proveedores reales.
5. Probar con usuarios y medir utilidad percibida antes de ampliar automatizaciones.

No es necesario elegir un framework nuevo para resolver los defectos encontrados. La decisión debe basarse en necesidades posteriores de producto y mantenimiento.
