// Límite de peticiones por IP con ventanas deslizantes (H16).
// Los contadores viven en memoria: bastan para la demo local y se reinician con el servidor.
// Al publicar (fase 8) hay que pasarlos a un almacén compartido (Postgres o Redis).

export type Ventana = {
  /** Nombre para el mensaje de error, por ejemplo "minuto" o "dia". */
  nombre: string;
  ms: number;
  maximo: number;
};

export type ResultadoLimite =
  { permitido: true } | { permitido: false; ventana: string; reintentarEnMs: number };

/** Los límites del juego: 10 ofertas por minuto y 300 al día por IP. */
export const VENTANAS_DEL_JUEGO: Ventana[] = [
  { nombre: "minuto", ms: 60_000, maximo: 10 },
  { nombre: "dia", ms: 24 * 60 * 60_000, maximo: 300 },
];

/** A partir de cuántas IPs distintas se limpian las que ya no tienen peticiones recientes. */
const LIMPIAR_A_PARTIR_DE = 10_000;

export function crearLimitador(ventanas: Ventana[], ahora: () => number = () => Date.now()) {
  const historial = new Map<string, number[]>();
  const ventanaMasLarga = Math.max(...ventanas.map((v) => v.ms));

  function recientes(clave: string, momento: number) {
    const marcas = (historial.get(clave) ?? []).filter((t) => t > momento - ventanaMasLarga);
    if (marcas.length > 0) historial.set(clave, marcas);
    else historial.delete(clave);
    return marcas;
  }

  /** Registra una petición de `clave` si cabe en todas las ventanas. */
  return function comprobar(clave: string): ResultadoLimite {
    const momento = ahora();
    if (historial.size > LIMPIAR_A_PARTIR_DE) {
      for (const otra of [...historial.keys()]) recientes(otra, momento);
    }

    const marcas = recientes(clave, momento);
    for (const ventana of ventanas) {
      const enVentana = marcas.filter((t) => t > momento - ventana.ms);
      if (enVentana.length >= ventana.maximo) {
        // Se libera un hueco cuando la más antigua de esa ventana sale de ella.
        const reintentarEnMs = enVentana[0] + ventana.ms - momento;
        return { permitido: false, ventana: ventana.nombre, reintentarEnMs };
      }
    }
    historial.set(clave, [...marcas, momento]);
    return { permitido: true };
  };
}

/** IP del cliente según las cabeceras del proxy; en local puede no venir ninguna. */
export function ipDeLaPeticion(headers: Headers): string {
  const reenviada = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || headers.get("x-real-ip")?.trim() || "desconocida";
}
