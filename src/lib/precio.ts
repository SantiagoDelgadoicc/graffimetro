// Fórmula de precio (H14): rareza e ingenio → nota 0-100 → martillazos 1-7 → precio de martillo.
// Todo el dinero va en centavos enteros ($0,05 = 5; $2.500.000 = 250.000.000).
import type { Martillazos } from "./juego.ts";

export type TipoLote = "cerrado" | "abierto";

/** Cuánto pesa cada dimensión según el tipo de lote. */
export const PESOS: Record<TipoLote, { rareza: number; ingenio: number }> = {
  cerrado: { rareza: 0.8, ingenio: 0.2 },
  abierto: { rareza: 0.4, ingenio: 0.6 },
};

/** Tramos de nota de cada martillazo ("más exigente arriba", decidido en el H14). */
export const TRAMOS_DE_NOTA: Record<Martillazos, { desde: number; hasta: number }> = {
  1: { desde: 0, hasta: 19 },
  2: { desde: 20, hasta: 39 },
  3: { desde: 40, hasta: 54 },
  4: { desde: 55, hasta: 69 },
  5: { desde: 70, hasta: 82 },
  6: { desde: 83, hasta: 93 },
  7: { desde: 94, hasta: 100 },
};

/** Rango de precio de cada martillazo, en centavos (ficha de identidad). */
export const RANGOS_DE_PRECIO: Record<Martillazos, { desde: number; hasta: number }> = {
  1: { desde: 5, hasta: 500 }, // $0,05 – $5
  2: { desde: 500, hasta: 20_000 }, // $5 – $200
  3: { desde: 20_000, hasta: 500_000 }, // $200 – $5.000
  4: { desde: 500_000, hasta: 5_000_000 }, // $5.000 – $50.000
  5: { desde: 5_000_000, hasta: 25_000_000 }, // $50.000 – $250.000
  6: { desde: 25_000_000, hasta: 100_000_000 }, // $250.000 – $1.000.000
  7: { desde: 100_000_000, hasta: 250_000_000 }, // $1.000.000 – $2.500.000
};

const MARTILLAZOS: Martillazos[] = [1, 2, 3, 4, 5, 6, 7];

function acotar(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

/** Ofertas de un lote a partir de las que cuentan los datos de jugadores, y su peso máximo. */
export const TRANSICION_JUGADORES = { desde: 50, hasta: 500, pesoMaximo: 0.5 };

/**
 * Rareza según los jugadores: cuanto menos se repite una forma canónica en el lote, más rara.
 * Escala logarítmica: la única oferta de ese tipo vale 100; si la dieron todos, 0.
 * `veces` incluye la oferta actual; `total` son todas las ofertas válidas del lote.
 */
export function rarezaDeJugadores(veces: number, total: number): number {
  if (total < 2) return 100;
  const v = acotar(veces, 1, total);
  return 100 * (1 - Math.log(v) / Math.log(total));
}

/**
 * Mezcla la rareza de la IA con la de los jugadores. Con menos de 50 ofertas en el lote
 * solo cuenta la IA; de 50 a 500 los jugadores ganan peso hasta el 50 %.
 */
export function rarezaFinal(rarezaIa: number, datos?: { veces: number; total: number }): number {
  if (!datos) return rarezaIa;
  const { desde, hasta, pesoMaximo } = TRANSICION_JUGADORES;
  const peso = pesoMaximo * acotar((datos.total - desde) / (hasta - desde), 0, 1);
  return (1 - peso) * rarezaIa + peso * rarezaDeJugadores(datos.veces, datos.total);
}

/** Nota 0-100 (entera) de una oferta válida. */
export function calcularNota(tipo: TipoLote, rareza: number, ingenio: number): number {
  const pesos = PESOS[tipo];
  return Math.round(acotar(pesos.rareza * rareza + pesos.ingenio * ingenio, 0, 100));
}

/** Martillazos que corresponden a una nota. */
export function martillazosDeNota(nota: number): Martillazos {
  const n = acotar(Math.round(nota), 0, 100);
  return MARTILLAZOS.find((m) => n <= TRAMOS_DE_NOTA[m].hasta) ?? 7;
}

/**
 * Redondeo de subasta: 3 cifras significativas ($37.215,43 → $37.200).
 * Por debajo de $1 se queda en centavos enteros.
 */
export function redondearComoSubasta(centavos: number): number {
  if (centavos < 100) return Math.max(1, Math.round(centavos));
  const paso = 10 ** (Math.floor(Math.log10(centavos)) - 2);
  return Math.round(centavos / paso) * paso;
}

/**
 * Precio de martillo (centavos) de una nota: dentro del rango de su nivel, en escala
 * logarítmica según la posición de la nota en el tramo. Solo la nota 100 llega a $2.500.000.
 */
export function precioDeNota(nota: number): number {
  const n = acotar(Math.round(nota), 0, 100);
  const m = martillazosDeNota(n);
  const tramo = TRAMOS_DE_NOTA[m];
  const rango = RANGOS_DE_PRECIO[m];
  // El último nivel llega a su máximo; los demás se quedan justo por debajo del siguiente.
  const pasos = m === 7 ? tramo.hasta - tramo.desde : tramo.hasta - tramo.desde + 1;
  const posicion = (n - tramo.desde) / pasos;
  const logPrecio =
    Math.log(rango.desde) + posicion * (Math.log(rango.hasta) - Math.log(rango.desde));
  return redondearComoSubasta(Math.exp(logPrecio));
}

/** Todo el cálculo de una oferta válida a partir de la tasación. */
export function precioDeOferta({
  tipo,
  rarezaIa,
  ingenio,
  datosJugadores,
}: {
  tipo: TipoLote;
  rarezaIa: number;
  ingenio: number;
  datosJugadores?: { veces: number; total: number };
}): { nota: number; martillazos: Martillazos; precioCentavos: number } {
  const nota = calcularNota(tipo, rarezaFinal(rarezaIa, datosJugadores), ingenio);
  return { nota, martillazos: martillazosDeNota(nota), precioCentavos: precioDeNota(nota) };
}

/** Precio para mostrar: "$37.200", "$4,73", "$2.500.000". */
export function formatearPrecio(centavos: number): string {
  const conCentavos = centavos % 100 !== 0;
  return `$${(centavos / 100).toLocaleString("es-ES", {
    minimumFractionDigits: conCentavos ? 2 : 0,
    maximumFractionDigits: 2,
    useGrouping: "always",
  })}`;
}
