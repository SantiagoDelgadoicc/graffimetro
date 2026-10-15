# Graffímetro — Hoja de ruta (fuente de verdad del estado)

Estados: `[ ]` Pendiente · `[~]` A medias · `[x]` Completado

Este archivo es la **fuente de verdad** del avance. El documento compartido
(https://claude.ai/code/artifact/6f6ab045-a3dd-41ce-a3d2-9906697744ec) se actualiza al cerrar cada hito.

"Preguntar antes" = decisiones que Claude debe consultar con preguntas de selección **antes** de empezar el hito.

---

## Fase 0 — Preparación del entorno
Meta: el proyecto vacío arranca en el navegador, está en GitHub y tiene Postgres conectado.

- [x] **H01 · Node.js** — `node -v` y `npm -v` responden. *(Lo instala el usuario.)*
- [x] **H02 · Claves de IA** — `.env.local` con las claves de Groq y Gemini; límites reales anotados en este archivo. *(Las crea el usuario.)*
  - Groq `openai/gpt-oss-120b`: 1.000 peticiones/día, 8.000 tokens/min (cabeceras de la API, 2026-10-15).
  - Gemini `gemini-3.5-flash-lite` (modelo fijado, no el alias `-latest`): 15 peticiones/min, 250.000 tokens/min, 500 peticiones/día (panel de AI Studio, 2026-10-15). La cuota es del proyecto "Default Gemini Project", compartida con otros usos.
- [x] **H03 · Git y GitHub** — repositorio local con `.gitignore` y primer commit subido a GitHub.
  - Preguntar antes: nombre del repositorio; privado o público. → `graffimetro`, público: https://github.com/SantiagoDelgadoicc/graffimetro
- [x] **H04 · Proyecto Next.js** — página en blanco funcionando en `localhost`.
  - Preguntar antes: estilos con Tailwind o con CSS Modules. → Tailwind CSS 4.
- [ ] **H05 · Herramientas de calidad** — ESLint, Prettier y Vitest, con un test de ejemplo en verde.
- [ ] **H06 · Postgres en Docker** — contenedor arriba y conexión comprobada desde Drizzle.

## Fase 1 — Datos y catálogo
Meta: la base de datos tiene sus tablas y los 100 muros validados están cargados.

- [ ] **H07 · Esquema de base de datos** — tablas `lotes` (los muros), `tasaciones` y `ofertas` creadas por migración.
- [ ] **H08 · Catálogo de 100 muros** — documento con 60 cerrados y 40 abiertos, con nombre corto, validado por el usuario.
  - Preguntar antes: temas obligatorios; temas prohibidos; nivel de dificultad.
- [ ] **H09 · Carga del catálogo** — script de semilla que carga los 100 muros; una consulta de prueba devuelve 100.

## Fase 2 — Motor de evaluación
Meta: una palabra enviada a la API vuelve evaluada (nota, combo, seguidores, comentario de Mika), cacheada y registrada, todavía sin interfaz.

- [ ] **H10 · Normalización básica** — función que unifica mayúsculas, espacios y tildes, con tests.
- [ ] **H11 · Prompt de evaluación** — prompt + esquema `zod` (válida, forma canónica, rareza, ingenio, comentario) y guía de estilo de Mika.
  - Preguntar antes: ejemplos de calibración (palabras que valen x1, x4 y x7 para el usuario).
- [ ] **H12 · Conexión con Groq** — evaluación real con `openai/gpt-oss-120b` desde un script.
- [ ] **H13 · Respaldo con Gemini** — si Groq falla por límite, responde Gemini Flash-Lite; test que simula el fallo.
- [ ] **H14 · Fórmula de puntuación** — nota 0-100 → combo x1–x7 → seguidores logarítmicos; pesos 80/20 (cerrados) y 40/60 (abiertos); transición a datos de jugadores (50 → 500 palabras); tests.
  - Preguntar antes: tramos de nota de cada combo.
- [ ] **H15 · API de evaluación con caché** — `/api/tasar` devuelve la evaluación; la segunda vez sale de la caché y la palabra queda registrada.
- [ ] **H16 · Límite de peticiones** — por IP, 10/min y 300/día; la petición 11 en un minuto se rechaza con un mensaje de Mika.
- [ ] **H17 · Reglas del muro** — palabra que no vale con reintento (tope x5), palabra repetida en la partida, muro en blanco (0 seguidores).
- [ ] **H18 · Calibración** — informe con ~50 palabras de prueba y sus combos, ajustado con el usuario.
  - Preguntar antes: ¿se siente justa la evaluación? Qué casos ajustar.

## Fase 3 — Bucle de juego jugable
Meta: partida de 6 muros jugable de principio a fin, sin arte ("demo fea").

- [ ] **H19 · Estado de la partida** — 6 muros aleatorios sin repetir y seguidores acumulados, con tests.
- [ ] **H20 · Pantalla de muro** — tarjeta con el tema, campo de texto y cuenta atrás de 25 s (15 s en el reintento).
- [ ] **H21 · Resultado del muro** — combo, seguidores y comentario de Mika en texto plano.
- [ ] **H22 · Pantalla final** — las 6 palabras con sus combos, seguidores, rango y texto para compartir con botón de copiar.
- [ ] **H23 · Pantalla de inicio** — botón de empezar; la partida completa se juega en el navegador.
  - Preguntar antes: textos de la portada.

## Fase 4 — Identidad visual
Meta: la demo se ve como Graffímetro (barrio en pixel art, atardecer pastel, Mika animada, piezas en 7 estilos).

- [ ] **H24 · Base visual** — fuente de interfaz, paleta atardecer pastel como variables y fondo del barrio.
  - Preguntar antes: elegir fuente pixel redondeada entre 2-3 opciones.
- [ ] **H25 · Tarjeta del muro** — tarjeta del tema con stickers y cinta, e inclinación 3D.
  - Preguntar antes: elegir entre 2-3 bocetos.
- [ ] **H26 · Seguidores que suben** — la cifra cuenta hacia arriba y rebota al detenerse.
- [ ] **H27 · Sprite de Mika** — pixel art (sudadera, gorro, auriculares, tabla con stickers) en reposo.
  - Preguntar antes: elegir entre 2-3 propuestas.
- [ ] **H28 · Animaciones de Mika** — balanceo en la tabla, agitar la lata, vergüenza ajena, salto de alegría, boca abierta.
- [ ] **H29 · Piezas de graffiti** — la palabra se pinta trazo a trazo en los 7 estilos (tag → obra maestra).
  - Preguntar antes: elegir estilo de letras con 2-3 niveles de muestra.
- [ ] **H30 · Efectos x1–x4** — PixiJS: goteo, nube de spray, destellos, corazones.
- [ ] **H31 · Efectos x5–x7** — chispas, resplandor, sacudidas, vecinos, obra maestra con flashes y aplausos.
- [ ] **H32 · Imagen del muro** — el mural final con las 6 piezas se genera como imagen para compartir.
- [ ] **H33 · Móvil** — todo jugable y legible en móvil, con el teclado abierto.

## Fase 5 — Sonido
Meta: cada combo suena con spray y power stab a tempo, y la música breakbeat crece con la rareza.

- [ ] **H34 · Sistema de audio** — Tone.js, reloj de tempo común y botón de silencio que se recuerda.
- [ ] **H35 · Spray + power stab** — "psssht" + stab propio sintetizado, escala mayor Do→Si, cuadrados con el tempo.
  - Preguntar antes: elegir entre 2-3 variantes de stab escuchándolas.
- [ ] **H36 · Música base** — pista original de breakbeat jungle (~170 BPM) con pads soñadores, en capas separadas.
  - Preguntar antes: elegir entre 2-3 bocetos de pista.
- [ ] **H37 · Música adaptativa** — las capas entran con cada combo y el x7 dispara el drop.
- [ ] **H38 · Ambiente** — ruedas de skate, pájaros al atardecer, murmullo de barrio.

## Fase 6 — Cierre de la demo
Meta: demo local probada, pulida y marcada como v0.1.

- [ ] **H39 · Prueba y pulido** — partidas de prueba completas, lista de errores, críticos corregidos.
  - Preguntar antes: qué errores o ajustes entran antes de cerrar.
- [ ] **H40 · Demo 0.1** — etiqueta `v0.1` en GitHub e instrucciones de arranque en el README.

---

## Fases futuras (se desglosan en hitos al cerrar la demo)

- [ ] **Fase 7 · Modo infinito** — latas de spray (5 al empezar, devolución por combo), "Se acabó la pintura por hoy", pantalla final. Preguntar: formato de compartir del infinito.
- [ ] **Fase 8 · Publicación** — Postgres en la nube, Vercel, licencias de fuente y audio comprobadas, límites para tráfico real. Preguntar: dominio; pasar a Claude Haiku de pago.
- [ ] **Fase 9 · Arte y música finales** — sprites definitivos, más estilos de piezas, banda sonora completa. Preguntar: artista o productor propio o encargado.
- [ ] **Fase 10 · Ampliaciones** — Muro del día, rankings, más catálogo. Preguntar: prioridad.

---

## Registro de rondas
<!-- Una línea por ronda: fecha · hito · qué se hizo · estado resultante -->
- 2026-10-15 · — · Cambio de concepto: La Puja → Graffímetro. Hoja de ruta rehecha (40 hitos). · Sin hitos empezados
- 2026-10-15 · H01 · Node.js v24.20.0 y npm 11.19.0 instalados y comprobados. Sin commit: Git llega en H03. · Completado
- 2026-10-15 · H02 · Claves de Groq y Gemini en `.env.local`, llamadas de prueba OK con los dos modelos, límites reales anotados. Sin commit: Git llega en H03. · Completado
- 2026-10-15 · H03 · Repo `graffimetro` público en GitHub; `.gitignore` (claves excluidas) y `.gitattributes` (LF). Primer commit incluye H01-H03. · Completado
- 2026-10-15 · H04 · Next.js 16.4.1 + React 19.3 + Tailwind 4 (src/, App Router, TypeScript). Página "Graffímetro" en localhost:3000 sin errores; `tsc` OK. Nota para H05: 5 alertas "high" de npm audit en la cadena de ESLint (braces), solo de desarrollo; no aplicar `audit fix --force` (baja eslint-config-next a v14). · Completado
