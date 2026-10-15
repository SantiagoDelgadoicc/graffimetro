/** Nombres de los 7 niveles del graffímetro, de x1 a x7. */
export const NIVELES = [
  "Tag",
  "Throw-up",
  "Bubble",
  "Pieza",
  "Wildstyle",
  "Burner",
  "¡Obra maestra!",
] as const;

export type Combo = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Nombre del nivel de un combo, por ejemplo 4 → "Pieza". */
export function nombreDelNivel(combo: Combo): (typeof NIVELES)[number] {
  return NIVELES[combo - 1];
}
