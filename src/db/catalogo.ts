// Validación del catálogo de lotes (`data/lotes.json`) antes de cargarlo en la base.
// La extensión ".ts" en el import deja usar este archivo desde los scripts de Node.
import { DIFICULTADES_LOTE, TEMAS_LOTE, TIPOS_LOTE } from "./schema.ts";

export type LoteDelCatalogo = {
  numero: number;
  texto: string;
  nombreCorto: string;
  tipo: (typeof TIPOS_LOTE)[number];
  tema: (typeof TEMAS_LOTE)[number];
  dificultad: (typeof DIFICULTADES_LOTE)[number];
};

function esUnoDe<T extends string>(valores: readonly T[], valor: unknown): valor is T {
  return typeof valor === "string" && (valores as readonly string[]).includes(valor);
}

function esTextoConContenido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim() !== "";
}

/**
 * Comprueba la forma de cada lote y que no haya números ni textos repetidos.
 * Si algo falla, lanza un error con todos los problemas encontrados a la vez.
 */
export function validarCatalogo(datos: unknown): LoteDelCatalogo[] {
  if (!Array.isArray(datos)) {
    throw new Error("El catálogo tiene que ser una lista de lotes.");
  }

  const problemas: string[] = [];
  const numeros = new Set<number>();
  const textos = new Set<string>();

  datos.forEach((lote: Record<string, unknown>, i) => {
    const donde = `Lote en la posición ${i + 1}`;
    if (typeof lote !== "object" || lote === null) {
      problemas.push(`${donde}: no es un objeto.`);
      return;
    }
    const { numero, texto, nombreCorto, tipo, tema, dificultad } = lote;

    if (!Number.isInteger(numero) || (numero as number) < 1) {
      problemas.push(`${donde}: "numero" tiene que ser un entero positivo.`);
    } else if (numeros.has(numero as number)) {
      problemas.push(`${donde}: el número ${numero} está repetido.`);
    } else {
      numeros.add(numero as number);
    }

    if (!esTextoConContenido(texto)) {
      problemas.push(`${donde}: falta "texto".`);
    } else if (textos.has(texto.trim().toLowerCase())) {
      problemas.push(`${donde}: el texto "${texto}" está repetido.`);
    } else {
      textos.add(texto.trim().toLowerCase());
    }

    if (!esTextoConContenido(nombreCorto)) problemas.push(`${donde}: falta "nombreCorto".`);
    if (!esUnoDe(TIPOS_LOTE, tipo)) problemas.push(`${donde}: "tipo" no válido (${tipo}).`);
    if (!esUnoDe(TEMAS_LOTE, tema)) problemas.push(`${donde}: "tema" no válido (${tema}).`);
    if (!esUnoDe(DIFICULTADES_LOTE, dificultad)) {
      problemas.push(`${donde}: "dificultad" no válida (${dificultad}).`);
    }
  });

  if (problemas.length > 0) {
    throw new Error(
      `El catálogo tiene ${problemas.length} problema(s):\n- ${problemas.join("\n- ")}`,
    );
  }
  return datos as LoteDelCatalogo[];
}

/** Cuántos lotes hay de cada valor de un campo, por ejemplo por tipo o por tema. */
export function contarPor<K extends "tipo" | "tema" | "dificultad">(
  lotes: LoteDelCatalogo[],
  campo: K,
): Record<string, number> {
  const cuenta: Record<string, number> = {};
  for (const lote of lotes) cuenta[lote[campo]] = (cuenta[lote[campo]] ?? 0) + 1;
  return cuenta;
}
