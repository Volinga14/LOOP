# LOOP MVP — Documentación viva

## 1. Propósito del documento

Este documento recoge el estado actual del MVP de LOOP: qué estamos construyendo, qué capacidades tiene, qué decisiones se han tomado, qué queda pendiente y cuáles son los próximos pasos.

La idea es mantenerlo actualizado durante el desarrollo, de forma que sirva como referencia central para producto, diseño, código, validación y futuras versiones.

---

## 2. Visión de LOOP

LOOP es una plataforma que transforma el formato de reels o shorts en una experiencia educativa.

En lugar de consumir contenido aleatorio, el usuario recibe vídeos cortos filtrados y estructurados para aprovechar mejor su tiempo. El objetivo es convertir el hábito de consumo pasivo de scroll en un sistema de microaprendizaje inteligente.

El usuario aprende deslizando entre cápsulas rápidas de contenido verídico, entretenido y útil.

### Propuesta de valor principal

- Convertir el scroll adictivo de vídeos cortos en aprendizaje activo o semipasivo.
- Ofrecer contenido educativo corto, útil y filtrado.
- Permitir al usuario elegir sus intereses y recibir vídeos adaptados.
- Reducir la necesidad de buscar manualmente buen contenido educativo.
- Construir un algoritmo de filtrado y recomendación centrado en calidad educativa, no solo en engagement.

---

## 3. Objetivo claro del MVP

El objetivo del MVP no es crear todavía la plataforma definitiva, sino validar el núcleo del producto:

> ¿Puede una experiencia tipo reels, con vídeos educativos bien filtrados y feedback del usuario, convertirse en una forma atractiva y útil de aprender?

El MVP debe demostrar tres cosas:

1. Que el formato de scroll vertical funciona para contenido educativo.
2. Que el usuario percibe valor al recibir vídeos filtrados por tema e interés.
3. Que el feedback del usuario puede empezar a mejorar la recomendación de contenido.

---

## 4. Alcance del MVP v0.1

### Definición corta

LOOP MVP v0.1 será una PWA o web app móvil donde el usuario podrá elegir una categoría, buscar un tema y deslizar vídeos educativos cortos, dando feedback sobre cada vídeo.

### Alcance cerrado inicial

Incluye:

- Pantalla inicial con selección de categoría o búsqueda de tema.
- Feed vertical tipo reels/shorts.
- Reproducción de vídeos educativos embebidos desde YouTube.
- Dataset inicial controlado de vídeos.
- Botones de feedback por vídeo.
- Guardado del feedback en base de datos.
- Lógica básica de recomendación.
- Modo random educativo basado en algoritmo.
- Estructura preparada para integrar búsqueda, recomendación y base de datos.

No incluye todavía:

- App nativa iOS/Android.
- Red social.
- Comentarios públicos.
- Subida de vídeos por usuarios.
- Login complejo.
- Gamificación avanzada.
- Monetización.
- Cursos largos.
- Certificados.
- Algoritmo avanzado de machine learning.

---

## 5. Usuario objetivo inicial

El usuario inicial es una persona que ya consume contenido corto en redes sociales, pero quiere que parte de ese tiempo tenga más valor.

### Perfil inicial

- Usa TikTok, Instagram Reels o YouTube Shorts.
- Tiene intereses de aprendizaje, pero poca constancia para cursos largos.
- Quiere aprender sin esfuerzo excesivo.
- Valora contenido breve, claro y entretenido.
- Puede interesarse por ciencia, tecnología, alimentos, idiomas, psicología, historia, finanzas, productividad u otros temas prácticos.

### Necesidad principal

> “Quiero aprender cosas útiles en momentos muertos, sin tener que buscar contenido bueno manualmente.”

---

## 6. Decisiones funcionales iniciales

