import { describe, expect, it } from "vitest";
import catalogoReal from "../../data/lotes.json";
import { contarPor, validarCatalogo } from "@/db/catalogo";

const loteValido = {
  numero: 1,
  texto: "Algo que se vende en rollo",
  nombreCorto: "En rollo",
  tipo: "cerrado",
  tema: "vida-cotidiana",
  dificultad: "facil",
};

describe("validarCatalogo", () => {
  it("acepta un lote bien formado", () => {
    expect(validarCatalogo([loteValido])).toHaveLength(1);
  });

  it("rechaza algo que no es una lista", () => {
    expect(() => validarCatalogo({ lotes: [] })).toThrow("lista de lotes");
  });

  it("rechaza números y textos repetidos", () => {
    const repetido = { ...loteValido, nombreCorto: "Otro" };
    expect(() => validarCatalogo([loteValido, repetido])).toThrow(/número 1 está repetido/);
    expect(() => validarCatalogo([loteValido, { ...repetido, numero: 2 }])).toThrow(
      /texto .* está repetido/,
    );
  });

  it("rechaza valores fuera de los enums y lista todos los problemas", () => {
    const malo = { ...loteValido, tipo: "raro", tema: "deportes", dificultad: "imposible" };
    expect(() => validarCatalogo([malo])).toThrow(/3 problema/);
  });

  it("rechaza campos vacíos y números no válidos", () => {
    expect(() => validarCatalogo([{ ...loteValido, numero: 0, nombreCorto: " " }])).toThrow(
      /2 problema/,
    );
  });
});

describe("catálogo real (data/lotes.json)", () => {
  const lotes = validarCatalogo(catalogoReal);

  it("tiene 100 lotes numerados del 1 al 100", () => {
    expect(lotes.map((l) => l.numero)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it("respeta el reparto validado en el H08", () => {
    expect(contarPor(lotes, "tipo")).toEqual({ cerrado: 60, abierto: 40 });
    expect(contarPor(lotes, "dificultad")).toEqual({ facil: 50, medio: 35, dificil: 15 });
    expect(Object.values(contarPor(lotes, "tema"))).toEqual([25, 25, 25, 25]);
  });
});
