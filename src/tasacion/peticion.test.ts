import { describe, expect, it } from "vitest";
import { precioDeNota } from "@/lib/precio";
import { armarRespuesta, esquemaPeticion, LARGO_MAXIMO_OFERTA } from "@/tasacion/peticion";

const partidaId = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";

describe("esquemaPeticion", () => {
  it("acepta una petición correcta y pone esReintento en false", () => {
    expect(esquemaPeticion.parse({ lote: 31, oferta: "okapi", partidaId })).toEqual({
      lote: 31,
      oferta: "okapi",
      partidaId,
      esReintento: false,
    });
  });

  it("rechaza lotes no válidos, partidas sin UUID y ofertas demasiado largas", () => {
    expect(esquemaPeticion.safeParse({ lote: 0, oferta: "a", partidaId }).success).toBe(false);
    expect(esquemaPeticion.safeParse({ lote: "31", oferta: "a", partidaId }).success).toBe(false);
    expect(esquemaPeticion.safeParse({ lote: 31, oferta: "a", partidaId: "x" }).success).toBe(
      false,
    );
    const larga = "a".repeat(LARGO_MAXIMO_OFERTA + 1);
    expect(esquemaPeticion.safeParse({ lote: 31, oferta: larga, partidaId }).success).toBe(false);
  });
});

describe("armarRespuesta", () => {
  const comun = { lote: 31, tipo: "cerrado" as const, oferta: "okapi", deCache: false };

  it("una oferta válida lleva nota, martillazos, nivel y precio", () => {
    const r = armarRespuesta({
      ...comun,
      tasacion: {
        valida: true,
        formaCanonica: "okapi",
        rareza: 70,
        ingenio: 20,
        comentario: "¡Joya!",
      },
    });
    // 0,8 × 70 + 0,2 × 20 = 60 → 4 martillazos.
    expect(r).toMatchObject({
      valida: true,
      nota: 60,
      martillazos: 4,
      nivel: "¡Pujas en la sala!",
      precioCentavos: precioDeNota(60),
      comentario: "¡Joya!",
      deCache: false,
    });
    expect(r.precio).toMatch(/^\$\d/);
  });

  it("la mercancía falsa vale $0 y no lleva nota ni martillazos", () => {
    const r = armarRespuesta({
      ...comun,
      oferta: "mesa",
      deCache: true,
      tasacion: { valida: false, formaCanonica: null, rareza: 0, ingenio: 0, comentario: "¡No!" },
    });
    expect(r).toMatchObject({
      valida: false,
      nota: null,
      martillazos: null,
      nivel: null,
      precioCentavos: 0,
      precio: "$0",
      deCache: true,
    });
  });

  it("los datos de jugadores bajan el precio de lo que todos dicen", () => {
    const tasacion = {
      valida: true,
      formaCanonica: "cebra",
      rareza: 60,
      ingenio: 10,
      comentario: "Uf.",
    };
    const sinDatos = armarRespuesta({ ...comun, tasacion });
    const conDatos = armarRespuesta({
      ...comun,
      tasacion,
      datosJugadores: { veces: 400, total: 500 },
    });
    expect(conDatos.precioCentavos).toBeLessThan(sinDatos.precioCentavos);
  });
});