| Área | Decisión |
|---|---|
| Idioma de la app | Inglés |
| Contenido inicial | Internacional |
| Categorías iniciales | Science, Technology, Food |
| Selección de intereses | Forma parte del algoritmo de búsqueda y recomendación |
| Cambio de intereses | El usuario podrá cambiarlos en cualquier momento |
| Entrada inicial | El usuario podrá elegir una categoría o buscar un tema |
| Random educativo | Existirá, pero controlado por algoritmo |
| Peso entre educación y entretenimiento | 50% calidad educativa / 50% entretenimiento |
| Dataset | Automatizado en lo posible, pero con bastante control |
| Feedback | Se guardará en base de datos |
| Primer entorno | Planteado para funcionar desde GitHub inicialmente |
| Despliegue final | Pendiente de definir |

---

## 7. Experiencia de usuario prevista

### Flujo básico

1. El usuario abre LOOP.
2. Selecciona una categoría inicial o busca un tema concreto.
3. Entra en un feed vertical de vídeos cortos.
4. Desliza para pasar al siguiente vídeo.
5. Da feedback sobre cada vídeo.
6. Puede cambiar intereses o búsqueda en cualquier momento.
7. El sistema ajusta progresivamente el contenido mostrado.

### Pantallas iniciales

#### 1. Pantalla de bienvenida

Objetivo: explicar LOOP en una frase y llevar al usuario a seleccionar categoría o buscar un tema.

Mensaje posible:

> Learn by scrolling. Short, useful and filtered videos that turn your feed into learning.

#### 2. Selección de categoría / búsqueda

Categorías iniciales:

- Science
- Technology
- Food

Además, el usuario podrá buscar un tema concreto. Esa búsqueda deberá alimentar el algoritmo, no ser solo un filtro visual.

#### 3. Feed de vídeos

Elementos:

- Vídeo en pantalla principal.
- Título corto.
- Canal o fuente.
- Categoría.
- Tags principales.
- Botones de feedback.
- Botón de información adicional.

#### 4. Feedback

Botones iniciales:

- More: quiero más contenido como este.
- Less: quiero menos contenido como este.
- Trash: no me interesa / descartar.
- Comment: añadir comentario sobre el vídeo.

---

## 8. Arquitectura funcional del MVP

El proyecto se plantea como tres partes principales que pueden desarrollarse por separado, pero que deben estar bien conectadas desde el principio.

### 1. Visualización / experiencia de usuario

Es la parte visible de la app.

Debe permitir:

- Ver vídeos en formato vertical tipo reels.
- Cambiar de vídeo con swipe.
- Seleccionar una categoría inicial.
- Buscar un tema concreto.
- Cambiar intereses en cualquier momento.
- Dar feedback sobre cada vídeo.
- Recibir un feed fluido y agradable.

Esta parte se considera prioritaria para la primera construcción porque permite probar la experiencia completa, incluso aunque el algoritmo inicial sea simple.

### 2. Algoritmo de búsqueda y recomendación

El algoritmo tendrá dos grandes bloques.

#### A. Algoritmo de búsqueda de vídeos

Su función será encontrar vídeos candidatos en YouTube.

Deberá tener en cuenta:

- Categoría seleccionada.
- Búsqueda concreta del usuario.
- Idioma.
- Duración.
- Canal.
- Título.
- Posibles señales de calidad.
- Posibles señales de clickbait o baja calidad.

#### B. Algoritmo de recomendación dentro de LOOP

Su función será decidir qué vídeo mostrar a cada usuario.

Deberá tener en cuenta:

- Intereses seleccionados.
- Búsquedas previas.
- Feedback del usuario.
- Vídeos ya vistos.
- Vídeos descartados.
- Diversidad del feed.
- Calidad educativa.
- Capacidad de entretener.

El modo “random educativo” también vendrá del algoritmo. No será completamente aleatorio, sino una mezcla de exploración controlada con contenido educativo de calidad.

### 3. Base de datos

La base de datos debe diseñarse muy bien desde el principio porque será el punto de conexión entre contenido, algoritmo, usuario y feedback.

Debe guardar:

- Vídeos candidatos.
- Vídeos aprobados.
- Vídeos rechazados.
- Scores de calidad.
- Categorías y tags.
- Feedback del usuario.
- Historial de visualización.
- Búsquedas realizadas.
- Señales útiles para mejorar recomendaciones.

