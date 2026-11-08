/*
 * simulador.js — la única pieza con lógica real de la web.
 * Corre igual en el navegador (window.GMM) y en Node (require) para testearla.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && typeof root === 'object') root.GMM = Object.assign(root.GMM || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const numero = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0);
  const opcional = (valor) => (valor === null || valor === undefined ? null : Math.max(0, numero(valor)));

  /**
   * Calcula cuánto paga la aseguradora y cuánto sale de tu bolsa.
   *
   * tu parte = min(pago de entrada + % × lo que sobra, pago de entrada + tope)
   * La aseguradora paga el resto, nunca más de la suma asegurada.
   */
  function calcular(entrada) {
    const e = entrada || {};
    const cuenta = Math.max(0, numero(e.cuenta));
    const deducible = Math.max(0, numero(e.deducible));
    const coaseguro = Math.min(Math.max(numero(e.coaseguro), 0), 1);
    const tope = opcional(e.topeCoaseguro);
    const suma = opcional(e.sumaAsegurada);

    const pagoDeEntrada = Math.min(deducible, cuenta);
    const sobrante = Math.max(cuenta - deducible, 0);
    const restoSinTope = sobrante * coaseguro;
    const tuParteDelResto = tope === null ? restoSinTope : Math.min(restoSinTope, tope);

    let totalTuyo = pagoDeEntrada + tuParteDelResto;
    let pagaAseguradora = cuenta - totalTuyo;
    let excedente = 0;
    const excedeSuma = suma !== null && pagaAseguradora > suma;

    if (excedeSuma) {
      // La aseguradora paga su tope; lo que sobra de la cuenta también sale de tu bolsa.
      excedente = pagaAseguradora - suma;
      pagaAseguradora = suma;
      totalTuyo = pagoDeEntrada + tuParteDelResto + excedente;
    }

    return {
      cuenta,
      deducible,
      coaseguro,
      tope,
      sumaAsegurada: suma,
      pagoDeEntrada,
      tuParteDelResto,
      totalTuyo,
      pagaAseguradora,
      excedente,
      topeAplicado: tope !== null && sobrante > 0 && restoSinTope > tope,
      excedeSuma,
    };
  }

  return { calcular };
});
