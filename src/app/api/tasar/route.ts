// POST /api/tasar — tasa una oferta: { lote, oferta, partidaId, esReintento? }.
// Los errores llevan un mensaje en la voz de Bartolo para poder mostrarlo tal cual.
import { esquemaPeticion } from "@/tasacion/peticion";
import { LoteInexistente, OfertaVacia, tasarOferta } from "@/tasacion/servicio";

function error(status: number, mensaje: string) {
  return Response.json({ error: mensaje }, { status });
}

export async function POST(request: Request) {
  const cuerpo = await request.json().catch(() => null);
  const peticion = esquemaPeticion.safeParse(cuerpo);
  if (!peticion.success) {
    return error(400, "Esa puja viene mal escrita, campeón: no la entiendo.");
  }

  try {
    return Response.json(await tasarOferta(peticion.data));
  } catch (e) {
    if (e instanceof LoteInexistente) return error(404, "Ese lote no está en mi catálogo.");
    if (e instanceof OfertaVacia) return error(400, "¡Una oferta vacía no se subasta, pillo!");
    console.error("[tasar] fallo al tasar:", e);
    return error(503, "El tasador salió a tomar aire. Vuelva a pujar en un momento.");
  }
}