El feedback deberá guardarse en base de datos, no solo en local, para poder mejorar el sistema con datos reales.

---

## 9. Capacidades actuales previstas

Esta sección debe actualizarse a medida que se construya el MVP.

### Producto

- [ ] Selección de categoría por parte del usuario.
- [ ] Búsqueda de tema por parte del usuario.
- [ ] Cambio de intereses en cualquier momento.
- [ ] Feed vertical de vídeos.
- [ ] Reproducción de vídeos de YouTube.
- [ ] Navegación tipo swipe.
- [ ] Feedback básico por vídeo.
- [ ] Comentarios privados de feedback.
- [ ] Historial básico de vídeos vistos.
- [ ] Evitar repetir vídeos ya descartados.
- [ ] Priorización de vídeos según interés/búsqueda.
- [ ] Modo random educativo.

### Contenido

- [ ] Dataset inicial de vídeos educativos.
- [ ] Clasificación por categoría.
- [ ] Clasificación por idioma.
- [ ] Clasificación por nivel.
- [ ] Clasificación por tags.
- [ ] Score educativo inicial.
- [ ] Score de entretenimiento.
- [ ] Estado del vídeo: candidato, aprobado, rechazado.
- [ ] Detección manual o semiautomática de vídeos de baja calidad.

### Algoritmo / recomendación

- [ ] Score inicial por calidad educativa.
- [ ] Score inicial por entretenimiento.
- [ ] Score por coincidencia con intereses del usuario.
- [ ] Score por coincidencia con búsqueda del usuario.
- [ ] Penalización por feedback negativo.
- [ ] Refuerzo por feedback positivo.
- [ ] Diversidad mínima del feed.
- [ ] Evitar duplicados.
- [ ] Ajuste básico por temas preferidos.
- [ ] Random educativo controlado.

### Tecnología

- [ ] PWA o web app responsive.
- [ ] Dataset temporal en JSON para primeras pruebas.
- [ ] Base de datos para feedback y evolución real del sistema.
- [ ] Guardado de feedback en backend/base de datos.
- [ ] Estructura preparada para migrar a backend real si se empieza simple.
- [ ] Interfaz mobile-first.
- [ ] Funcionamiento inicial desde GitHub.
- [ ] Posibilidad de despliegue rápido en Cloudflare, Vercel o similar.

---

## 10. Estructura de datos inicial

### Video

Campos recomendados:

| Campo | Descripción |
|---|---|
| id | Identificador interno del vídeo |
| youtube_video_id | ID de YouTube |
| url | URL del vídeo |
| title | Título del vídeo |
| channel_id | ID del canal |
| channel_name | Nombre del canal |
| duration_seconds | Duración en segundos |
| language | Idioma |
| primary_category | Categoría principal: Science, Technology, Food |
| tags | Temas secundarios |
| level | Básico, intermedio o avanzado |
| educational_score | Score educativo inicial |
| entertainment_score | Score de entretenimiento/claridad/atractivo |
| reliability_score | Score de fiabilidad |
| loop_score | Score interno final de LOOP |
| status | Candidato, aprobado o rechazado |
| rejection_reason | Motivo de rechazo, si aplica |
| source_query | Búsqueda que encontró el vídeo |
| created_at | Fecha de incorporación |
| updated_at | Fecha de última actualización |

### Feedback

Campos recomendados:

| Campo | Descripción |
|---|---|
| id | Identificador del feedback |
| user_id | Usuario o sesión |
| video_id | Vídeo evaluado |
| action | more, less, trash, comment |
| comment | Texto opcional del usuario |
| created_at | Fecha y hora |

### User Profile inicial

Campos recomendados:

| Campo | Descripción |
|---|---|
| user_id | Identificador de usuario o sesión |
| selected_interests | Intereses seleccionados |
| preferred_language | Idioma preferido |
| seen_videos | Vídeos vistos |
| positive_tags | Tags reforzados |
| negative_tags | Tags penalizados |
| trash_videos | Vídeos descartados |
| search_history | Historial de búsquedas |

### Search / Query

Campos recomendados:

