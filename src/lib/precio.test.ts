import { describe, expect, it } from "vitest";
import {
  calcularNota,
  formatearPrecio,
  martillazosDeNota,
  precioDeNota,
  precioDeOferta,
  RANGOS_DE_PRECIO,
  rarezaDeJugadores,
  rarezaFinal,
  redondearComoSubasta,
  TRAMOS_DE_NOTA,
} from "@/lib/precio";
import { REFERENCIA_POR_MARTILLAZO } from "@/tasacion/calibracion";

const NOTAS = Array.from({ length: 101 }, (_, i) => i);

describe("calcularNota", () => {
  it("pesa 80/20 en los lotes cerrados y 40/60 en los abiertos", () => {
    expect(calcularNota("cerrado", 50, 100)).toBe(60);
    expect(calcularNota("abierto", 50, 100)).toBe(80);
  });

  it("redondea y se queda en 0-100", () => {
    expect(calcularNota("cerrado", 33, 33)).toBe(33);
    expect(calcularNota("cerrado", 0, 0)).toBe(0);
    expect(calcularNota("abierto", 100, 100)).toBe(100);
  });
});

describe("martillazosDeNota", () => {
  it("respeta los tramos decididos (más exigente arriba)", () => {
    const cortes: [number, number][] = [
      [0, 1],
      [19, 1],
      [20, 2],
      [39, 2],
      [40, 3],
      [54, 3],
      [55, 4],
      [69, 4],
      [70, 5],
      [82, 5],
      [83, 6],
      [93, 6],
      [94, 7],
      [100, 7],
    ];
    for (const [nota, martillazos] of cortes) expect(martillazosDeNota(nota)).toBe(martillazos);
  });

  it("los tramos cubren 0-100 sin huecos ni solapes", () => {
    const tramos = Object.values(TRAMOS_DE_NOTA);
    expect(tramos[0].desde).toBe(0);
    expect(tramos.at(-1)!.hasta).toBe(100);
    for (let i = 1; i < tramos.length; i++) expect(tramos[i].desde).toBe(tramos[i - 1].hasta + 1);
  });

  it("las referencias de calibración del prompt caen dentro de su tramo", () => {
    for (const [m, referencia] of Object.entries(REFERENCIA_POR_MARTILLAZO)) {
      expect(martillazosDeNota(referencia)).toBe(Number(m));
    }
  });
});

describe("precioDeNota", () => {
  it("va de $0,05 (nota 0) a $2.500.000 (nota 100)", () => {
    expect(precioDeNota(0)).toBe(5);
    expect(precioDeNota(100)).toBe(250_000_000);
  });

  it("siempre sube con la nota", () => {
    for (let n = 1; n <= 100; n++) expect(precioDeNota(n)).toBeGreaterThan(precioDeNota(n - 1));
  });

  it("cada nota cae dentro del rango de precio de su nivel", () => {
    for (const n of NOTAS) {
      const rango = RANGOS_DE_PRECIO[martillazosDeNota(n)];
      expect(precioDeNota(n)).toBeGreaterThanOrEqual(rango.desde);
      expect(precioDeNota(n)).toBeLessThanOrEqual(rango.hasta);
    }
  });

  it("el inicio de cada nivel es el mínimo de su rango", () => {
    for (const [m, tramo] of Object.entries(TRAMOS_DE_NOTA)) {
      expect(precioDeNota(tramo.desde)).toBe(RANGOS_DE_PRECIO[Number(m) as 1].desde);
    }
  });
});

describe("redondearComoSubasta", () => {
  it("deja 3 cifras significativas", () => {
    expect(redondearComoSubasta(3_721_543)).toBe(3_720_000);
    expect(redondearComoSubasta(184_049_999)).toBe(184_000_000);
    expect(redondearComoSubasta(473)).toBe(473);
  });

  it("por debajo de $1, centavos enteros (mínimo 1)", () => {
    expect(redondearComoSubasta(5.4)).toBe(5);
    expect(redondearComoSubasta(0.2)).toBe(1);
  });
});

describe("rareza de los jugadores", () => {
  it("la única oferta vale 100 y la que dieron todos, 0", () => {
    expect(rarezaDeJugadores(1, 500)).toBe(100);
    expect(rarezaDeJugadores(500, 500)).toBe(0);
  });

  it("es logarítmica: el 1 % aún es bastante rara, el 10 % ya no tanto", () => {
    expect(Math.round(rarezaDeJugadores(5, 500))).toBe(74);
    expect(Math.round(rarezaDeJugadores(50, 500))).toBe(37);
  });

  it("con menos de 50 ofertas solo cuenta la IA", () => {
    expect(rarezaFinal(80)).toBe(80);
    expect(rarezaFinal(80, { veces: 49, total: 49 })).toBe(80);
  });

  it("de 50 a 500 los jugadores ganan peso hasta el 50 %", () => {
    // Todos dijeron lo mismo → rareza de jugadores 0.
    expect(rarezaFinal(80, { veces: 275, total: 275 })).toBeCloseTo(60); // peso 25 %
    expect(rarezaFinal(80, { veces: 500, total: 500 })).toBeCloseTo(40); // peso 50 %
    expect(rarezaFinal(80, { veces: 2000, total: 2000 })).toBeCloseTo(40); // no pasa del 50 %
  });
});

describe("precioDeOferta", () => {
  it("encadena nota, martillazos y precio", () => {
    // Okapi en un lote cerrado: rareza 62, ingenio 20 → nota 54 → 3 martillazos.
    expect(precioDeOferta({ tipo: "cerrado", rarezaIa: 62, ingenio: 20 })).toEqual({
      nota: 54,
      martillazos: 3,
      precioCentavos: precioDeNota(54),
    });
  });
});

describe("formatearPrecio", () => {
  it("usa punto de miles y coma decimal solo si hay centavos", () => {
    expect(formatearPrecio(5)).toBe("$0,05");
    expect(formatearPrecio(473)).toBe("$4,73");
    expect(formatearPrecio(3_720_000)).toBe("$37.200");
    expect(formatearPrecio(250_000_000)).toBe("$2.500.000");
    expect(formatearPrecio(500_000)).toBe("$5.000");
  });
});
