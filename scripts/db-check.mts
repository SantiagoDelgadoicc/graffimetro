// Comprueba que Drizzle llega a la base de datos local.
// Uso: npm run db:check   (necesita el contenedor arriba: npm run db:up)
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local (ver .env.example).");
  process.exit(1);
}

const conexion = postgres(url, { max: 1, connect_timeout: 5 });
const db = drizzle(conexion);

try {
  const [fila] = await db.execute<{ version: string; base: string }>(
    sql`select version() as version, current_database() as base`,
  );
  console.log(`Conexión OK con la base "${fila.base}"`);
  console.log(fila.version);
} catch (error) {
  console.error("No se pudo conectar. ¿Está arrancado el contenedor? (npm run db:up)");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await conexion.end();
}
