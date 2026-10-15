import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Un muro puede ser una categoría cerrada ("Un animal") o una consigna abierta. */
export const tipoMuro = pgEnum("tipo_muro", ["cerrado", "abierto"]);

/** Qué IA hizo la evaluación. */
export const proveedorIa = pgEnum("proveedor_ia", ["groq", "gemini"]);

/** Catálogo de muros (cada tema que propone Mika). */
export const lotes = pgTable(
  "lotes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    texto: text().notNull(),
    /** Etiqueta corta para el texto de compartir, por ejemplo "Instrumentos". */
    nombreCorto: text("nombre_corto").notNull(),
    tipo: tipoMuro().notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lotes_texto_unico").on(t.texto)],
);

/**
 * Caché de la opinión de la IA: una evaluación por muro y palabra normalizada.
 * No guarda combo ni seguidores, porque dependen también de los datos de jugadores
 * y se calculan al jugar (se guardan en `ofertas`).
 */
export const tasaciones = pgTable(
  "tasaciones",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    loteId: integer("lote_id")
      .notNull()
      .references(() => lotes.id, { onDelete: "cascade" }),
    palabraNormalizada: text("palabra_normalizada").notNull(),
    valida: boolean().notNull(),
    /** Forma canónica que devuelve la IA ("perros" → "perro"). Nula si no es válida. */
    formaCanonica: text("forma_canonica"),
    rarezaIa: smallint("rareza_ia").notNull(),
    ingenioIa: smallint("ingenio_ia").notNull(),
    comentario: text().notNull(),
    proveedor: proveedorIa().notNull(),
    modelo: text().notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tasaciones_lote_palabra_unico").on(t.loteId, t.palabraNormalizada),
    index("tasaciones_lote_canonica_idx").on(t.loteId, t.formaCanonica),
    check("tasaciones_rareza_rango", sql`${t.rarezaIa} between 0 and 100`),
    check("tasaciones_ingenio_rango", sql`${t.ingenioIa} between 0 and 100`),
  ],
);

/** Cada palabra jugada (incluidos reintentos y muros en blanco), con su resultado. */
export const ofertas = pgTable(
  "ofertas",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    partidaId: uuid("partida_id").notNull(),
    loteId: integer("lote_id")
      .notNull()
      .references(() => lotes.id, { onDelete: "cascade" }),
    /** Lo que escribió el jugador tal cual. Nulo si el muro quedó en blanco. */
    textoEscrito: text("texto_escrito"),
    palabraNormalizada: text("palabra_normalizada"),
    tasacionId: integer("tasacion_id").references(() => tasaciones.id, {
      onDelete: "set null",
    }),
    esReintento: boolean("es_reintento").notNull().default(false),
    /** Resultado calculado al jugar. Nota y combo son nulos si no hubo palabra válida. */
    nota: smallint(),
    combo: smallint(),
    seguidores: integer().notNull().default(0),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ofertas_partida_idx").on(t.partidaId),
    index("ofertas_lote_idx").on(t.loteId),
    check("ofertas_nota_rango", sql`${t.nota} is null or ${t.nota} between 0 and 100`),
    check("ofertas_combo_rango", sql`${t.combo} is null or ${t.combo} between 1 and 7`),
    check("ofertas_seguidores_positivos", sql`${t.seguidores} >= 0`),
  ],
);
