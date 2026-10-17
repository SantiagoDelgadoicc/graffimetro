// Tasación de una oferta con un modelo de IA (salida estructurada validada con zod).
// Solo para el servidor o los scripts: necesita las claves de .env.local.
// Imports relativos con ".ts" para poder usarlo también desde los scripts de Node.
import { createGoogleGenerativeAI, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { createGroq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import { APICallError, generateText, NoObjectGeneratedError, Output, type LanguageModel } from "ai";
import { esquemaTasacion, type Tasacion } from "./esquema.ts";
import { INSTRUCCIONES_TASACION, mensajeDeTasacion, type LoteParaTasar } from "./prompt.ts";

export const MODELO_GROQ = "openai/gpt-oss-120b";
/** Modelo fijado (no el alias "-latest"), para que la tasación no cambie sin avisar. */
export const MODELO_GEMINI = "gemini-3.5-flash-lite";

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

/** Tasa una oferta con Gemini Flash-Lite, el respaldo. */
export async function tasarConGemini(lote: LoteParaTasar, oferta: string) {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
  return tasarConModelo(google(MODELO_GEMINI), lote, oferta, {
    proveedor: "gemini",
    modelo: MODELO_GEMINI,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      } satisfies GoogleLanguageModelOptions,
    },
  });
}

// ---------------------------------------------------------------------------
// Respaldo: Groq primero; si falla por cualquier motivo, Gemini (decidido en el H13).
// ---------------------------------------------------------------------------

type FuncionDeTasacion = (lote: LoteParaTasar, oferta: string) => Promise<ResultadoTasacion>;

export type MotivoRespaldo = "limite" | "pausa" | "error";

export type TasacionConRespaldo = ResultadoTasacion & {
  /** Por qué respondió el respaldo; ausente si respondió el principal. */
  motivoRespaldo?: MotivoRespaldo;
};

/** Pausa de Groq tras un 429 si no indica `retry-after`, y los topes de esa pausa. */
const PAUSA_POR_DEFECTO_MS = 60_000;
const PAUSA_MINIMA_MS = 1_000;
const PAUSA_MAXIMA_MS = 10 * 60_000;

export function esErrorDeLimite(error: unknown): error is APICallError {
  return APICallError.isInstance(error) && error.statusCode === 429;
}

/** Cuánto esperar antes de volver a probar Groq, según su cabecera `retry-after` (segundos). */
export function pausaTrasLimite(error: APICallError): number {
  const cabecera = error.responseHeaders?.["retry-after"];
  const segundos = cabecera === undefined ? NaN : Number.parseFloat(cabecera);
  const ms = Number.isFinite(segundos) ? segundos * 1000 : PAUSA_POR_DEFECTO_MS;
  return Math.min(PAUSA_MAXIMA_MS, Math.max(PAUSA_MINIMA_MS, ms));
}

/**
 * Crea un tasador con principal y respaldo. Tras un 429 del principal, lo deja en pausa
 * y manda todo directo al respaldo hasta que pase el tiempo indicado.
 */
export function crearTasador({
  principal,
  respaldo,
  ahora = () => Date.now(),
}: {
  principal: FuncionDeTasacion;
  respaldo: FuncionDeTasacion;
  ahora?: () => number;
}) {
  let principalEnPausaHasta = 0;

  return async function tasar(lote: LoteParaTasar, oferta: string): Promise<TasacionConRespaldo> {
    let motivo: MotivoRespaldo = "pausa";
    let errorPrincipal: unknown;

    if (ahora() >= principalEnPausaHasta) {
      try {
        return await principal(lote, oferta);
      } catch (error) {
        errorPrincipal = error;
        if (esErrorDeLimite(error)) {
          motivo = "limite";
          principalEnPausaHasta = ahora() + pausaTrasLimite(error);
        } else {
          motivo = "error";
        }
      }
    }

    try {
      return { ...(await respaldo(lote, oferta)), motivoRespaldo: motivo };
    } catch (errorRespaldo) {
      throw new AggregateError(
        errorPrincipal === undefined ? [errorRespaldo] : [errorPrincipal, errorRespaldo],
        "No se pudo tasar la oferta: fallaron Groq y Gemini.",
      );
    }
  };
}

/** El tasador del juego: Groq `gpt-oss-120b` con respaldo de Gemini Flash-Lite. */
export const tasar = crearTasador({ principal: tasarConGroq, respaldo: tasarConGemini });
