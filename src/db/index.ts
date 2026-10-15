import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("Falta DATABASE_URL en .env.local (ver .env.example).");
}

// Una sola conexión compartida. En desarrollo, Next recarga los módulos a menudo,
// así que se guarda en globalThis para no abrir una conexión nueva en cada recarga.
const globalParaDb = globalThis as unknown as { conexionPg?: postgres.Sql };
const conexion = globalParaDb.conexionPg ?? postgres(url);
if (process.env.NODE_ENV !== "production") globalParaDb.conexionPg = conexion;

/** Cliente de Drizzle para usar solo en el servidor. */
export const db = drizzle(conexion, { schema });
