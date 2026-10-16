/** Nombres de los 7 niveles de martillazos, de 1 a 7. */
export const NIVELES = [
  "Basura de mercadillo",
  "Algo es algo",
  "Buena pieza",
  "¡Pujas en la sala!",
  "¡Subasta caliente!",
  "¡Locura en la sala!",
  "¡Se me rompió el martillo!",
] as const;

export type Martillazos = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Nombre del nivel de una oferta, por ejemplo 4 → "¡Pujas en la sala!". */
export function nombreDelNivel(martillazos: Martillazos): (typeof NIVELES)[number] {
  return NIVELES[martillazos - 1];
}
