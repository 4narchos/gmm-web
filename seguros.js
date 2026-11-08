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
      nombre: 'MediMaxx Integral (Allianz)',
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

  function guardar(lista) {
    const almacenLocal = almacen();
    if (!almacenLocal) return;
    try {
      almacenLocal.setItem(CLAVE, JSON.stringify(lista));
    } catch (error) {
      /* sin espacio o modo privado: seguimos sin guardar */
    }
  }

  function propios() {
    const almacenLocal = almacen();
    if (!almacenLocal) return [];
    try {
      const crudo = JSON.parse(almacenLocal.getItem(CLAVE) || '[]');
      if (!Array.isArray(crudo)) return [];
      return crudo
        .filter((seguro) => seguro && typeof seguro.nombre === 'string')
        .map((seguro) => normalizar(seguro, true));
    } catch (error) {
      return [];
    }
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

  function activo() {
    const almacenLocal = almacen();
    try {
      return almacenLocal ? almacenLocal.getItem('gmm.seguro-activo') : null;
    } catch (error) {
      return null;
    }
  }

  function fijarActivo(id) {
    const almacenLocal = almacen();
    try {
      if (almacenLocal) almacenLocal.setItem('gmm.seguro-activo', id);
    } catch (error) {
      /* da igual */
    }
  }

  root.GMM_SEGUROS = { PRECARGADOS, todos, agregar, eliminar, activo, fijarActivo, normalizar };
})(typeof globalThis !== 'undefined' ? globalThis : this);
