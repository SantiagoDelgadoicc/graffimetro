// Carga el catálogo de lotes (data/lotes.json) en la base de datos.
// Uso: npm run db:seed   (necesita el contenedor arriba y las migraciones aplicadas)
// Se puede ejecutar las veces que haga falta: cada lote se identifica por su número,
// así que si ya existe se actualiza y si no, se crea. Nunca duplica.
import { readFile } from "node:fs/promises";
import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { contarPor, validarCatalogo } from "../src/db/catalogo.ts";
import { lotes } from "../src/db/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local (ver .env.example).");
  process.exit(1);
}

const catalogo = validarCatalogo(
  JSON.parse(await readFile(new URL("../data/lotes.json", import.meta.url), "utf8")),
);
console.log(`Catálogo válido: ${catalogo.length} lotes.`);

const conexion = postgres(url, { max: 1, connect_timeout: 5 });
const db = drizzle(conexion);

try {
  await db
    .insert(lotes)
    .values(catalogo)
    .onConflictDoUpdate({
      target: lotes.numero,
      set: {
        texto: sql`excluded.texto`,
        nombreCorto: sql`excluded.nombre_corto`,
        tipo: sql`excluded.tipo`,
        tema: sql`excluded.tema`,
        dificultad: sql`excluded.dificultad`,
      },
    });

  const [{ total }] = await db.select({ total: count() }).from(lotes);
  const enBase = await db
    .select({ tipo: lotes.tipo, tema: lotes.tema, dificultad: lotes.dificultad })
    .from(lotes);
  console.log(`Lotes en la base: ${total}`);
  console.log("Por tipo:", contarPor(enBase as typeof catalogo, "tipo"));
  console.log("Por tema:", contarPor(enBase as typeof catalogo, "tema"));
  console.log("Por dificultad:", contarPor(enBase as typeof catalogo, "dificultad"));
} catch (error) {
  console.error("No se pudo cargar el catálogo. ¿Está arrancado el contenedor? (npm run db:up)");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await conexion.end();
}
