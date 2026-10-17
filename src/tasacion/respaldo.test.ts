import { APICallError } from "ai";
import { describe, expect, it, vi } from "vitest";
import { crearTasador, pausaTrasLimite, type ResultadoTasacion } from "@/tasacion/tasar";

const lote = { texto: "Un animal con rayas o manchas", tipo: "cerrado" as const };

function resultado(proveedor: "groq" | "gemini"): ResultadoTasacion {
  return {
    tasacion: {
      valida: true,
      formaCanonica: "okapi",
      rareza: 55,
      ingenio: 20,
      comentario: "Joya rara, campeón.",
    },
    proveedor,
    modelo: proveedor === "groq" ? "openai/gpt-oss-120b" : "gemini-3.5-flash-lite",
    tokens: { entrada: 1, salida: 1, razonamiento: 0 },
  };
}

function error429(retryAfter?: string) {
  return new APICallError({
    message: "Rate limit reached",
    url: "https://api.groq.com",
    requestBodyValues: {},
    statusCode: 429,
    responseHeaders: retryAfter === undefined ? {} : { "retry-after": retryAfter },
    isRetryable: true,
  });
}

/** Tasador con principal y respaldo simulados y un reloj que controla el test. */
function montar(principal: () => Promise<ResultadoTasacion>) {
  let reloj = 0;
  const groq = vi.fn(principal);
  const gemini = vi.fn(async () => resultado("gemini"));
  const tasar = crearTasador({ principal: groq, respaldo: gemini, ahora: () => reloj });
  return { tasar, groq, gemini, avanzar: (ms: number) => (reloj += ms) };
}

describe("tasador con respaldo", () => {
  it("si Groq responde, no se llama a Gemini", async () => {
    const { tasar, gemini } = montar(async () => resultado("groq"));
    const r = await tasar(lote, "okapi");
    expect(r.proveedor).toBe("groq");
    expect(r.motivoRespaldo).toBeUndefined();
    expect(gemini).not.toHaveBeenCalled();
  });

  it("si Groq da 429, responde Gemini con motivo 'limite'", async () => {
    const { tasar } = montar(async () => {
      throw error429("2");
    });
    const r = await tasar(lote, "okapi");
    expect(r.proveedor).toBe("gemini");
    expect(r.motivoRespaldo).toBe("limite");
  });

  it("tras un 429, Groq queda en pausa el tiempo de retry-after", async () => {
    let limitado = true;
    const { tasar, groq, avanzar } = montar(async () => {
      if (limitado) throw error429("30");
      return resultado("groq");
    });

    await tasar(lote, "okapi"); // 429 → pausa de 30 s
    limitado = false;

    avanzar(29_000);
    const enPausa = await tasar(lote, "okapi");
    expect(enPausa.proveedor).toBe("gemini");
    expect(enPausa.motivoRespaldo).toBe("pausa");
    expect(groq).toHaveBeenCalledTimes(1); // durante la pausa ni se intenta

    avanzar(1_000);
    const tras = await tasar(lote, "okapi");
    expect(tras.proveedor).toBe("groq");
    expect(groq).toHaveBeenCalledTimes(2);
  });

  it("si Groq falla por otro motivo, responde Gemini sin pausar a Groq", async () => {
    const { tasar, groq } = montar(async () => {
      throw new Error("Groq caído");
    });
    const r = await tasar(lote, "okapi");
    expect(r.proveedor).toBe("gemini");
    expect(r.motivoRespaldo).toBe("error");

    await tasar(lote, "okapi");
    expect(groq).toHaveBeenCalledTimes(2); // sin pausa: se vuelve a intentar
  });

  it("si fallan los dos, lanza un error con ambas causas", async () => {
    const tasar = crearTasador({
      principal: async () => {
        throw new Error("Groq caído");
      },
      respaldo: async () => {
        throw new Error("Gemini caído");
      },
    });
    const fallo = await tasar(lote, "okapi").catch((e: unknown) => e);
    expect(fallo).toBeInstanceOf(AggregateError);
    expect((fallo as AggregateError).errors.map((e: Error) => e.message)).toEqual([
      "Groq caído",
      "Gemini caído",
    ]);
  });
});

describe("pausaTrasLimite", () => {
  it("usa retry-after en segundos, con decimales", () => {
    expect(pausaTrasLimite(error429("7.5"))).toBe(7_500);
  });

  it("sin retry-after, pausa 60 s", () => {
    expect(pausaTrasLimite(error429())).toBe(60_000);
  });

  it("acota la pausa entre 1 s y 10 min", () => {
    expect(pausaTrasLimite(error429("0"))).toBe(1_000);
    expect(pausaTrasLimite(error429("86400"))).toBe(600_000);
  });
});
