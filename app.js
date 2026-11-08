/*
 * app.js — pega la fórmula, los datos y la pantalla.
 * Estado: la cuenta del hospital, el seguro elegido y los tres números que el
 * usuario puede mover (pago de entrada, porcentaje del resto y techo).
 */
(function () {
  'use strict';

  const pesos = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });
  const precios = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const dinero = (valor) => pesos.format(Math.round(valor));
  const precio = (valor) => precios.format(valor);

  const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter]);

  const MINIMO = 10_000;
  const MAXIMO = 2_000_000;

  const estado = {
    cuenta: 150_000,
    seguroId: null,
    deducible: null,
    coaseguro: null,
    topeCoaseguro: null,
  };

  const $ = (id) => document.getElementById(id);
  const seguros = window.GMM_SEGUROS;
  const { calcular } = window.GMM;
  const { PROPUESTAS, TEMAS } = window.GMM_PROPUESTAS || { PROPUESTAS: {}, TEMAS: [] };

  /* ---------- estado de cuenta ---------- */

  const slider = $('cuenta-slider');
  const numero = $('cuenta-numero');
  const pills = $('seguro-pills');

  function fijarCuenta(valor, origen) {
    const bruto = Math.round(Number(valor) || 0);
    const limpio = Math.max(MINIMO, Math.min(MAXIMO, bruto));
    estado.cuenta = limpio;

    if (origen !== 'numero') numero.value = String(limpio);
    slider.value = String(limpio);

    let aviso = '';
    if (bruto > MAXIMO) {
      aviso = `Esta cuenta llega hasta ${dinero(MAXIMO)}: se calcula con ese tope.`;
    } else if (bruto < MINIMO) {
      aviso = `La cuenta mínima es ${dinero(MINIMO)}: se calcula con ese mínimo.`;
    }
    mostrarAviso('cuenta-aviso', aviso);

    pintar();
  }

  slider.addEventListener('input', (evento) => fijarCuenta(evento.target.value, 'slider'));
  numero.addEventListener('input', (evento) => {
    const soloDigitos = evento.target.value.replace(/[^\d]/g, '');
    if (soloDigitos !== evento.target.value) evento.target.value = soloDigitos;
    fijarCuenta(soloDigitos || 0, 'numero');
  });
  numero.addEventListener('blur', () => {
    numero.value = String(estado.cuenta);
  });

  function mostrarAviso(id, texto) {
    const nodo = $(id);
    if (!nodo) return;
    nodo.hidden = !texto;
    nodo.textContent = texto || '';
  }

  /* ---------- seguros ---------- */

  function listaSeguros() {
    return seguros.todos();
  }

  function seguroActivo() {
    const lista = listaSeguros();
    return lista.find((seguro) => seguro.id === estado.seguroId) || lista[0];
  }

  function traerNumerosDePoliza() {
    const seguro = seguroActivo();
    estado.deducible = seguro.deducible;
    estado.coaseguro = seguro.coaseguro;
    estado.topeCoaseguro = seguro.topeCoaseguro;
  }

  function elegirSeguro(id) {
    estado.seguroId = id;
    seguros.fijarActivo(id);
    traerNumerosDePoliza();
    sincronizarCampos(true);
    pintar();
    const activo = pills.querySelector('[aria-pressed="true"]');
    if (activo) activo.focus({ preventScroll: true });
  }

  /* ---------- los tres números editables ---------- */

  const entrada = $('entrada-numero');
  const coaseguro = $('coaseguro-numero');
  const tope = $('tope-numero');

  const aEntero = (texto) => Math.max(0, Math.round(Number(String(texto).replace(/[^\d]/g, '')) || 0));

  entrada.addEventListener('input', (evento) => {
    const digitos = evento.target.value.replace(/[^\d]/g, '');
    if (digitos !== evento.target.value) evento.target.value = digitos;
    estado.deducible = aEntero(digitos);
    pintar();
  });

  coaseguro.addEventListener('input', (evento) => {
    const digitos = evento.target.value.replace(/[^\d]/g, '');
    if (digitos !== evento.target.value) evento.target.value = digitos;
    const valor = Math.min(100, aEntero(digitos));
    estado.coaseguro = valor / 100;
    pintar();
  });
  coaseguro.addEventListener('blur', () => {
    coaseguro.value = String(Math.round(estado.coaseguro * 100));
  });

  tope.addEventListener('input', (evento) => {
    const digitos = evento.target.value.replace(/[^\d]/g, '');
    if (digitos !== evento.target.value) evento.target.value = digitos;
    estado.topeCoaseguro = digitos === '' ? null : aEntero(digitos);
    pintar();
  });

  function sincronizarCampos(forzar) {
    const pares = [
      [entrada, estado.deducible === null ? '' : String(estado.deducible)],
      [coaseguro, estado.coaseguro === null ? '' : String(Math.round(estado.coaseguro * 100))],
      [tope, estado.topeCoaseguro === null ? '' : String(estado.topeCoaseguro)],
    ];
    pares.forEach(([campo, valor]) => {
      if (forzar || document.activeElement !== campo) campo.value = valor;
    });
  }

  $('volver-poliza').addEventListener('click', () => {
    traerNumerosDePoliza();
    sincronizarCampos(true);
    pintar();
  });

  /* ---------- pintar ---------- */

  function pintarPills() {
    const activo = seguroActivo();
    pills.textContent = '';
    listaSeguros().forEach((seguro) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'pill';
      boton.textContent = seguro.corto;
      boton.setAttribute('aria-pressed', String(seguro.id === activo.id));
      boton.addEventListener('click', () => elegirSeguro(seguro.id));
      pills.appendChild(boton);
    });
  }

  function calculoActual() {
    const seguro = seguroActivo();
    return calcular({
      cuenta: estado.cuenta,
      deducible: estado.deducible ?? 0,
      coaseguro: estado.coaseguro ?? 0,
      topeCoaseguro: estado.topeCoaseguro,
      sumaAsegurada: seguro.sumaAsegurada,
    });
  }

  function pintarBarra(calculo) {
    const total = calculo.cuenta;
    const porcentajeTuyo = total > 0 ? (calculo.totalTuyo / total) * 100 : 0;
    const porcentajeAseguradora = 100 - porcentajeTuyo;

    $('barra-tuya').style.width = `${porcentajeTuyo.toFixed(2)}%`;
    $('barra-aseguradora').style.width = `${porcentajeAseguradora.toFixed(2)}%`;

    const rotular = (nodo, valor, porcentaje) => {
      nodo.textContent = porcentaje >= 14 ? dinero(valor) : '';
    };
    rotular($('barra-tuya-texto'), calculo.totalTuyo, porcentajeTuyo);
    rotular($('barra-aseguradora-texto'), calculo.pagaAseguradora, porcentajeAseguradora);

    $('barra').setAttribute(
      'aria-label',
      `De ${dinero(total)}, ${dinero(calculo.totalTuyo)} salen de tu bolsa y ${dinero(calculo.pagaAseguradora)} los paga la aseguradora.`,
    );
  }

  function pintarDesglose(calculo) {
    $('renglon-entrada').textContent = dinero(calculo.pagoDeEntrada);

    const porcentaje = Math.round(calculo.coaseguro * 100);
    const sobrante = Math.max(calculo.cuenta - calculo.deducible, 0);
    $('renglon-porcentaje').textContent = sobrante > 0 ? `(${porcentaje}% de ${dinero(sobrante)})` : '';
    $('renglon-resto').textContent = dinero(calculo.tuParteDelResto);

    if (calculo.topeAplicado && calculo.tope !== null) {
      const sinTope = sobrante * calculo.coaseguro;
      mostrarAviso(
        'aviso-tope',
        `Tu ${porcentaje}% serían ${dinero(sinTope)}, pero tu techo es ${dinero(calculo.tope)}: no pagas más de eso.`,
      );
    } else if (calculo.tope === null && sobrante > 0) {
      mostrarAviso(
        'aviso-tope',
        `Sin techo, ese ${porcentaje}% crece con la cuenta: mientras más grande la factura, más pagas.`,
      );
    } else {
      mostrarAviso('aviso-tope', '');
    }

    $('renglon-total').textContent = dinero(calculo.totalTuyo);
    $('renglon-aseguradora').textContent = dinero(calculo.pagaAseguradora);
    $('renglon-suma-detalle').textContent = `máximo ${dinero(calculo.sumaAsegurada || 0)}`;

    const filaExcedente = $('renglon-excedente-fila');
    if (calculo.excedente > 0) {
      filaExcedente.hidden = false;
      $('renglon-excedente').textContent = dinero(calculo.excedente);
    } else {
      filaExcedente.hidden = true;
      $('renglon-excedente').textContent = '';
    }

    mostrarAviso(
      'aviso-suma',
      calculo.excedeSuma
        ? `La cuenta rebasa el máximo que paga la aseguradora (${dinero(calculo.sumaAsegurada)}). Ella paga su tope y la diferencia sale de tu bolsa.`
        : '',
    );
  }

  function pintarNotaAjuste() {
    const seguro = seguroActivo();
    const iguales =
      (estado.deducible ?? 0) === seguro.deducible &&
      (estado.coaseguro ?? 0) === seguro.coaseguro &&
      (estado.topeCoaseguro ?? null) === (seguro.topeCoaseguro ?? null);
    $('nota-ajuste').hidden = iguales;
  }

  function pintar() {
    const calculo = calculoActual();
    pintarPills();
    pintarBarra(calculo);
    pintarDesglose(calculo);
    pintarNotaAjuste();
    sincronizarCampos(false);
  }

  /* ---------- escenarios ---------- */

  function pintarEscenarios() {
    const lista = $('escenarios-lista');
    lista.textContent = '';
    (window.GMM_ESCENARIOS ? window.GMM_ESCENARIOS.CASOS : []).forEach((caso) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'chip' + (caso.fuerte ? ' chip-fuerte' : '');
      boton.textContent = `${caso.emoji} ${caso.nombre}`;
      boton.title = `Cuenta de ${dinero(caso.costo)}.${caso.nota ? ` ${caso.nota}` : ''}`;
      boton.addEventListener('click', () => fijarCuenta(caso.costo));
      lista.appendChild(boton);
    });
  }

  /* ---------- prima anual ---------- */

  function tarjetaPrima(seguro) {
    const propuesta = PROPUESTAS[seguro.id];
    if (!propuesta) return null;

    const articulo = document.createElement('article');
    articulo.className = 'tarjeta-prima';
    articulo.innerHTML = `
      <header class="tarjeta-prima-cabecera">
        <h3>${escapar(seguro.nombre)}</h3>
        <p class="meta">Plan ${escapar(propuesta.plan)} · ${escapar(propuesta.zona)} · máximo ${dinero(seguro.sumaAsegurada)}</p>
      </header>
      <ul class="lista-prima">
        ${propuesta.prima.conceptos
          .map(
            (concepto) => `
            <li>
              <span>${escapar(concepto.nombre)} <small>(${escapar(concepto.glosa)})</small></span>
              <strong>${precio(concepto.monto)}</strong>
            </li>`,
          )
          .join('')}
      </ul>
      <p class="prima-total"><span>Pagas al año</span><strong>${precio(propuesta.prima.total)}</strong></p>
      <div class="pagos">
        <p class="pagos-titulo">Cómo puedes pagarlo</p>
        <ul class="lista-prima">
          ${propuesta.prima.pagos
            .map(
              (pago) => `
              <li><span>${escapar(pago.nombre)}</span><strong>${precio(pago.monto)}</strong></li>`,
            )
            .join('')}
        </ul>
        <p class="nota">${escapar(propuesta.prima.notaPagos)}</p>
      </div>
    `;
    return articulo;
  }

  function pintarPrima() {
    const contenedor = $('prima-cards');
    contenedor.textContent = '';
    listaSeguros().forEach((seguro) => {
      const tarjeta = tarjetaPrima(seguro);
      if (tarjeta) contenedor.appendChild(tarjeta);
    });
  }

  /* ---------- características ---------- */

  function pintarCaracteristicas() {
    const contenedor = $('caracteristicas');
    contenedor.textContent = '';
    const conPropuesta = listaSeguros().filter((seguro) => PROPUESTAS[seguro.id]);

    TEMAS.forEach((tema) => {
      const articulo = document.createElement('article');
      articulo.className = 'caracteristica';
      const filas = conPropuesta
        .map(
          (seguro) => `
          <div class="caracteristica-fila">
            <span class="caracteristica-marca">${escapar(seguro.corto)}</span>
            <p>${escapar(PROPUESTAS[seguro.id].caracteristicas[tema.clave] || '—')}</p>
          </div>`,
        )
        .join('');
      articulo.innerHTML = `
        <header class="caracteristica-cabecera">
          <span class="caracteristica-emoji" aria-hidden="true">${tema.emoji}</span>
          <h3>${escapar(tema.titulo)}</h3>
        </header>
        <div class="caracteristica-filas">${filas}</div>
      `;
      contenedor.appendChild(articulo);
    });
  }

  /* ---------- añadir seguro ---------- */

  const formulario = $('form-seguro');
  const errorForm = $('form-error');

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    const nombre = String(datos.get('nombre') || '').trim();
    const deducibleCrudo = String(datos.get('deducible') || '').trim();
    const coaseguroCrudo = String(datos.get('coaseguro') || '').trim();
    const topeCrudo = String(datos.get('topeCoaseguro') || '').trim();
    const sumaCruda = String(datos.get('sumaAsegurada') || '').trim();
    const deducible = Number(deducibleCrudo);
    const coaseguroNuevo = Number(coaseguroCrudo) / 100;
    const sumaAsegurada = Number(sumaCruda);

    if (!nombre) return mostrarError('Ponle un nombre al seguro.');
    if (deducibleCrudo === '' || !Number.isFinite(deducible) || deducible < 0) {
      return mostrarError('Revisa el pago de entrada.');
    }
    if (coaseguroCrudo === '' || !Number.isFinite(coaseguroNuevo) || coaseguroNuevo < 0 || coaseguroNuevo > 1) {
      return mostrarError('Tu parte del resto va entre 0 y 100.');
    }
    if (sumaCruda === '' || !Number.isFinite(sumaAsegurada) || sumaAsegurada <= 0) {
      return mostrarError('Falta el máximo que paga la aseguradora.');
    }

    const nuevo = seguros.agregar({
      nombre,
      corto: nombre,
      deducible,
      coaseguro: coaseguroNuevo,
      topeCoaseguro: topeCrudo === '' ? null : Number(topeCrudo),
      sumaAsegurada,
    });

    estado.seguroId = nuevo.id;
    seguros.fijarActivo(nuevo.id);
    formulario.reset();
    mostrarError('');
    formulario.closest('details').open = false;
    traerNumerosDePoliza();
    sincronizarCampos(true);
    pintar();

    mostrarAviso(
      'form-aviso',
      seguros.persistente()
        ? ''
        : 'Este navegador no permite guardar datos: el seguro funciona mientras la página esté abierta.',
    );
  });

  function mostrarError(mensaje) {
    errorForm.hidden = !mensaje;
    errorForm.textContent = mensaje || '';
    return undefined;
  }

  /* ---------- popups de conceptos ---------- */

  document.addEventListener('click', (evento) => {
    const disparador = evento.target.closest('[data-dialogo]');
    if (disparador) {
      const dialogo = $(`dlg-${disparador.getAttribute('data-dialogo')}`);
      if (dialogo && typeof dialogo.showModal === 'function') {
        dialogo.showModal();
        return;
      }
    }

    // Cerrar al tocar fuera de la tarjeta.
    const abierto = evento.target.closest('dialog[open]');
    if (abierto && !evento.target.closest('.ficha-contenido')) abierto.close();
  });

  /* ---------- arranque ---------- */

  pintarEscenarios();
  pintarPrima();
  pintarCaracteristicas();

  const guardado = seguros.activo();
  const inicial = listaSeguros().find((seguro) => seguro.id === guardado);
  estado.seguroId = (inicial || listaSeguros()[0]).id;
  traerNumerosDePoliza();
  sincronizarCampos(true);
  fijarCuenta(estado.cuenta);
})();
