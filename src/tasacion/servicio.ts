// Servicio de tasación del juego: caché en Postgres + IA + registro de cada oferta.
// Solo para el servidor (usa la base de datos y las claves de la IA).
import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { lotes, ofertas, tasaciones } from "@/db/schema";
import { normalizarOferta } from "@/lib/normalizar";
import { armarRespuesta, type PeticionTasacion, type RespuestaTasacion } from "./peticion";
import { tasar } from "./tasar";

export class LoteInexistente extends Error {}
export class OfertaVacia extends Error {}

/** Busca la tasación en la caché o, si no está, la pide a la IA y la guarda. */
async function tasacionCacheada(lote: typeof lotes.$inferSelect, oferta: string) {
  const enCache = await db.query.tasaciones.findFirst({
    where: and(eq(tasaciones.loteId, lote.id), eq(tasaciones.palabraNormalizada, oferta)),
  });
  if (enCache) return { fila: enCache, deCache: true };

  const { tasacion, proveedor, modelo, motivoRespaldo } = await tasar(lote, oferta);
  if (motivoRespaldo) console.info(`[tasar] respondió ${proveedor} (motivo: ${motivoRespaldo})`);

  // Si otra petición guardó la misma oferta mientras tanto, gana la que ya estaba.
  await db
    .insert(tasaciones)
    .values({
      loteId: lote.id,
      palabraNormalizada: oferta,
      valida: tasacion.valida,
      formaCanonica: tasacion.formaCanonica,
      rarezaIa: tasacion.rareza,
      ingenioIa: tasacion.ingenio,
      comentario: tasacion.comentario,
      proveedor,
      modelo,
    })
    .onConflictDoNothing();
  const fila = await db.query.tasaciones.findFirst({
    where: and(eq(tasaciones.loteId, lote.id), eq(tasaciones.palabraNormalizada, oferta)),
  });
  if (!fila) throw new Error("La tasación recién guardada no aparece en la base.");
  return { fila, deCache: false };
}

/** Cuántas ofertas válidas tiene el lote y cuántas tienen esta forma canónica (incluida esta). */
async function datosDeJugadores(loteId: number, formaCanonica: string) {
  const delLote = and(eq(ofertas.loteId, loteId), eq(tasaciones.valida, true));
  const contar = (filtro: typeof delLote) =>
    db
      .select({ n: count() })
      .from(ofertas)
      .innerJoin(tasaciones, eq(ofertas.tasacionId, tasaciones.id))
      .where(filtro);
  const [[{ n: total }], [{ n: veces }]] = await Promise.all([
    contar(delLote),
    contar(and(delLote, eq(tasaciones.formaCanonica, formaCanonica))),
  ]);
  return { veces: veces + 1, total: total + 1 };
}

/** Tasa una oferta de una partida y la deja registrada. */
export async function tasarOferta(peticion: PeticionTasacion): Promise<RespuestaTasacion> {
  const lote = await db.query.lotes.findFirst({ where: eq(lotes.numero, peticion.lote) });
  if (!lote) throw new LoteInexistente(`No existe el lote ${peticion.lote}.`);

  const oferta = normalizarOferta(peticion.oferta);
  if (!oferta) throw new OfertaVacia("La oferta está vacía.");

  const { fila, deCache } = await tasacionCacheada(lote, oferta);
  const datosJugadores =
    fila.valida && fila.formaCanonica
      ? await datosDeJugadores(lote.id, fila.formaCanonica)
      : undefined;

  const respuesta = armarRespuesta({
    lote: lote.numero,
    tipo: lote.tipo,
    oferta,
    tasacion: {
      valida: fila.valida,
      formaCanonica: fila.formaCanonica,
      rareza: fila.rarezaIa,
      ingenio: fila.ingenioIa,
      comentario: fila.comentario,
    },
    datosJugadores,
    deCache,
  });

  await db.insert(ofertas).values({
    partidaId: peticion.partidaId,
    loteId: lote.id,
    textoEscrito: peticion.oferta,
    palabraNormalizada: oferta,
    tasacionId: fila.id,
    esReintento: peticion.esReintento,
    nota: respuesta.nota,
    martillazos: respuesta.martillazos,
    precioCentavos: respuesta.precioCentavos,
  });

  return respuesta;
}
