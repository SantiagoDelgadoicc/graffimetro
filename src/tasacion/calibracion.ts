// Escaleras de calibración validadas por el usuario en el H11.
// Le enseñan a la IA qué vale cada martillazo, del 1 al 7, con varios ejemplos por peldaño.
// La IA no decide martillazos: devuelve rareza e ingenio (0-100) y el código calcula el resto.
// Por eso cada peldaño lleva una puntuación de referencia para la dimensión que más pesa.
// Esas referencias son el centro de tramos de 15 puntos; los tramos definitivos se fijan
// en el H14 y, si cambian, hay que actualizar REFERENCIA_POR_MARTILLAZO.

import type { Martillazos } from "@/lib/juego";

/** Puntuación orientativa (0-100) del centro de cada peldaño. */
export const REFERENCIA_POR_MARTILLAZO: Record<Martillazos, number> = {
  1: 7,
  2: 22,
  3: 37,
  4: 52,
  5: 67,
  6: 82,
  7: 95,
};

export type Peldano = {
  martillazos: Martillazos;
  ejemplos: string[];
  porQue: string;
};

export type Escalera = {
  lote: string;
  tipo: "cerrado" | "abierto";
  /** La dimensión que más pesa en ese tipo de lote y a la que se refieren las referencias. */
  dimension: "rareza" | "ingenio";
  peldanos: Peldano[];
};

export const ESCALERA_CERRADA: Escalera = {
  lote: "Un animal con rayas o manchas",
  tipo: "cerrado",
  dimension: "rareza",
  peldanos: [
    {
      martillazos: 1,
      ejemplos: ["cebra", "tigre", "leopardo", "jirafa", "vaca"],
      porQue: "Lo primero que dice todo el mundo",
    },
    {
      martillazos: 2,
      ejemplos: ["dálmata", "guepardo", "mariquita"],
      porQue: "Obvio, pero no lo primero",
    },
    {
      martillazos: 3,
      ejemplos: ["jaguar", "hiena", "ocelote", "pez payaso"],
      porQue: "Hay que pensarlo un poco",
    },
    {
      martillazos: 4,
      ejemplos: ["okapi", "serval", "pez globo"],
      porQue: "Poca gente cae en ello",
    },
    {
      martillazos: 5,
      ejemplos: ["gineta", "numbat", "tiburón ballena"],
      porQue: "Conocimiento de documental",
    },
    { martillazos: 6, ejemplos: ["quoll", "bongo", "axis"], porQue: "Casi de biólogo" },
    {
      martillazos: 7,
      ejemplos: ["tilacino", "cuaga"],
      porQue: "Rarísimo pero real (ambos extintos)",
    },
  ],
};

export const ESCALERA_ABIERTA: Escalera = {
  lote: "Una excusa para llegar tarde que nadie te creería",
  tipo: "abierto",
  dimension: "ingenio",
  peldanos: [
    {
      martillazos: 1,
      ejemplos: ["tráfico", "me dormí"],
      porQue: "Literal y creíble: no cumple la consigna",
    },
    {
      martillazos: 2,
      ejemplos: ["se rompió el despertador", "perdí el bus"],
      porQue: "Creíble con algo de detalle",
    },
    {
      martillazos: 3,
      ejemplos: ["me persiguió un perro", "se inundó mi casa"],
      porQue: "Exagerada pero esperable",
    },
    {
      martillazos: 4,
      ejemplos: ["me abdujeron", "un dragón"],
      porQue: "Absurda, pero lo primero que se le ocurre a cualquiera",
    },
    {
      martillazos: 5,
      ejemplos: ["viajé en el tiempo", "me tragó una ballena"],
      porQue: "Absurda con algo de imagen",
    },
    { martillazos: 6, ejemplos: ["mi gemelo malvado"], porQue: "Inesperada y con gracia" },
    {
      martillazos: 7,
      ejemplos: ["el lunes me secuestró"],
      porQue: "Juego de palabras inesperado: golpe de genio",
    },
  ],
};