| Campo | Descripción |
|---|---|
| id | Identificador de búsqueda |
| user_id | Usuario o sesión, si aplica |
| query_text | Texto buscado |
| category | Categoría asociada, si aplica |
| generated_keywords | Keywords generadas por el algoritmo |
| created_at | Fecha de búsqueda |

---

## 11. Lógica inicial de recomendación

El MVP no necesita un algoritmo complejo. Se propone empezar con una lógica de scoring simple.

### Score final orientativo

```text
score_final = educational_score + entertainment_score + user_affinity + feedback_score + diversity_score - penalties
```

### Factores iniciales

| Factor | Peso orientativo |
|---|---:|
| Calidad educativa | 25% |
| Entretenimiento / claridad / atractivo | 25% |
| Coincidencia con intereses o búsqueda | 25% |
| Feedback previo | 15% |
| Diversidad / exploración controlada | 10% |

La relación educación/entretenimiento se mantiene equilibrada: 50/50 en la valoración base del contenido.

### Penalizaciones

- Vídeo ya visto.
- Vídeo descartado con Trash.
- Canal marcado negativamente.
- Tema penalizado por el usuario.
- Duración excesiva.
- Título clickbait.
- Baja fiabilidad.
- Contenido repetitivo.

---

## 12. Filtro de calidad de contenido

El filtro es una parte crítica de LOOP. El valor diferencial de la plataforma no está solo en mostrar vídeos, sino en filtrar buen contenido educativo.

### Reglas iniciales

Un vídeo debería aprobarse si:

- Es corto.
- Tiene una idea educativa clara.
- Es entretenido o suficientemente atractivo.
- No es contenido vacío o puramente motivacional.
- No es desinformativo.
- No depende exclusivamente de clickbait.
- Tiene una fuente razonablemente fiable.
- Se entiende sin demasiado contexto externo.
- Puede aportar algo útil en menos de un minuto.

### Motivos de rechazo

- Clickbait sin contenido real.
- Información dudosa o falsa.
- Contenido demasiado largo.
- Contenido no educativo.
- Mala calidad de audio o vídeo.
- Demasiada autopromoción.
- Contenido duplicado.
- Tema demasiado polémico para el MVP inicial.

---

## 13. Dataset inicial recomendado

Para el MVP v0.1 se recomienda empezar con pocas categorías y buen control de calidad, pero desde el principio pensando en que el dataset pueda crecer de forma automatizada.

### Idioma y alcance del contenido

- Idioma inicial de la interfaz: inglés.
- Idioma principal del contenido: inglés.
- Alcance del contenido: internacional.
- Fuente principal inicial: YouTube / YouTube Shorts.

### Categorías iniciales cerradas

1. Science
2. Technology
3. Food

Estas categorías se consideran suficientemente amplias para probar el sistema sin dispersar demasiado el producto.

### Volumen inicial

- 30–50 vídeos por categoría.
- Total aproximado: 100–150 vídeos.

### Enfoque de control del dataset

El dataset deberá generarse de forma lo más automatizada posible, pero con bastante control de calidad.

El enfoque recomendado es:

1. Búsqueda automatizada de vídeos candidatos.
2. Clasificación automática por tema, idioma, duración, canal, tags y señales básicas.
3. Scoring automático inicial.
4. Revisión o validación de los vídeos con peor señal o mayor incertidumbre.
5. Aprobación/rechazo antes de entrar en el feed principal.

El objetivo no es cargar mucho contenido sin control, sino construir una base de datos fiable que permita probar el producto sin degradar la experiencia.

---

## 14. Stack técnico propuesto

La decisión técnica puede cambiar, pero para el MVP se propone una solución simple y rápida.

### Opción rápida inicial

- Frontend: React o HTML/CSS/JavaScript.
- App: PWA mobile-first.
- Datos temporales iniciales: JSON.
- Feedback real: base de datos.
- Deploy inicial: GitHub / GitHub Pages si encaja.

### Opción más robusta

- Frontend: React / Next.js.
- Backend: Supabase.
- Base de datos: PostgreSQL.
- Auth: Supabase Auth o login anónimo inicial.
- Deploy: Vercel, Cloudflare Pages o similar.

