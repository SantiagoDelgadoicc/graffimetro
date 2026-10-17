// Tasación de una oferta con un modelo de IA (salida estructurada validada con zod).
// Solo para el servidor o los scripts: necesita las claves de .env.local.
// Imports relativos con ".ts" para poder usarlo también desde los scripts de Node.
import { createGroq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import { APICallError, generateText, NoObjectGeneratedError, Output, type LanguageModel } from "ai";
import { esquemaTasacion, type Tasacion } from "./esquema.ts";
import { INSTRUCCIONES_TASACION, mensajeDeTasacion, type LoteParaTasar } from "./prompt.ts";

export const MODELO_GROQ = "openai/gpt-oss-120b";

export type ResultadoTasacion = {
  tasacion: Tasacion;
  proveedor: "groq" | "gemini";
  modelo: string;
  /** Tokens gastados, para vigilar los límites gratuitos (Groq: 8.000 por minuto). */
  tokens: { entrada: number; salida: number; razonamiento: number };
};

type OpcionesTasacion = {
  proveedor: ResultadoTasacion["proveedor"];
  modelo: string;
  providerOptions?: Parameters<typeof generateText>[0]["providerOptions"];
};

/** Intentos por tasación: el segundo solo se hace si el primero falló por formato. */
const INTENTOS = 2;

/**
 * La IA a veces devuelve un JSON que no cumple el esquema (por ejemplo, un número como texto).
 * Esos fallos son puntuales y se reintentan. Los demás (límite 429, clave, red) no.
 */
export function esErrorDeFormato(error: unknown): boolean {
  if (NoObjectGeneratedError.isInstance(error)) return true;
  if (APICallError.isInstance(error) && error.statusCode === 400) {
    return /schema|json/i.test(`${error.message} ${error.responseBody ?? ""}`);
  }
  return false;
}

/** Tasa una oferta (ya normalizada) con cualquier modelo del AI SDK. */
export async function tasarConModelo(
  modelo: LanguageModel,
  lote: LoteParaTasar,
  oferta: string,
  opciones: OpcionesTasacion,
): Promise<ResultadoTasacion> {
  for (let intento = 1; ; intento++) {
    try {
      return await tasarUnaVez(modelo, lote, oferta, opciones);
    } catch (error) {
      if (intento >= INTENTOS || !esErrorDeFormato(error)) throw error;
    }
  }
}

async function tasarUnaVez(
  modelo: LanguageModel,
  lote: LoteParaTasar,
  oferta: string,
  opciones: OpcionesTasacion,
): Promise<ResultadoTasacion> {
  const resultado = await generateText({
    model: modelo,
    instructions: INSTRUCCIONES_TASACION,
    prompt: mensajeDeTasacion(lote, oferta),
    output: Output.object({ schema: esquemaTasacion }),
    providerOptions: opciones.providerOptions,
    // Sin reintentos automáticos del SDK: los de formato los hace tasarConModelo y los de
    // límite no se reintentan (el respaldo con Gemini llega en el H13).
    maxRetries: 0,
    timeout: 20_000,
  });

  return {
    tasacion: resultado.output,
    proveedor: opciones.proveedor,
    modelo: opciones.modelo,
    tokens: {
      entrada: resultado.usage.inputTokens ?? 0,
      salida: resultado.usage.outputTokens ?? 0,
      razonamiento: resultado.usage.outputTokenDetails?.reasoningTokens ?? 0,
    },
  };
}

/** Tasa una oferta con Groq `openai/gpt-oss-120b`, el modelo principal. */
export async function tasarConGroq(lote: LoteParaTasar, oferta: string) {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  return tasarConModelo(groq(MODELO_GROQ), lote, oferta, {
    proveedor: "groq",
    modelo: MODELO_GROQ,
    providerOptions: {
      groq: {
        // Poco razonamiento: más rápido para la cuenta atrás y menos tokens del límite por minuto.
        reasoningEffort: "low",
      } satisfies GroqLanguageModelChatOptions,
    },
  });
}
