import { describe, expect, it } from "vitest";
import { NIVELES, nombreDelNivel } from "@/lib/juego";

describe("nombreDelNivel", () => {
  it("hay 7 niveles", () => {
    expect(NIVELES).toHaveLength(7);
  });

  it("x1 es Tag y x7 es la obra maestra", () => {
    expect(nombreDelNivel(1)).toBe("Tag");
    expect(nombreDelNivel(4)).toBe("Pieza");
    expect(nombreDelNivel(7)).toBe("¡Obra maestra!");
  });
});
