# Graffímetro — Instrucciones para Claude

Juego web en español. Mika, una skater, propone un tema ("muro"). El jugador escribe una palabra, que se pinta como graffiti en un muro de la ciudad. Cuanto más rara o ingeniosa sea, más alto sube el graffímetro (x1–x7) y más seguidores gana. Lema: "Tu palabra, tu pieza.". (Antes se llamaba "La Puja"; ese concepto está archivado.)

## Documentos de referencia

Son la fuente de verdad del diseño. Consúltalos ante cualquier duda antes de inventar nada.

| Documento                                                                                          | Contenido                                                                             |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Ficha de identidad](https://claude.ai/code/artifact/a02b8e71-f70c-4577-a2cb-16edae01f250)         | Concepto, mecánica, reglas, graffímetro, Mika, vocabulario, estética, sonido y música |
| [Decisiones técnicas](https://claude.ai/code/artifact/f8d56113-368d-4411-b196-54c0e330f7e2)        | Stack, arquitectura, dependencias, modelo de datos y alcance de la demo               |
| [Hoja de ruta](https://claude.ai/code/artifact/6f6ab045-a3dd-41ce-a3d2-9906697744ec)               | Fases e hitos (vista compartible)                                                     |
| `ROADMAP.md`                                                                                       | Estado de cada hito: **fuente de verdad del avance**                                  |
| [Ficha archivada de La Puja](https://claude.ai/code/artifact/62430798-9f33-4d9d-b22b-738ebda18d63) | Solo como referencia histórica; no se usa para diseñar                                |

Los documentos de Claude se leen y editan con las herramientas del conector de documentos, nunca con fetch. Si en una sesión no está ese conector, basta con `ROADMAP.md` para trabajar; en ese caso, avisa al usuario de que el documento compartido no se ha actualizado.

## Protocolo de cada ronda de desarrollo

Se sigue siempre, en este orden:

1. **Lee `ROADMAP.md`** y localiza el hito activo: el primer `[~]` (a medias) o, si no hay ninguno, el primer `[ ]` (pendiente). Dile al usuario qué hito toca y en qué estado está.
2. **Pregunta antes de empezar** si el hito tiene "Preguntar antes" o si surge una decisión que los documentos no cierran. Usa preguntas de selección (AskUserQuestion), con la opción recomendada en primer lugar y marcada como "(Recomendado)". No empieces a construir hasta tener las respuestas.
3. **Marca el hito `[~]`** en `ROADMAP.md` y desarróllalo. Trabaja solo en ese hito; lo que quede fuera de su alcance se anota como nota, no se hace.
4. **Comprueba el entregable** del hito (tests, compilación o prueba en el navegador) y enséñaselo al usuario. Un hito nunca se marca como completado sin haber comprobado su entregable.
5. **Cierra el hito** solo con el visto bueno del usuario:
   - Márcalo `[x]` en `ROADMAP.md` y añade una línea en "Registro de rondas".
   - Haz un commit con el mensaje `H<nn>: <nombre del hito>` y súbelo a GitHub (`git push`).
   - Cambia su estado a "Completado" en el documento de la hoja de ruta.
6. Si la ronda termina sin acabar el hito, déjalo en `[~]` y anota en el registro qué falta.

Si una decisión nueva cambia el diseño, actualiza también la ficha o el documento técnico correspondiente, para que nunca contradigan al código.

## Decisiones clave (resumen; el detalle está en los documentos)

- **Stack:** TypeScript, Next.js (App Router), React + PixiJS, `motion`, Tone.js (música adaptativa y combos a tempo), `howler` (efectos sueltos), Postgres en Docker + Drizzle y Vitest.
- **IA:** AI SDK de Vercel. El modelo principal es Groq `openai/gpt-oss-120b`; Gemini Flash-Lite hace de respaldo cuando Groq da error de límite. Todo en capas gratuitas.
- **Demo:** solo en local, con la partida de 6 muros. Coste: $0.
- **Evaluación:**
  - Validez + rareza + ingenio dan una nota de 0 a 100, que se convierte en un combo (x1 Tag, x2 Throw-up, x3 Bubble, x4 Pieza, x5 Wildstyle, x6 Burner, x7 ¡Obra maestra!) y en seguidores con escala logarítmica.
  - Pesos: 80/20 en los muros cerrados y 40/60 en los abiertos.
  - La IA devuelve la forma canónica de la palabra y el comentario de Mika en la misma llamada.
  - La caché se guarda por muro y palabra normalizada.
- **Reglas:**
  - Cuenta atrás de 25 s (15 s en el reintento).
  - Si la palabra no vale, hay un reintento con un tope de x5.
  - Una palabra repetida en la partida cuenta como palabra que no vale.
  - Un muro en blanco da 0 seguidores.
- **Límite:** 10 peticiones por minuto y 300 al día por IP.
- **Nombres internos:** la tabla de muros se llama `lotes` en la base de datos.

## Next.js 16

El proyecto usa **Next.js 16.4** (App Router, Turbopack, `cacheComponents`), React 19 y Tailwind CSS 4. Esta versión trae cambios importantes respecto a versiones anteriores. Antes de escribir código de Next, lee `AGENTS.md` y la guía correspondiente en `node_modules/next/dist/docs/`.

- Arrancar en desarrollo: `npm run dev` (http://localhost:3000). También está la configuración `graffimetro-dev` en `.claude/launch.json`.
- **Comprobación completa:** `npm run check` (tipos + ESLint + formato de Prettier + tests de Vitest). Tiene que pasar en verde antes de cerrar cualquier hito.
- Por separado: `npm run typecheck`, `npm run lint`, `npm run format` (aplica el formato) y `npm test`.
- Los tests van junto al código, como `src/**/*.test.ts`. El alias `@/` apunta a `src/`.
- `npm audit` marca 5 alertas "high" en la cadena de ESLint (`braces`). Son solo de desarrollo; las dependencias de producción tienen 0 vulnerabilidades. No apliques `npm audit fix --force`, porque baja eslint-config-next a la v14 y la rompe.

## Convenciones

- Todo el texto del juego va en **español neutro panhispano**, con la voz de Mika (amiga cozy con sorna, que llama "crew" al jugador) y el vocabulario de la ficha: muro, pieza, combo, seguidores, crew.
- Paleta atardecer pastel como variables CSS: `#B8A4D9`, `#F6B89A`, `#9ED9C3`, `#F7E3A1`, `#F27BAA`, `#2D2A5A`.
- Estética: pixel art hi-bit, revival Y2K urbano de skate y graffiti, colorido y cozy.
- Sonido: breakbeat jungle/DnB con pads soñadores, inspirado en PinkPantheress. Cada combo suena con spray y un power stab propio, a tempo y en escala mayor.
- Las claves de API viven solo en `.env.local` (nunca en Git ni en el navegador). Las llamadas a la IA se hacen solo en el servidor.
- No uses recursos con derechos de terceros: sonidos, muestras, fuentes y música tienen que ser propios o con licencia libre comprobada. Nunca uses muestras de PinkPantheress, de Jet Set Radio ni de librerías comerciales como Zero-G.
- Si en fases futuras se trabaja con la API de Claude, consulta los modelos y precios actuales en lugar de fiarte de la memoria.

## Comunicación con el usuario

- Responde en español.
- Las decisiones se consultan con preguntas de selección; las explicaciones, breves y en lenguaje claro.