### Recomendación actual

Para empezar desde cero y evitar complejidad innecesaria:

> Crear primero una visualización funcional mobile-first con dataset temporal y estructura limpia. En paralelo, definir la base de datos real para guardar feedback, vídeos y señales del algoritmo.

---

## 15. Lo que falta definir

### Producto

- [x] Idioma inicial de la interfaz: inglés.
- [x] Alcance inicial del contenido: internacional.
- [x] Categorías iniciales: Science, Technology, Food.
- [x] La selección de intereses formará parte del algoritmo de búsqueda y recomendación.
- [x] El usuario podrá cambiar intereses en cualquier momento.
- [x] El usuario podrá seleccionar una categoría o buscar un tema específico.
- [x] Existirá un modo random educativo basado en el algoritmo.
- [x] El peso entre entretenimiento y calidad educativa será 50/50.
- [ ] Definir si habrá pantalla de resumen de aprendizaje.
- [ ] Definir onboarding inicial exacto.

### Contenido

- [x] Fuente inicial: YouTube / YouTube Shorts.
- [x] Enfoque: dataset automatizado en lo posible, pero con bastante control.
- [ ] Criterios exactos de aprobación.
- [ ] Canales de YouTube aceptados.
- [ ] Canales o temas excluidos.
- [ ] Proceso de revisión manual/semi-automática inicial.
- [ ] Método técnico para extraer o cargar nuevos vídeos.

### Técnico

- [x] El feedback se guardará en base de datos.
- [x] La app se planteará inicialmente para funcionar desde GitHub.
- [ ] Stack final del MVP v0.1.
- [ ] Base de datos final.
- [ ] Si habrá usuario anónimo o login.
- [ ] Estructura final del JSON/base de datos.
- [ ] Sistema final de despliegue.

### Diseño

- [ ] Estilo visual.
- [ ] Logo provisional.
- [ ] Colores.
- [ ] Tipografía.
- [ ] Diseño de botones.
- [ ] Diseño del selector de intereses.
- [ ] Diseño de búsqueda por tema.

---

## 16. Riesgos principales

### Riesgo 1: El contenido no es suficientemente bueno

Si los vídeos no tienen calidad, LOOP se convierte en otro feed más.

Mitigación:

- Empezar con dataset pequeño y muy filtrado.
- Revisar manualmente los primeros vídeos.
- Crear criterios claros de calidad.

### Riesgo 2: YouTube embed limita la experiencia

YouTube puede introducir restricciones de reproducción, anuncios, controles o comportamiento no ideal para una experiencia tipo reels.

Mitigación:

- Validar rápido con embed.
- Diseñar la app para poder cambiar fuente de vídeo en el futuro.
- No depender de funcionalidades avanzadas de YouTube para el primer test.

### Riesgo 3: El algoritmo inicial no aporta suficiente personalización

El primer algoritmo será simple.

Mitigación:

- Usar feedback explícito del usuario.
- Evitar repetir vídeos.
- Ajustar el feed por intereses, búsquedas y tags.
- Medir qué vídeos se ven, se descartan o reciben feedback positivo.

### Riesgo 4: El MVP se complica demasiado

Existe el riesgo de querer construir demasiadas funciones desde el principio.

Mitigación:

- Mantener el MVP centrado en visualización, contenido, algoritmo básico y feedback.
- Posponer login complejo, comunidad, gamificación y automatizaciones avanzadas.

### Riesgo 5: Arquitectura mal conectada

Si visualización, algoritmo y base de datos se desarrollan sin coordinación, habrá que rehacer partes importantes.

Mitigación:

- Definir pronto contratos de datos entre módulos.
- Usar una estructura de vídeo y feedback estable desde el inicio.
- Mantener la visualización desacoplada del origen exacto de los datos.

---

## 17. Roadmap inicial

### Fase 0 — Definición

- [x] Definir visión del producto.
- [x] Definir objetivo del MVP.
- [x] Definir alcance inicial.
- [x] Cerrar idioma y categorías iniciales.
- [x] Definir arquitectura funcional por módulos.
- [ ] Cerrar especificación funcional v0.1.
- [ ] Cerrar stack técnico.

