/*
 * escenarios.js — casos frecuentes precargados del simulador.
 * Los costos son estimados típicos de hospital privado en México (2025).
 */
(function (root) {
  'use strict';

  const CASOS = [
    { id: 'apendicitis', emoji: '🩺', nombre: 'Apendicitis', costo: 150_000 },
    { id: 'cesarea', emoji: '👶', nombre: 'Cesárea', costo: 120_000 },
    { id: 'parto', emoji: '🍼', nombre: 'Parto natural', costo: 90_000 },
    { id: 'fractura', emoji: '🦴', nombre: 'Fractura con cirugía', costo: 200_000 },
    {
      id: 'uci',
      emoji: '💥',
      nombre: 'Choque con terapia intensiva',
      costo: 1_200_000,
      fuerte: true,
      nota: 'Puede ir de $800,000 a $1,500,000: ajústala con la cuenta.',
    },
  ];

  root.GMM_ESCENARIOS = { CASOS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
