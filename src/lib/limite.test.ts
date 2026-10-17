import { describe, expect, it } from "vitest";
import { crearLimitador, ipDeLaPeticion, VENTANAS_DEL_JUEGO } from "@/lib/limite";

function montar() {
  let reloj = 1_000_000;
  const comprobar = crearLimitador(VENTANAS_DEL_JUEGO, () => reloj);
  return { comprobar, avanzar: (ms: number) => (reloj += ms) };
}

describe("límite por minuto", () => {
  it("deja pasar 10 y rechaza la 11 con un tiempo de espera", () => {
    const { comprobar, avanzar } = montar();
    for (let i = 0; i < 10; i++) {
      expect(comprobar("1.2.3.4")).toEqual({ permitido: true });
      avanzar(1_000);
    }
    // La primera fue hace 10 s: queda libre dentro de 50 s.
    expect(comprobar("1.2.3.4")).toEqual({
      permitido: false,
      ventana: "minuto",
      reintentarEnMs: 50_000,
    });
  });

  it("vuelve a dejar pasar cuando la más antigua sale de la ventana", () => {
    const { comprobar, avanzar } = montar();
    for (let i = 0; i < 10; i++) comprobar("1.2.3.4");
    expect(comprobar("1.2.3.4").permitido).toBe(false);
    avanzar(60_001);
    expect(comprobar("1.2.3.4").permitido).toBe(true);
  });

  it("las peticiones rechazadas no cuentan", () => {
    const { comprobar, avanzar } = montar();
    for (let i = 0; i < 10; i++) comprobar("1.2.3.4");
    for (let i = 0; i < 5; i++) comprobar("1.2.3.4"); // rechazadas
    avanzar(60_001);
    for (let i = 0; i < 10; i++) expect(comprobar("1.2.3.4").permitido).toBe(true);
  });

  it("cada IP tiene su propio contador", () => {
    const { comprobar } = montar();
    for (let i = 0; i < 10; i++) comprobar("1.1.1.1");
    expect(comprobar("1.1.1.1").permitido).toBe(false);
    expect(comprobar("2.2.2.2").permitido).toBe(true);
  });
});

describe("límite diario", () => {
  it("tras 300 ofertas en 24 h rechaza aunque el minuto esté libre", () => {
    const { comprobar, avanzar } = montar();
    for (let i = 0; i < 300; i++) {
      expect(comprobar("1.2.3.4").permitido).toBe(true);
      avanzar(7_000); // ritmo de juego normal, siempre por debajo de 10/min
    }
    const rechazo = comprobar("1.2.3.4");
    expect(rechazo).toMatchObject({ permitido: false, ventana: "dia" });
    // Se libera cuando la primera cumple 24 h: 24 h − 300 × 7 s.
    expect(rechazo.permitido === false && rechazo.reintentarEnMs).toBe(86_400_000 - 2_100_000);
  });
});

describe("ipDeLaPeticion", () => {
  it("usa la primera IP de x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(ipDeLaPeticion(h)).toBe("203.0.113.7");
  });

  it("si no, x-real-ip, y si no hay nada, 'desconocida'", () => {
    expect(ipDeLaPeticion(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(ipDeLaPeticion(new Headers())).toBe("desconocida");
  });
});