### Fase 1 — Visualización funcional

- [ ] Crear PWA/base mobile-first.
- [ ] Crear pantalla de bienvenida.
- [ ] Crear selector de categoría.
- [ ] Crear búsqueda de tema.
- [ ] Crear feed vertical.
- [ ] Integrar reproducción de YouTube.
- [ ] Implementar botones de feedback.
- [ ] Preparar integración con base de datos.

### Fase 2 — Modelo de datos y base de datos

- [ ] Definir estructura real de datos.
- [ ] Definir tablas/colecciones.
- [ ] Definir almacenamiento de feedback.
- [ ] Definir almacenamiento de búsquedas.
- [ ] Definir estados de vídeos: candidato, aprobado, rechazado.
- [ ] Conectar feedback real a base de datos.

### Fase 3 — Dataset inicial

- [ ] Crear estructura de datos.
- [ ] Seleccionar vídeos iniciales.
- [ ] Clasificar vídeos.
- [ ] Asignar scores iniciales.
- [ ] Rechazar vídeos de baja calidad.
- [ ] Crear primer flujo semi-automatizado de búsqueda.

### Fase 4 — Recomendación básica

- [ ] Crear score final de vídeo.
- [ ] Ordenar feed por score.
- [ ] Ajustar score según feedback.
- [ ] Añadir diversidad de temas.
- [ ] Añadir random educativo controlado.
- [ ] Evaluar comportamiento con usuarios reales.

### Fase 5 — Validación

- [ ] Test interno.
- [ ] Test con 5–10 usuarios.
- [ ] Recoger feedback cualitativo.
- [ ] Medir retención básica.
- [ ] Detectar problemas de contenido o experiencia.

### Fase 6 — LOOP v0.2

- [ ] Automatizar búsqueda de vídeos.
- [ ] Usar IA para clasificar y filtrar contenido.
- [ ] Añadir panel de revisión.
- [ ] Mejorar perfil de usuario.
- [ ] Explorar sistema de aprendizaje por objetivos.

---

## 18. Métricas de validación inicial

Para saber si el MVP tiene sentido, se pueden medir estas señales:

### Uso

- Número de vídeos vistos por sesión.
- Tiempo medio por sesión.
- Porcentaje de vídeos completados.
- Número de swipes por sesión.
- Número de búsquedas realizadas.
- Categorías seleccionadas.

### Calidad percibida

- Porcentaje de vídeos marcados como More.
- Porcentaje de vídeos marcados como Less.
- Porcentaje de vídeos marcados como Trash.
- Comentarios escritos por los usuarios.

### Retención

- Usuarios que vuelven al día siguiente.
- Usuarios que vuelven en la semana.
- Categorías más usadas.
- Temas más buscados.

### Aprendizaje percibido

Pregunta simple al final de sesión:

- Did you learn something useful?
- Was this better than normal scrolling?

---

## 19. Decisiones tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-05-15 | Reiniciar el MVP desde cero | Evitar arrastrar errores previos y simplificar el núcleo del producto |
| 2026-05-15 | Priorizar PWA/web app mobile-first | Permite probar rápido sin app nativa |
| 2026-05-15 | Empezar con dataset controlado | Validar calidad antes de automatizar |
| 2026-05-15 | Mantener feedback More/Less/Trash/Comment | Es la base del algoritmo de personalización |
| 2026-05-15 | Posponer funciones sociales y gamificación avanzada | Mantener el MVP enfocado |
| 2026-05-15 | Idioma inicial en inglés | Permite trabajar con contenido internacional y mayor volumen de vídeos |
| 2026-05-15 | Contenido inicial internacional | Amplía el universo de búsqueda y calidad del contenido |
| 2026-05-15 | Categorías iniciales: Science, Technology, Food | Permiten probar intereses amplios sin dispersar demasiado el MVP |
| 2026-05-15 | El usuario podrá seleccionar categoría o buscar tema | La búsqueda debe ser parte central del algoritmo, no solo una navegación fija |
| 2026-05-15 | El modo random educativo vendrá del algoritmo | Evita aleatoriedad vacía y mantiene calidad educativa |
| 2026-05-15 | Educación y entretenimiento tendrán peso 50/50 | El contenido debe enseñar, pero también retener la atención |
| 2026-05-15 | El dataset será automatizado con control fuerte | Equilibra escalabilidad y calidad |
| 2026-05-15 | El feedback se guardará en base de datos | Necesario para mejorar la recomendación con datos reales |
| 2026-05-15 | La primera versión se planteará para funcionar desde GitHub | Facilita arranque, versionado y despliegue inicial sencillo |
| 2026-05-15 | Se priorizará primero la visualización funcional | Hace tangible el producto y facilita pruebas tempranas |

