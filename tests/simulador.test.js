// Tests de la fórmula del simulador.
// Los números esperados están calculados a mano a partir de la póliza
// (Inbox/SMNYL vs Allianz.md) y del plan de la web.

const test = require('node:test');
const assert = require('node:assert/strict');
const { calcular } = require('../simulador.js');

const ALLIANZ = {
  nombre: 'MediMaxx Integral (Allianz)',
  deducible: 32_000,
  coaseguro: 0.10,
  topeCoaseguro: 100_000,
  sumaAsegurada: 180_000_000,
};

const SMNYL = {
  nombre: 'Alfa Medical Íntegro (SMNYL)',
  deducible: 35_000,
  coaseguro: 0.10,
  topeCoaseguro: null, // no especificado en la propuesta
  sumaAsegurada: 170_000_000,
};

const conSeguro = (seguro, cuenta) =>
  calcular({ cuenta, ...seguro });

test('apendicitis con Allianz: 32,000 + 10% de 118,000', () => {
  const r = conSeguro(ALLIANZ, 150_000);
  assert.equal(r.pagoDeEntrada, 32_000);
  assert.equal(r.tuParteDelResto, 11_800);
  assert.equal(r.totalTuyo, 43_800);
  assert.equal(r.pagaAseguradora, 106_200);
  assert.equal(r.topeAplicado, false);
});

test('UCI cara con Allianz: el tope de coaseguro protege', () => {
  const r = conSeguro(ALLIANZ, 1_500_000);
  // sin tope serían 32,000 + 146,800 = 178,800
  assert.equal(r.tuParteDelResto, 100_000);
  assert.equal(r.totalTuyo, 132_000);
  assert.equal(r.pagaAseguradora, 1_368_000);
  assert.equal(r.topeAplicado, true);
});

test('UCI con Allianz debajo del tope: paga el coaseguro completo', () => {
  const r = conSeguro(ALLIANZ, 1_000_000);
  assert.equal(r.tuParteDelResto, 96_800);
  assert.equal(r.totalTuyo, 128_800);
  assert.equal(r.topeAplicado, false);
});

test('UCI con SMNYL, tope no especificado: sin tope', () => {
  const r = conSeguro(SMNYL, 1_000_000);
  assert.equal(r.pagoDeEntrada, 35_000);
  assert.equal(r.tuParteDelResto, 96_500);
  assert.equal(r.totalTuyo, 131_500);
  assert.equal(r.topeAplicado, false);
  assert.equal(r.tope, null);
});

test('UCI con SMNYL: por encima del tope de Allianz, sin tope propio', () => {
  const r = conSeguro(SMNYL, 1_500_000);
  assert.equal(r.tuParteDelResto, 146_500);
  assert.equal(r.totalTuyo, 181_500);
  assert.equal(r.pagaAseguradora, 1_318_500);
});

test('cuenta menor al pago de entrada: pagas solo la cuenta', () => {
  const r = conSeguro(SMNYL, 20_000);
  assert.equal(r.pagoDeEntrada, 20_000);
  assert.equal(r.tuParteDelResto, 0);
  assert.equal(r.totalTuyo, 20_000);
  assert.equal(r.pagaAseguradora, 0);
});

test('cuenta igual al pago de entrada: sin resto', () => {
  const r = conSeguro(ALLIANZ, 32_000);
  assert.equal(r.totalTuyo, 32_000);
  assert.equal(r.pagaAseguradora, 0);
});

test('cuenta en cero no rompe nada', () => {
  const r = conSeguro(ALLIANZ, 0);
  assert.equal(r.totalTuyo, 0);
  assert.equal(r.pagaAseguradora, 0);
});

test('coaseguro 0%: solo pagas el pago de entrada', () => {
  const r = calcular({
    cuenta: 500_000,
    deducible: 30_000,
    coaseguro: 0,
    topeCoaseguro: 100_000,
    sumaAsegurada: 100_000_000,
  });
  assert.equal(r.tuParteDelResto, 0);
  assert.equal(r.totalTuyo, 30_000);
  assert.equal(r.pagaAseguradora, 470_000);
});

test('cuenta que rebasa el máximo asegurado: aviso y excedente a tu bolsa', () => {
  const r = calcular({
    cuenta: 200_000_000,
    deducible: 35_000,
    coaseguro: 0.10,
    topeCoaseguro: null,
    sumaAsegurada: 170_000_000,
  });
  assert.equal(r.pagaAseguradora, 170_000_000);
  assert.equal(r.totalTuyo, 30_000_000);
  assert.equal(r.excedeSuma, true);
});

test('siempre se cumple: tu bolsa + aseguradora = cuenta', () => {
  for (const cuenta of [0, 10_000, 32_000, 150_000, 900_000, 2_000_000]) {
    for (const seguro of [ALLIANZ, SMNYL]) {
      const r = conSeguro(seguro, cuenta);
      assert.equal(r.totalTuyo + r.pagaAseguradora, cuenta, `cuenta ${cuenta}`);
      assert.ok(r.totalTuyo >= 0 && r.pagaAseguradora >= 0);
    }
  }
});

test('entradas negativas o basura se tratan como cero', () => {
  const r = calcular({
    cuenta: -5,
    deducible: Number.NaN,
    coaseguro: -1,
    topeCoaseguro: undefined,
    sumaAsegurada: undefined,
  });
  assert.equal(r.cuenta, 0);
  assert.equal(r.totalTuyo, 0);
  assert.equal(r.tope, null);
});
