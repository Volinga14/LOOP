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

LOOP MVP v0.1 será una PWA o web app móvil donde el usuario podrá elegir un tema y deslizar vídeos educativos cortos, dando feedback sobre cada vídeo.

### Alcance cerrado inicial

Incluye:

- Pantalla inicial de selección de intereses.
- Feed vertical tipo reels/shorts.
- Reproducción de vídeos educativos embebidos desde YouTube.
- Dataset inicial controlado de vídeos.
- Botones de feedback por vídeo.
- Guardado del feedback.
- Lógica básica de recomendación.
- Panel interno simple o estructura de datos revisable.

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
- Puede interesarse por ciencia, tecnología, idiomas, psicología, historia, finanzas, productividad u otros temas prácticos.

### Necesidad principal

> “Quiero aprender cosas útiles en momentos muertos, sin tener que buscar contenido bueno manualmente.”

---

## 6. Experiencia de usuario prevista

### Flujo básico

1. El usuario abre LOOP.
2. Selecciona uno o varios intereses.
3. Entra en un feed vertical de vídeos cortos.
4. Desliza para pasar al siguiente vídeo.
5. Da feedback sobre cada vídeo.
6. El sistema ajusta progresivamente el contenido mostrado.

### Pantallas iniciales

#### 1. Pantalla de bienvenida

Objetivo: explicar LOOP en una frase y llevar al usuario a seleccionar intereses.

Mensaje posible:

> Aprende deslizando. Vídeos cortos, útiles y filtrados para convertir tu scroll en aprendizaje.

#### 2. Selección de intereses

Categorías iniciales recomendadas:

- Ciencia
- Tecnología
- Inglés

Más adelante:

- Psicología
- Historia
- Finanzas
- Productividad
- Salud
- Jardinería
- Negocios
- Ingeniería

#### 3. Feed de vídeos

Elementos:

- Vídeo en pantalla principal.
- Título corto.
- Canal o fuente.
- Categoría.
- Botones de feedback.
- Botón de información adicional.

#### 4. Feedback

Botones iniciales:

- More: quiero más contenido como este.
- Less: quiero menos contenido como este.
- Trash: no me interesa / descartar.
- Comment: añadir comentario sobre el vídeo.

---

## 7. Capacidades actuales previstas

Esta sección debe actualizarse a medida que se construya el MVP.

### Producto

- [ ] Selección de intereses por parte del usuario.
- [ ] Feed vertical de vídeos.
- [ ] Reproducción de vídeos de YouTube.
- [ ] Navegación tipo swipe.
- [ ] Feedback básico por vídeo.
- [ ] Comentarios privados de feedback.
- [ ] Historial básico de vídeos vistos.
- [ ] Evitar repetir vídeos ya descartados.
- [ ] Priorización de vídeos según interés elegido.

### Contenido

- [ ] Dataset inicial de vídeos educativos.
- [ ] Clasificación por categoría.
- [ ] Clasificación por idioma.
- [ ] Clasificación por nivel.
- [ ] Score educativo inicial.
- [ ] Estado del vídeo: pendiente, aprobado, rechazado.
- [ ] Detección manual o semiautomática de vídeos de baja calidad.

### Algoritmo / recomendación

- [ ] Score inicial por calidad educativa.
- [ ] Score por coincidencia con intereses del usuario.
- [ ] Penalización por feedback negativo.
- [ ] Refuerzo por feedback positivo.
- [ ] Diversidad mínima del feed.
- [ ] Evitar duplicados.
- [ ] Ajuste básico por temas preferidos.

### Tecnología

- [ ] PWA o web app responsive.
- [ ] Dataset en JSON o base de datos simple.
- [ ] Guardado local o backend simple para feedback.
- [ ] Estructura preparada para migrar a backend real.
- [ ] Interfaz mobile-first.
- [ ] Posibilidad de despliegue rápido en Cloudflare, Vercel o similar.

---

## 8. Estructura de datos inicial

### Video

Campos recomendados:

| Campo | Descripción |
|---|---|
| id | Identificador interno del vídeo |
| video_id | ID de YouTube |
| url | URL del vídeo |
| title | Título del vídeo |
| channel | Canal de origen |
| duration | Duración |
| language | Idioma |
| category | Categoría principal |
| tags | Temas secundarios |
| level | Básico, intermedio o avanzado |
| educational_score | Score educativo inicial |
| entertainment_score | Score de claridad/atractivo |
| reliability_score | Score de fiabilidad |
| status | Pendiente, aprobado o rechazado |
| reason | Motivo de aprobación o rechazo |
| created_at | Fecha de incorporación |

