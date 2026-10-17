// Contrato de la API /api/tasar: qué recibe y qué devuelve (sin base de datos ni IA).
import { z } from "zod";
import { nombreDelNivel, type Martillazos } from "../lib/juego.ts";
import { formatearPrecio, precioDeOferta, type TipoLote } from "../lib/precio.ts";
import type { Tasacion } from "./esquema.ts";

/** Largo máximo de una oferta: da para una frase corta en los lotes abiertos. */
export const LARGO_MAXIMO_OFERTA = 80;

export const esquemaPeticion = z.object({
  /** Número del lote en el catálogo (data/lotes.json). */
  lote: z.number().int().positive(),
  oferta: z.string().max(LARGO_MAXIMO_OFERTA),
  partidaId: z.uuid(),
  esReintento: z.boolean().default(false),
});

export type PeticionTasacion = z.infer<typeof esquemaPeticion>;

export type RespuestaTasacion = {
  lote: number;
  /** La oferta normalizada, tal como se cacheó. */
  oferta: string;
  valida: boolean;
  formaCanonica: string | null;
  nota: number | null;
  martillazos: Martillazos | null;
  nivel: string | null;
  precioCentavos: number;
  precio: string;
  comentario: string;
  /** true si la tasación salió de la caché, sin llamar a la IA. */
  deCache: boolean;
};

/**
 * Convierte la opinión de la IA en el resultado del juego. La mercancía falsa vale $0
 * y no lleva nota ni martillazos.
 */
export function armarRespuesta({
  lote,
  tipo,
  oferta,
  tasacion,
  datosJugadores,
  deCache,
}: {
  lote: number;
  tipo: TipoLote;
  oferta: string;
  tasacion: Pick<Tasacion, "valida" | "formaCanonica" | "rareza" | "ingenio" | "comentario">;
  datosJugadores?: { veces: number; total: number };
  deCache: boolean;
}): RespuestaTasacion {
  const base = {
    lote,
    oferta,
    valida: tasacion.valida,
    formaCanonica: tasacion.formaCanonica,
    comentario: tasacion.comentario,
    deCache,
  };
  if (!tasacion.valida) {
    return {
      ...base,
      nota: null,
      martillazos: null,
      nivel: null,
      precioCentavos: 0,
      precio: formatearPrecio(0),
    };
  }
  const { nota, martillazos, precioCentavos } = precioDeOferta({
    tipo,
    rarezaIa: tasacion.rareza,
    ingenio: tasacion.ingenio,
    datosJugadores,
  });
  return {
    ...base,
    nota,
    martillazos,
    nivel: nombreDelNivel(martillazos),
    precioCentavos,
    precio: formatearPrecio(precioCentavos),
  };
}
