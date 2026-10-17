import { describe, expect, it } from "vitest";
import { normalizarOferta } from "@/lib/normalizar";

describe("normalizarOferta", () => {
  it("pasa a minúsculas", () => {
    expect(normalizarOferta("AJOLOTE")).toBe("ajolote");
    expect(normalizarOferta("Ajolote")).toBe("ajolote");
  });

  it("quita espacios de los bordes y junta los repetidos", () => {
    expect(normalizarOferta("  ajolote  ")).toBe("ajolote");
    expect(normalizarOferta("pez   payaso")).toBe("pez payaso");
  });

  it("trata tabuladores, saltos de línea y espacio duro como espacios", () => {
    expect(normalizarOferta("pez\tpayaso")).toBe("pez payaso");
    expect(normalizarOferta("pez\npayaso")).toBe("pez payaso");
    expect(normalizarOferta("pez payaso")).toBe("pez payaso");
  });

  it("conserva las tildes y la ñ", () => {
    expect(normalizarOferta("Papá")).toBe("papá");
    expect(normalizarOferta("papá")).not.toBe(normalizarOferta("papa"));
    expect(normalizarOferta("AÑO")).toBe("año");
    expect(normalizarOferta("año")).not.toBe(normalizarOferta("ano"));
    expect(normalizarOferta("PINGÜINO")).toBe("pingüino");
  });

  it("unifica la codificación de las tildes (compuesta y combinada)", () => {
    const compuesta = "café"; // "é" como un solo carácter
    const combinada = "café"; // "e" + tilde combinada
    expect(compuesta).not.toBe(combinada);
    expect(normalizarOferta(combinada)).toBe(normalizarOferta(compuesta));
    expect(normalizarOferta("año")).toBe("año"); // "n" + virgulilla combinada
  });

  it("quita la puntuación y los símbolos de los bordes", () => {
    expect(normalizarOferta("¡Ajolote!")).toBe("ajolote");
    expect(normalizarOferta("¿theremin?")).toBe("theremin");
    expect(normalizarOferta('"violín".')).toBe("violín");
    expect(normalizarOferta("...tardígrado...")).toBe("tardígrado");
    expect(normalizarOferta("🔨 martillo 🔨")).toBe("martillo");
  });

  it("respeta la puntuación interior", () => {
    expect(normalizarOferta("Mi dignidad, ya no cabe.")).toBe("mi dignidad, ya no cabe");
    expect(normalizarOferta("T-Rex")).toBe("t-rex");
    expect(normalizarOferta("Wi-Fi")).toBe("wi-fi");
  });

  it("conserva los números", () => {
    expect(normalizarOferta("R2-D2")).toBe("r2-d2");
    expect(normalizarOferta("7up")).toBe("7up");
  });

  it("quita caracteres invisibles que se cuelan al copiar y pegar", () => {
    expect(normalizarOferta("ajo​lote")).toBe("ajolote");
    expect(normalizarOferta("﻿ajolote")).toBe("ajolote");
  });

  it("devuelve vacío si no queda nada", () => {
    expect(normalizarOferta("")).toBe("");
    expect(normalizarOferta("   ")).toBe("");
    expect(normalizarOferta("¡¿...?!")).toBe("");
  });

  it("es idempotente: normalizar dos veces da lo mismo", () => {
    for (const texto of ["  ¡AJOLOTE!  ", "Mi dignidad, ya no cabe.", "café", "AÑO"]) {
      const una = normalizarOferta(texto);
      expect(normalizarOferta(una)).toBe(una);
    }
  });
});