### Feedback

Campos recomendados:

| Campo | Descripción |
|---|---|
| id | Identificador del feedback |
| user_id | Usuario o sesión |
| video_id | Vídeo evaluado |
| action | more, less, trash, comment |
| comment | Texto opcional del usuario |
| timestamp | Fecha y hora |

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

---

## 9. Lógica inicial de recomendación

El MVP no necesita un algoritmo complejo. Se propone empezar con una lógica de scoring simple.

### Score final orientativo

```text
score_final = calidad_educativa + afinidad_usuario + feedback + diversidad - penalizaciones
```

### Factores iniciales

| Factor | Peso orientativo |
|---|---:|
| Calidad educativa | 40% |
| Coincidencia con intereses | 25% |
| Feedback previo | 20% |
| Diversidad del feed | 10% |
| Popularidad / señales externas | 5% |

### Penalizaciones

- Vídeo ya visto.
- Vídeo descartado con Trash.
- Canal marcado negativamente.
- Tema penalizado por el usuario.
- Duración excesiva.
- Título clickbait.
- Baja fiabilidad.

---

## 10. Filtro de calidad de contenido

El filtro es una parte crítica de LOOP. El valor diferencial de la plataforma no está solo en mostrar vídeos, sino en filtrar buen contenido educativo.

### Reglas iniciales

Un vídeo debería aprobarse si:

- Es corto.
- Tiene una idea educativa clara.
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

## 11. Dataset inicial recomendado

Para el MVP v0.1 se recomienda empezar con pocas categorías y buen control de calidad.

### Categorías iniciales

1. Ciencia
2. Tecnología
3. Inglés

### Volumen inicial

- 30–50 vídeos por categoría.
- Total aproximado: 100–150 vídeos.

### Objetivo del dataset inicial

No es tener mucho contenido, sino tener suficiente contenido de calidad para validar la experiencia de uso.

---

## 12. Stack técnico propuesto

La decisión técnica puede cambiar, pero para el MVP se propone una solución simple y rápida.

### Opción rápida

- Frontend: HTML/CSS/JavaScript o React.
- App: PWA mobile-first.
- Datos iniciales: JSON.
- Feedback: LocalStorage o Supabase/Firebase.
- Deploy: Cloudflare Pages, Vercel o Netlify.

### Opción más robusta

- Frontend: React / Next.js.
- Backend: Supabase.
- Base de datos: PostgreSQL.
- Auth: Supabase Auth o login anónimo inicial.
- Deploy: Vercel o Cloudflare.

### Recomendación actual

Para empezar desde cero y evitar complejidad innecesaria:

> Crear primero una PWA funcional con dataset JSON y feedback local o backend simple. Después migrar a Supabase cuando la lógica de producto esté validada.

---

## 13. Lo que falta definir

### Producto

- [ ] Nombre final de la app: LOOP, Loop Learn u otra variante.
- [ ] Idioma inicial de la interfaz.
- [ ] Si el primer MVP será solo en español, solo en inglés o mixto.
- [ ] Número exacto de categorías iniciales.
- [ ] Qué feedback se considera más importante.
- [ ] Si habrá pantalla de resumen de aprendizaje.

### Contenido

- [ ] Fuente inicial de vídeos.
- [ ] Criterios exactos de aprobación.
- [ ] Canales de YouTube aceptados.
- [ ] Canales o temas excluidos.
- [ ] Proceso de revisión manual inicial.
- [ ] Método para extraer o cargar nuevos vídeos.

### Técnico

- [ ] Stack final del MVP v0.1.
- [ ] Si el feedback se guardará localmente o en backend.
- [ ] Si habrá usuario anónimo o login.
- [ ] Estructura final del JSON/base de datos.
- [ ] Sistema de despliegue.
- [ ] Repositorio GitHub.

### Diseño

- [ ] Estilo visual.
- [ ] Logo provisional.
- [ ] Colores.
- [ ] Tipografía.
- [ ] Diseño de botones.
- [ ] Diseño del selector de intereses.

---

## 14. Riesgos principales

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
- Ajustar el feed por intereses y tags.
- Medir qué vídeos se ven, se descartan o reciben feedback positivo.

### Riesgo 4: El MVP se complica demasiado

Existe el riesgo de querer construir demasiadas funciones desde el principio.

Mitigación:

- Mantener el MVP centrado en feed, contenido y feedback.
- Posponer login, comunidad, gamificación y automatizaciones avanzadas.

---

## 15. Roadmap inicial

### Fase 0 — Definición

