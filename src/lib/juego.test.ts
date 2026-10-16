import { describe, expect, it } from "vitest";
import { NIVELES, nombreDelNivel } from "@/lib/juego";

describe("nombreDelNivel", () => {
  it("hay 7 niveles", () => {
    expect(NIVELES).toHaveLength(7);
  });

  it("1 martillazo es basura y 7 rompen el martillo", () => {
    expect(nombreDelNivel(1)).toBe("Basura de mercadillo");
    expect(nombreDelNivel(4)).toBe("¡Pujas en la sala!");
    expect(nombreDelNivel(7)).toBe("¡Se me rompió el martillo!");
  });
});