---

## 20. Preguntas abiertas

- ¿Habrá pantalla de resumen de aprendizaje o se pospone?
- ¿Qué criterios exactos se usarán para aprobar o rechazar un vídeo?
- ¿Qué canales de YouTube se consideran fuentes fiables para el primer dataset?
- ¿Qué canales, temas o formatos deben excluirse desde el principio?
- ¿Qué base de datos se utilizará inicialmente?
- ¿Habrá usuario anónimo, sesión local o login desde la primera versión?
- ¿Dónde se desplegará finalmente la primera versión pública?
- ¿Qué nivel mínimo de analítica necesitamos para validar el MVP?
- ¿Cómo se mostrará visualmente la búsqueda por tema dentro de una experiencia tipo reels?

---

## 21. Próximo paso recomendado

El siguiente paso recomendado es construir primero la parte de visualización, pero diseñada desde el principio para conectarse correctamente con algoritmo y base de datos.

### Orden recomendado de trabajo

#### Paso 1 — Visualización funcional

Crear una primera app mobile-first que permita:

- Ver vídeos en formato vertical.
- Navegar con swipe.
- Elegir una categoría inicial.
- Buscar un tema.
- Mostrar vídeos desde un dataset temporal.
- Registrar feedback.
- Preparar la conexión futura con base de datos.

Este paso permite validar rápidamente si la experiencia se siente bien.

#### Paso 2 — Modelo de datos

Diseñar la estructura real de datos para:

- Vídeos.
- Categorías.
- Tags.
- Canales.
- Usuarios/sesiones.
- Feedback.
- Búsquedas.
- Scores.

Aunque la visualización se haga primero, el modelo de datos debe definirse pronto para evitar rehacer la app después.

#### Paso 3 — Algoritmo inicial

Crear una primera versión simple del algoritmo con:

- Recomendación por categoría.
- Recomendación por búsqueda.
- Penalización de vídeos vistos o descartados.
- Refuerzo por More.
- Penalización por Less/Trash.
- Random educativo controlado.

#### Paso 4 — Automatización del dataset

Crear el flujo para:

- Buscar vídeos candidatos.
- Clasificarlos automáticamente.
- Puntuar calidad educativa y entretenimiento.
- Guardarlos como candidatos.
- Aprobarlos o rechazarlos antes de entrar al feed.

### Criterio de decisión actual

Se prioriza empezar por la visualización porque:

- Es la parte más fácil de validar con usuarios.
- Hace tangible el producto rápidamente.
- Permite probar la experiencia de scroll educativo.
- Servirá como base para integrar después algoritmo y base de datos.

Pero debe construirse con una arquitectura limpia para no bloquear la integración posterior.

---

## 22. Registro de cambios

### 2026-05-15

- Creación del documento vivo del MVP de LOOP.
- Definición de visión, objetivo, alcance, capacidades previstas, riesgos y roadmap inicial.
- Subida inicial al repositorio GitHub `Volinga14/LOOP`.
- Cierre de decisiones iniciales: inglés, contenido internacional, categorías Science/Technology/Food, feedback en base de datos y enfoque GitHub-first.
- Añadida arquitectura funcional por módulos: visualización, algoritmo de búsqueda/recomendación y base de datos.
- Añadido orden recomendado de trabajo: visualización, modelo de datos, algoritmo inicial y automatización del dataset.