- [x] Definir visión del producto.
- [x] Definir objetivo del MVP.
- [x] Definir alcance inicial.
- [ ] Cerrar especificación funcional v0.1.
- [ ] Cerrar stack técnico.

### Fase 1 — Dataset inicial

- [ ] Crear estructura de datos.
- [ ] Seleccionar categorías iniciales.
- [ ] Añadir primeros vídeos.
- [ ] Clasificar vídeos.
- [ ] Asignar scores iniciales.
- [ ] Rechazar vídeos de baja calidad.

### Fase 2 — Prototipo funcional

- [ ] Crear PWA base.
- [ ] Crear pantalla de selección de intereses.
- [ ] Crear feed vertical.
- [ ] Integrar reproducción de YouTube.
- [ ] Implementar botones de feedback.
- [ ] Guardar feedback.
- [ ] Evitar repetición de vídeos descartados.

### Fase 3 — Recomendación básica

- [ ] Crear score final de vídeo.
- [ ] Ordenar feed por score.
- [ ] Ajustar score según feedback.
- [ ] Añadir diversidad de temas.
- [ ] Evaluar comportamiento con usuarios reales.

### Fase 4 — Validación

- [ ] Test interno.
- [ ] Test con 5–10 usuarios.
- [ ] Recoger feedback cualitativo.
- [ ] Medir retención básica.
- [ ] Detectar problemas de contenido o experiencia.

### Fase 5 — LOOP v0.2

- [ ] Automatizar búsqueda de vídeos.
- [ ] Usar IA para clasificar y filtrar contenido.
- [ ] Añadir panel de revisión.
- [ ] Mejorar perfil de usuario.
- [ ] Explorar sistema de aprendizaje por objetivos.

---

## 16. Métricas de validación inicial

Para saber si el MVP tiene sentido, se pueden medir estas señales:

### Uso

- Número de vídeos vistos por sesión.
- Tiempo medio por sesión.
- Porcentaje de vídeos completados.
- Número de swipes por sesión.

### Calidad percibida

- Porcentaje de vídeos marcados como More.
- Porcentaje de vídeos marcados como Less.
- Porcentaje de vídeos marcados como Trash.
- Comentarios escritos por los usuarios.

### Retención

- Usuarios que vuelven al día siguiente.
- Usuarios que vuelven en la semana.
- Categorías más usadas.

### Aprendizaje percibido

Pregunta simple al final de sesión:

- ¿Sientes que has aprendido algo útil?
- ¿Te ha parecido mejor que hacer scroll normal?

---

## 17. Decisiones tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-05-15 | Reiniciar el MVP desde cero | Evitar arrastrar errores previos y simplificar el núcleo del producto |
| 2026-05-15 | Priorizar PWA/web app mobile-first | Permite probar rápido sin app nativa |
| 2026-05-15 | Empezar con dataset controlado | Validar calidad antes de automatizar |
| 2026-05-15 | Mantener feedback More/Less/Trash/Comment | Es la base del algoritmo de personalización |
| 2026-05-15 | Posponer funciones sociales y gamificación avanzada | Mantener el MVP enfocado |

---

## 18. Preguntas abiertas

- ¿El MVP inicial debe estar en español, inglés o ambos?
- ¿La primera prueba debe usar vídeos en español o contenido internacional en inglés?
- ¿Cuáles son las 3 categorías iniciales definitivas?
- ¿Queremos que el usuario seleccione intereses una sola vez o en cada sesión?
- ¿Debe existir un modo “random educativo” además del modo por intereses?
- ¿Qué peso debe tener el entretenimiento frente a la calidad educativa?
- ¿Qué nivel de control manual queremos sobre el dataset inicial?
- ¿Dónde se desplegará la primera versión?
- ¿El feedback se guardará primero localmente o ya en una base de datos?

---

## 19. Próximo paso recomendado

El siguiente paso es cerrar la especificación funcional de LOOP MVP v0.1.

Para ello hay que definir:

1. Las pantallas exactas.
2. Las categorías iniciales.
3. La estructura final del dataset.
4. La lógica de feedback.
5. El sistema de recomendación básico.
6. El stack técnico.
7. El criterio de éxito del primer test.

Después de cerrar esto, se puede empezar a construir la primera versión funcional desde cero.

---

## 20. Registro de cambios

### 2026-05-15

- Creación del documento vivo del MVP de LOOP.
- Definición de visión, objetivo, alcance, capacidades previstas, riesgos y roadmap inicial.
- Subida inicial al repositorio GitHub `Volinga14/LOOP`.
