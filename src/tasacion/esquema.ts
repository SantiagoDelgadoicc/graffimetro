// Forma exacta que tiene que devolver la IA al tasar una oferta.
// Las descripciones viajan al modelo como parte del esquema JSON (salida estructurada).
import { z } from "zod";

const puntuacion = z.number().int().min(0).max(100);

export const esquemaTasacion = z
  .object({
    valida: z
      .boolean()
      .describe("true si la oferta existe y encaja con el lote; false si es mercancía falsa."),
    formaCanonica: z
      .string()
      .nullable()
      .describe(
        'Forma de diccionario de la oferta: singular, sin artículo, en minúsculas y con la ortografía corregida ("Los Perros" → "perro"). null si no es válida.',
      ),
    rareza: puntuacion.describe(
      "0-100: qué tan pocos hispanohablantes la dirían. 0 = la diría casi todo el mundo; 100 = casi nadie, pero es real.",
    ),
    ingenio: puntuacion.describe(
      "0-100: qué tan inesperada, graciosa o creativa es. 0 = literal y sin gracia; 100 = golpe de genio.",
    ),
    comentario: z
      .string()
      .min(1)
      .max(160)
      .describe("Una frase corta de Bartolo sobre la oferta (máximo ~15 palabras)."),
  })
  .superRefine((t, ctx) => {
    if (t.valida && !t.formaCanonica?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["formaCanonica"],
        message: "Una oferta válida necesita su forma canónica.",
      });
    }
    if (!t.valida && t.formaCanonica !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["formaCanonica"],
        message: "Una oferta no válida no lleva forma canónica (null).",
      });
    }
  });

export type Tasacion = z.infer<typeof esquemaTasacion>;
