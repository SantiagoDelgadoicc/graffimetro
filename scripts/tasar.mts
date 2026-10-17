// Tasa ofertas reales desde la terminal (no usa la base de datos ni la caché).
// Usa Groq y, si falla, Gemini; con --gemini va directo a Gemini.
// Uso:
//   npm run tasar -- <número de lote> "<oferta>"    → una oferta
//   npm run tasar                                    → 4 casos de prueba
//   npm run tasar -- --gemini [...]                  → igual, pero solo con Gemini
// Cada tasación gasta ~2.000 tokens del límite gratuito de Groq (8.000 por minuto).
import { readFile } from "node:fs/promises";
import { validarCatalogo } from "../src/db/catalogo.ts";
import { normalizarOferta } from "../src/lib/normalizar.ts";
import { tasar, tasarConGemini } from "../src/tasacion/tasar.ts";

for (const clave of ["GROQ_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]) {
  if (!process.env[clave]) {
    console.error(`Falta ${clave} en .env.local (ver .env.example).`);
    process.exit(1);
  }
}

const argumentos = process.argv.slice(2);
const soloGemini = argumentos.includes("--gemini");
const tasador = soloGemini ? tasarConGemini : tasar;

const catalogo = validarCatalogo(
  JSON.parse(await readFile(new URL("../data/lotes.json", import.meta.url), "utf8")),
);

const CASOS_DE_PRUEBA: [number, string][] = [
  [31, "Cebra"], // lo obvio: debería valer poco
  [29, "ollie"], // la pista del propio lote: válida pero mínima
  [61, "Mi gato me escondió las llaves"], // abierto: manda el ingenio
  [31, "mesa"], // no encaja con el lote: mercancía falsa
];

const [numeroArg, ...ofertaArg] = argumentos.filter((a) => a !== "--gemini");
const casos: [number, string][] = numeroArg
  ? [[Number(numeroArg), ofertaArg.join(" ")]]
  : CASOS_DE_PRUEBA;

for (const [numero, ofertaEscrita] of casos) {
  const lote = catalogo.find((l) => l.numero === numero);
  if (!lote) {
    console.error(`No existe el lote ${numero}.`);
    process.exitCode = 1;
    continue;
  }
  const oferta = normalizarOferta(ofertaEscrita);
  console.log(`\nLote ${numero} (${lote.tipo}): "${lote.texto}"\nOferta: "${oferta}"`);

  const inicio = performance.now();
  try {
    const resultado = await tasador(lote, oferta);
    const { tasacion, tokens, proveedor, modelo } = resultado;
    const motivo = "motivoRespaldo" in resultado ? resultado.motivoRespaldo : undefined;
    const segundos = ((performance.now() - inicio) / 1000).toFixed(1);
    console.log(
      `  ${tasacion.valida ? "Válida" : "Mercancía falsa"}` +
        (tasacion.formaCanonica ? ` → "${tasacion.formaCanonica}"` : "") +
        ` · rareza ${tasacion.rareza} · ingenio ${tasacion.ingenio}`,
    );
    console.log(`  Bartolo: ${tasacion.comentario}`);
    console.log(
      `  ${proveedor} (${modelo})${motivo ? ` como respaldo: ${motivo}` : ""} · ${segundos} s · tokens: ${tokens.entrada} entrada, ${tokens.salida} salida (${tokens.razonamiento} de razonamiento)`,
    );
  } catch (error) {
    console.error("  Error al tasar:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
