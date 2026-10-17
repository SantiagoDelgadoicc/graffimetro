// Escaleras de calibración validadas por el usuario en el H11.
// Le enseñan a la IA qué vale cada martillazo, del 1 al 7, con varios ejemplos por peldaño.
// La IA no decide martillazos: devuelve rareza e ingenio (0-100) y el código calcula el resto.
// Por eso cada peldaño lleva una puntuación de referencia para la dimensión que más pesa:
// el centro de su tramo de nota (TRAMOS_DE_NOTA, decididos en el H14). Un test comprueba
// que cada referencia cae dentro de su tramo, para que no se desalineen.

import type { Martillazos } from "@/lib/juego";

/** Puntuación orientativa (0-100) de cada peldaño: el centro de su tramo de nota. */
export const REFERENCIA_POR_MARTILLAZO: Record<Martillazos, number> = {
  1: 10,
  2: 30,
  3: 47,
  4: 62,
  5: 76,
  6: 88,
  7: 97,
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
