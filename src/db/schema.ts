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

/** Un lote puede ser una categoría cerrada ("Un animal") o una consigna abierta. */
export const tipoLote = pgEnum("tipo_lote", ["cerrado", "abierto"]);

/** Qué IA hizo la tasación. */
export const proveedorIa = pgEnum("proveedor_ia", ["groq", "gemini"]);

/** Catálogo de lotes (cada consigna que Bartolo saca a subasta). */
export const lotes = pgTable(
  "lotes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    texto: text().notNull(),
    /** Etiqueta corta para el texto de compartir, por ejemplo "Instrumentos". */
    nombreCorto: text("nombre_corto").notNull(),
    tipo: tipoLote().notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lotes_texto_unico").on(t.texto)],
);

/**
 * Caché de la opinión de la IA: una tasación por lote y palabra normalizada.
 * No guarda martillazos ni precio, porque dependen también de los datos de jugadores
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

/** Cada oferta jugada (incluidos reintentos y lotes sin oferta), con su resultado. */
export const ofertas = pgTable(
  "ofertas",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    partidaId: uuid("partida_id").notNull(),
    loteId: integer("lote_id")
      .notNull()
      .references(() => lotes.id, { onDelete: "cascade" }),
    /** Lo que escribió el jugador tal cual. Nulo si no hubo oferta. */
    textoEscrito: text("texto_escrito"),
    palabraNormalizada: text("palabra_normalizada"),
    tasacionId: integer("tasacion_id").references(() => tasaciones.id, {
      onDelete: "set null",
    }),
    esReintento: boolean("es_reintento").notNull().default(false),
    /** Resultado calculado al jugar. Nota y martillazos son nulos si no hubo oferta válida. */
    nota: smallint(),
    martillazos: smallint(),
    /** Precio de martillo en centavos ($0,05 = 5; máximo $2.500.000 = 250.000.000). */
    precioCentavos: integer("precio_centavos").notNull().default(0),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ofertas_partida_idx").on(t.partidaId),
    index("ofertas_lote_idx").on(t.loteId),
    check("ofertas_nota_rango", sql`${t.nota} is null or ${t.nota} between 0 and 100`),
    check(
      "ofertas_martillazos_rango",
      sql`${t.martillazos} is null or ${t.martillazos} between 1 and 7`,
    ),
    check("ofertas_precio_positivo", sql`${t.precioCentavos} >= 0`),
  ],
);
