/*
 * seguros.js — los dos seguros precargados y los que el usuario agregue.
 * Los que agrega el usuario viven en localStorage: sin cuentas, sin servidor.
 */
(function (root) {
  'use strict';

  const CLAVE = 'gmm.seguros.v1';

  const PRECARGADOS = [
    {
      id: 'allianz',
      nombre: 'MediMaxx Integral · plan Amplio (Allianz)',
      corto: 'MediMaxx',
      deducible: 32_000,
      coaseguro: 0.10,
      topeCoaseguro: 100_000,
      sumaAsegurada: 180_000_000,
      prima: 22_469,
      avisoTope: '',
    },
    {
      id: 'smnyl',
      nombre: 'Alfa Medical Íntegro (SMNYL)',
      corto: 'Alfa Medical',
      deducible: 35_000,
      coaseguro: 0.10,
      topeCoaseguro: null,
      sumaAsegurada: 170_000_000,
      prima: 34_220,
      avisoTope: 'La propuesta no indica tope de coaseguro. Aquí se simula sin tope.',
    },
  ];

  const almacen = () => {
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  };

  const porDefecto = () => PRECARGADOS.map((seguro) => ({ ...seguro, propio: false }));

  // Espejo en memoria: si el navegador no deja guardar (modo privado, Safari con
  // almacenamiento bloqueado), la página sigue funcionando mientras esté abierta.
  const memoria = [];
  let fallido = false;

  function leer() {
    const almacenLocal = almacen();
    if (!almacenLocal) return null;
    try {
      const crudo = JSON.parse(almacenLocal.getItem(CLAVE) || '[]');
      return Array.isArray(crudo) ? crudo : [];
    } catch (error) {
      return null;
    }
  }

  function guardar(lista) {
    memoria.length = 0;
    memoria.push(...lista);
    const almacenLocal = almacen();
    if (!almacenLocal) {
      fallido = true;
      return;
    }
    try {
      almacenLocal.setItem(CLAVE, JSON.stringify(lista));
    } catch (error) {
      /* sin espacio o modo privado: queda la copia en memoria */
      fallido = true;
    }
  }

  function persistente() {
    const almacenLocal = almacen();
    if (!almacenLocal) return false;
    try {
      const prueba = 'gmm.prueba';
      almacenLocal.setItem(prueba, '1');
      almacenLocal.removeItem(prueba);
      return true;
    } catch (error) {
      return false;
    }
  }

  function propios() {
    const crudo = fallido ? null : leer();
    if (crudo === null) return memoria.map((seguro) => normalizar(seguro, true));
    return crudo
      .filter((seguro) => seguro && typeof seguro.nombre === 'string')
      .map((seguro) => normalizar(seguro, true));
  }

  function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }

  function normalizar(datos, propio) {
    const tope = datos.topeCoaseguro;
    return {
      id: String(datos.id || `propio-${Date.now()}`),
      nombre: String(datos.nombre).slice(0, 60),
      corto: String(datos.corto || datos.nombre).slice(0, 22),
      deducible: Math.max(0, numero(datos.deducible)),
      coaseguro: Math.min(Math.max(numero(datos.coaseguro), 0), 1),
      topeCoaseguro: tope === null || tope === undefined || tope === '' ? null : Math.max(0, numero(tope)),
      sumaAsegurada: Math.max(0, numero(datos.sumaAsegurada)),
      prima: datos.prima ? numero(datos.prima) : null,
      avisoTope: String(datos.avisoTope || ''),
      propio: Boolean(propio),
    };
  }

  function todos() {
    return [...porDefecto(), ...propios()];
  }

  function agregar(datos) {
    const nuevo = normalizar({ ...datos, id: `propio-${Date.now()}` }, true);
    guardar([...propios(), nuevo]);
    return nuevo;
  }

  function eliminar(id) {
    guardar(propios().filter((seguro) => seguro.id !== id));
  }

  let activoEnMemoria = null;

  function activo() {
    const almacenLocal = almacen();
    if (!almacenLocal || fallido) return activoEnMemoria;
    try {
      return almacenLocal.getItem('gmm.seguro-activo') || activoEnMemoria;
    } catch (error) {
      return activoEnMemoria;
    }
  }

  function fijarActivo(id) {
    activoEnMemoria = id;
    const almacenLocal = almacen();
    if (!almacenLocal) {
      fallido = true;
      return;
    }
    try {
      almacenLocal.setItem('gmm.seguro-activo', id);
    } catch (error) {
      fallido = true;
    }
  }

  root.GMM_SEGUROS = { PRECARGADOS, todos, agregar, eliminar, activo, fijarActivo, normalizar, persistente };
})(typeof globalThis !== 'undefined' ? globalThis : this);
