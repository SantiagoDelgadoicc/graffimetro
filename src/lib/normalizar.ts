// Normalización de ofertas: la forma "normalizada" es la clave de la caché de tasaciones,
// así que dos ofertas que el jugador consideraría iguales tienen que dar el mismo texto.
//
// Criterio (decidido en el H10):
// - Se conservan las tildes y la ñ: "papá" y "papa" son ofertas distintas, igual que
//   "año" y "ano". Solo se unifica su codificación Unicode (NFC), para que una "é" escrita
//   como letra + tilde combinada cuente igual que la "é" de un solo carácter.
// - Minúsculas, espacios repetidos o raros (tabuladores, saltos, espacio duro) → uno solo.
// - Se quita la puntuación y los símbolos de los bordes ("¡Ajolote!" → "ajolote"), pero
//   no la interior: "mi dignidad, ya no cabe" se queda igual.

/** Caracteres invisibles que a veces se cuelan al copiar y pegar. */
const INVISIBLES = /[​-‍⁠﻿­]/g;

/** Cualquier tipo de espacio en blanco, incluido el espacio duro. */
const ESPACIOS = /\s+/gu;

/** Todo lo que no es letra ni número al principio o al final del texto. */
const BORDES = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * Devuelve la forma normalizada de una oferta, por ejemplo "  ¡AJOLOTE!  " → "ajolote".
 * Si no queda nada (solo espacios o signos), devuelve una cadena vacía.
 */
export function normalizarOferta(texto: string): string {
  return texto
    .normalize("NFC")
    .replace(INVISIBLES, "")
    .toLocaleLowerCase("es")
    .replace(ESPACIOS, " ")
    .replace(BORDES, "")
    .trim();
}
