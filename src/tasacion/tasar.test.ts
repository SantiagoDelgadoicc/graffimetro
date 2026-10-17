import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { esErrorDeFormato, tasarConModelo } from "@/tasacion/tasar";

const lote = { texto: "Un animal con rayas o manchas", tipo: "cerrado" as const };
const opciones = { proveedor: "groq" as const, modelo: "modelo-de-prueba" };

function modeloQueResponde(json: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(json) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1300, noCache: 1300, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 90, text: 60, reasoning: 30 },
      },
      warnings: [],
    }),
  });
}

describe("tasarConModelo", () => {
  it("devuelve la tasación validada, el proveedor y los tokens", async () => {
    const tasacion = {
      valida: true,
      formaCanonica: "okapi",
      rareza: 55,
      ingenio: 20,
      comentario: "¡Una jirafa en pijama de cebra, damas y caballeros!",
    };
    const resultado = await tasarConModelo(modeloQueResponde(tasacion), lote, "okapi", opciones);

    expect(resultado.tasacion).toEqual(tasacion);
    expect(resultado.proveedor).toBe("groq");
    expect(resultado.modelo).toBe("modelo-de-prueba");
    expect(resultado.tokens).toEqual({ entrada: 1300, salida: 90, razonamiento: 30 });
  });

  it("envía las instrucciones de tasación y la oferta entre etiquetas", async () => {
    const modelo = modeloQueResponde({
      valida: true,
      formaCanonica: "cebra",
      rareza: 5,
      ingenio: 3,
      comentario: "Aquí nadie puja por cebras, campeón.",
    });
    await tasarConModelo(modelo, lote, "cebra", opciones);

    const enviado = JSON.stringify(modelo.doGenerateCalls[0].prompt);
    expect(enviado).toContain("Eres el tasador de La Puja");
    expect(enviado).toContain("<oferta>cebra</oferta>");
    expect(enviado).toContain(lote.texto);
  });

  it("reintenta una vez si la IA se equivoca de formato, y falla si repite", async () => {
    const malo = modeloQueResponde({ valida: true, formaCanonica: null, rareza: "500" });
    await expect(tasarConModelo(malo, lote, "okapi", opciones)).rejects.toThrow();
    expect(malo.doGenerateCalls).toHaveLength(2);
  });

  it("si el reintento sale bien, devuelve esa tasación", async () => {
    const buena = {
      valida: true,
      formaCanonica: "okapi",
      rareza: 55,
      ingenio: 20,
      comentario: "Joya rara, campeón.",
    };
    const respuestas = [{ rareza: "55" }, buena];
    const modelo = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: "text", text: JSON.stringify(respuestas.shift()) }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 1, text: 1, reasoning: undefined },
        },
        warnings: [],
      }),
    });
    const resultado = await tasarConModelo(modelo, lote, "okapi", opciones);
    expect(resultado.tasacion).toEqual(buena);
    expect(modelo.doGenerateCalls).toHaveLength(2);
  });

  it("no reintenta los errores de límite (429)", async () => {
    const limitado = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new APICallError({
          message: "Rate limit reached",
          url: "https://api.groq.com",
          requestBodyValues: {},
          statusCode: 429,
          isRetryable: true,
        });
      },
    });
    await expect(tasarConModelo(limitado, lote, "okapi", opciones)).rejects.toThrow(/Rate limit/);
    expect(limitado.doGenerateCalls).toHaveLength(1);
  });
});

describe("esErrorDeFormato", () => {
  const error400 = (message: string) =>
    new APICallError({ message, url: "u", requestBodyValues: {}, statusCode: 400 });

  it("reconoce el rechazo de Groq por esquema", () => {
    expect(esErrorDeFormato(error400("Generated JSON does not match the expected schema"))).toBe(
      true,
    );
  });

  it("no confunde otros errores con errores de formato", () => {
    expect(esErrorDeFormato(error400("Invalid API key"))).toBe(false);
    expect(esErrorDeFormato(new Error("red caída"))).toBe(false);
  });
});
