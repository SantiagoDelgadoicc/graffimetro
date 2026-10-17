# La Puja — Hoja de ruta (fuente de verdad del estado)

Estados: `[ ]` Pendiente · `[~]` A medias · `[x]` Completado

Este archivo es la **fuente de verdad** del avance. El documento compartido
(https://claude.ai/code/artifact/6f6ab045-a3dd-41ce-a3d2-9906697744ec) se actualiza al cerrar cada hito.

"Preguntar antes" = decisiones que Claude debe consultar con preguntas de selección **antes** de empezar el hito.

---

## Fase 0 — Preparación del entorno

Meta: el proyecto vacío arranca en el navegador, está en GitHub y tiene Postgres conectado.

- [x] **H01 · Node.js** — `node -v` y `npm -v` responden. _(Lo instala el usuario.)_
- [x] **H02 · Claves de IA** — `.env.local` con las claves de Groq y Gemini; límites reales anotados en este archivo. _(Las crea el usuario.)_
  - Groq `openai/gpt-oss-120b`: 1.000 peticiones/día, 8.000 tokens/min (cabeceras de la API, 2026-10-15).
  - Gemini `gemini-3.5-flash-lite` (modelo fijado, no el alias `-latest`): 15 peticiones/min, 250.000 tokens/min, 500 peticiones/día (panel de AI Studio, 2026-10-15). La cuota es del proyecto "Default Gemini Project", compartida con otros usos.
- [x] **H03 · Git y GitHub** — repositorio local con `.gitignore` y primer commit subido a GitHub.
  - Preguntar antes: nombre del repositorio; privado o público. → Público. Nació como `graffimetro` y el 2026-10-16 se renombró a `la-puja`: https://github.com/SantiagoDelgadoicc/la-puja
- [x] **H04 · Proyecto Next.js** — página en blanco funcionando en `localhost`.
  - Preguntar antes: estilos con Tailwind o con CSS Modules. → Tailwind CSS 4.
- [x] **H05 · Herramientas de calidad** — ESLint, Prettier y Vitest, con un test de ejemplo en verde.
- [x] **H06 · Postgres en Docker** — contenedor arriba y conexión comprobada desde Drizzle.

## Fase 1 — Datos y catálogo

Meta: la base de datos tiene sus tablas y los 100 lotes validados están cargados.

- [x] **H07 · Esquema de base de datos** — tablas `lotes`, `tasaciones` y `ofertas` creadas por migración.
- [x] **H08 · Catálogo de 100 lotes** — documento con 60 cerrados y 40 abiertos, con nombre corto, validado por el usuario.
  - Preguntar antes: temas obligatorios; temas prohibidos; nivel de dificultad. → Obligatorios: vida cotidiana, cultura urbana y Y2K, naturaleza y ciencia, cultura pop y ocio. Prohibidos: política y religión, contenido sexual o violento. Dificultad: ~50% fáciles, 35% medios, 15% difíciles.
  - Documento: https://claude.ai/code/artifact/5501aa23-1c68-496d-afec-2d0788dd0943 · Datos: `data/lotes.json`.
- [x] **H09 · Carga del catálogo** — script de semilla que carga los 100 lotes; una consulta de prueba devuelve 100.
  - Preguntar antes: `lotes` no tiene columnas de tema ni dificultad; ¿se añaden (migración) o se quedan solo en el JSON? → Se añaden. La semilla actualiza sin duplicar (clave: número del catálogo).

## Fase 2 — Motor de tasación

Meta: una oferta enviada a la API vuelve tasada (nota, martillazos, precio, comentario de Bartolo), cacheada y registrada, todavía sin interfaz.

- [ ] **H10 · Normalización básica** — función que unifica mayúsculas, espacios y tildes, con tests.
- [ ] **H11 · Prompt de tasación** — prompt + esquema `zod` (válida, forma canónica, rareza, ingenio, comentario) y guía de estilo de Bartolo.
  - Preguntar antes: ejemplos de calibración (palabras que valen 1, 4 y 7 martillazos para el usuario); cómo puntuar la palabra que da el ejemplo del lote ("como el ollie").
- [ ] **H12 · Conexión con Groq** — tasación real con `openai/gpt-oss-120b` desde un script.
- [ ] **H13 · Respaldo con Gemini** — si Groq falla por límite, responde Gemini Flash-Lite; test que simula el fallo.
- [ ] **H14 · Fórmula de precio** — nota 0-100 → martillazos 1-7 → precio de martillo logarítmico ($0,05 – $2.500.000, en centavos); pesos 80/20 (cerrados) y 40/60 (abiertos); transición a datos de jugadores (50 → 500 ofertas); tests.
  - Preguntar antes: tramos de nota de cada martillazo.
- [ ] **H15 · API de tasación con caché** — `/api/tasar` devuelve la tasación; la segunda vez sale de la caché y la oferta queda registrada.
- [ ] **H16 · Límite de peticiones** — por IP, 10/min y 300/día; la petición 11 en un minuto se rechaza con un mensaje de Bartolo.
- [ ] **H17 · Reglas del lote** — mercancía falsa con reintento (tope 5 martillazos), "eso ya se vendió" (palabra repetida), sin oferta ($0).
- [ ] **H18 · Calibración** — informe con ~50 ofertas de prueba y sus martillazos, ajustado con el usuario.
  - Preguntar antes: ¿se siente justa la tasación? Qué casos ajustar.

## Fase 3 — Bucle de juego jugable

Meta: partida de 6 lotes jugable de principio a fin, sin arte ("demo fea").

- [ ] **H19 · Estado de la partida** — 6 lotes aleatorios sin repetir y fortuna acumulada, con tests.
- [ ] **H20 · Pantalla del lote** — carta con la consigna, campo de texto y cuenta atrás de 25 s (15 s en el reintento).
- [ ] **H21 · Resultado del lote** — martillazos, precio de martillo y comentario de Bartolo en texto plano.
- [ ] **H22 · Pantalla final** — las 6 ofertas con sus martillazos, fortuna, rango de Pillo y texto para compartir (🔨 por golpe) con botón de copiar.
- [ ] **H23 · Pantalla de inicio** — botón de empezar; la partida completa se juega en el navegador.
  - Preguntar antes: textos de la portada.

## Fase 4 — Identidad visual

Meta: la demo se ve como La Puja (pixel art de billete antiguo, cartas de propiedad, Bartolo animado, martillazos con efectos).

- [ ] **H24 · Base visual** — tipografía pixel con remates, paleta de billete antiguo como variables y fondo de la sala de subastas.
  - Preguntar antes: elegir tipografía entre 2-3 opciones.
- [ ] **H25 · Carta del lote** — carta tipo título de propiedad con orla guilloché, número de serie e inclinación 3D.
  - Preguntar antes: elegir entre 2-3 bocetos.
- [ ] **H26 · Cifra que sube** — el precio cuenta hacia arriba y rebota al detenerse.
- [ ] **H27 · Sprite de Bartolo** — pixel art (chistera, frac, bigote manubrio café, barriga) en reposo.
  - Preguntar antes: elegir entre 2-3 propuestas.
- [ ] **H28 · Animaciones de Bartolo** — atusarse el bigote, levantar la chistera, bigote encrespado, risa de panza, boquiabierto.
- [ ] **H29 · El martillo** — el mazo baja de 1 a 7 veces, a ritmo, con sello de lacre "VENDIDO".
- [ ] **H30 · Efectos 1-4** — PixiJS: moneda de cobre, tintineo, sello de lacre, paletas numeradas y lluvia ligera de monedas.
- [ ] **H31 · Efectos 5-7** — chorro de oro, lluvia de billetes, chistera que cae, martillo que se parte y vuela contra la pantalla.
- [ ] **H32 · Pantalla final con estilo** — fortuna, rango de Pillo y resumen de los 6 lotes con sellos y orlas.
- [ ] **H33 · Móvil** — todo jugable y legible en móvil, con el teclado abierto.

## Fase 5 — Sonido

Meta: cada martillazo suena con mazo y power stab a tempo, y el ragtime de salón crece con la subasta.

- [ ] **H34 · Sistema de audio** — Tone.js, reloj de tempo común y botón de silencio que se recuerda.
- [ ] **H35 · Mazo + power stab** — golpe de madera + stab propio sintetizado, escala mayor Do→Si, cuadrados con el tempo; el 7 añade el crujido del martillo.
  - Preguntar antes: elegir entre 2-3 variantes de stab escuchándolas.
- [ ] **H36 · Música base** — ragtime de salón original (piano stride) en capas separadas: piano, contrabajo, batería de escobillas, metales.
  - Preguntar antes: elegir entre 2-3 bocetos de pista.
- [ ] **H37 · Música adaptativa** — las capas y la velocidad suben con los martillazos; con 7 entra la banda completa.
- [ ] **H38 · Monedas y ambiente** — monedas y billetes realistas con brillo, tic-tic de caja registradora antigua y murmullo de sala de subastas.

## Fase 6 — Cierre de la demo

Meta: demo local probada, pulida y marcada como v0.1.

- [ ] **H39 · Prueba y pulido** — partidas de prueba completas, lista de errores, críticos corregidos.
  - Preguntar antes: qué errores o ajustes entran antes de cerrar.
- [ ] **H40 · Demo 0.1** — etiqueta `v0.1` en GitHub e instrucciones de arranque en el README.

---

## Fases futuras (se desglosan en hitos al cerrar la demo)

- [ ] **Fase 7 · Modo infinito** — comisión de Bartolo que sube cada 3 lotes, "¡Fuera de mi estrado, pillo!", pantalla final. Preguntar: formato de compartir del infinito.
- [ ] **Fase 8 · Publicación** — Postgres en la nube, Vercel, licencias de fuente y audio comprobadas, límites para tráfico real. Preguntar: dominio; pasar a Claude Haiku de pago.
- [ ] **Fase 9 · Arte y música finales** — sprites definitivos, más efectos, banda sonora completa. Preguntar: artista o productor propio o encargado.
- [ ] **Fase 10 · Ampliaciones** — Subasta del día, rankings, más catálogo. Preguntar: prioridad.

---

## Registro de rondas

<!-- Una línea por ronda: fecha · hito · qué se hizo · estado resultante -->

- 2026-10-15 · — · Cambio de concepto: La Puja → Graffímetro. Hoja de ruta rehecha (40 hitos). · Sin hitos empezados
- 2026-10-15 · H01 · Node.js v24.20.0 y npm 11.19.0 instalados y comprobados. Sin commit: Git llega en H03. · Completado
- 2026-10-15 · H02 · Claves de Groq y Gemini en `.env.local`, llamadas de prueba OK con los dos modelos, límites reales anotados. Sin commit: Git llega en H03. · Completado
- 2026-10-15 · H03 · Repo `graffimetro` público en GitHub; `.gitignore` (claves excluidas) y `.gitattributes` (LF). Primer commit incluye H01-H03. · Completado
- 2026-10-15 · H04 · Next.js 16.4.1 + React 19.3 + Tailwind 4 (src/, App Router, TypeScript). Página "Graffímetro" en localhost:3000 sin errores; `tsc` OK. Nota para H05: 5 alertas "high" de npm audit en la cadena de ESLint (braces), solo de desarrollo; no aplicar `audit fix --force` (baja eslint-config-next a v14). · Completado
- 2026-10-15 · H05 · Prettier 3.9 (+ eslint-config-prettier), Vitest 5 con alias `@/`, scripts `check`/`typecheck`/`lint`/`format`/`test`. `@types/node` subido a ^24 (alineado con Node 24; lo pedía Vitest). `npm run check` en verde, 2 tests. Audit: 0 vulnerabilidades en producción; las 5 de ESLint son solo de desarrollo y sin arreglo disponible. · Completado
- 2026-10-15 · H06 · Postgres 18.6 (`postgres:18-alpine`) en Docker, solo en 127.0.0.1:5432, con volumen persistente y healthcheck. Drizzle ORM 0.45 + driver `postgres` 3.4 + drizzle-kit 0.31. Cliente en `src/db/index.ts`; `npm run db:check` conecta OK. `.env.example` creado. `npm run check` en verde. · Completado
- 2026-10-15 · H07 · Esquema Drizzle (`src/db/schema.ts`): `lotes`, `tasaciones` (caché solo con la opinión de la IA, única por muro + palabra normalizada) y `ofertas` (resultado calculado al jugar: nota, combo, seguidores). Enums `tipo_muro` y `proveedor_ia`, checks de rango e índices. Migración `0000_esquema_inicial` aplicada; restricciones probadas en una transacción revertida. Decisión del usuario: caché = IA, jugada = resultado (doc técnico actualizado). · Completado
- 2026-10-15 · H08 · Catálogo de 100 muros (60 cerrados, 40 abiertos; 25 por tema; 50/35/15 de dificultad), reescrito con "ganchos" al estilo Krillion (restricción, contenedor, pista, nicho, exclusión) y validado por el usuario. Marcas y obras conocidas permitidas. Guardado en `data/muros.json` (100 textos únicos, comprobado). `npm run check` en verde. · Completado
- 2026-10-16 · — · Separación en dos juegos: este proyecto vuelve a ser **La Puja** (ficha reactivada; sonido revisado: se mantiene el power stab con el mazo, música de ragtime de salón adaptativo, monedas realistas con brillo). Mika, su música y su estética pasan a un juego de Steam aparte (traspaso: https://claude.ai/code/artifact/da6d406b-f3cf-45b9-879f-30c4bc47de3f). Código adaptado: niveles de martillazos, `ofertas.martillazos` y `precio_centavos`, enum `tipo_lote`, migración inicial regenerada (no había datos), base `lapuja` en el contenedor `la-puja-db`, `data/lotes.json`, repo renombrado a `la-puja`. Fases 2-5 y futuras reescritas para La Puja. · Siguiente: H09
- 2026-10-16 · H09 · Columnas `numero` (única), `tema` y `dificultad` en `lotes` (migración `0001_lotes_tema_dificultad`). Validador `src/db/catalogo.ts` con 7 tests (incluido el reparto del catálogo real). `npm run db:seed` hace upsert por número: tres ejecuciones dejan 100 lotes, sin duplicados. `"type": "module"` en package.json e imports `.ts` explícitos para los scripts de Node; build de Next, drizzle-kit y Vitest comprobados. · Completado
