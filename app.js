/*
 * app.js — pega la fórmula y los datos con la pantalla.
 * Sin framework: todo es estado simple + volver a pintar.
 */
(function () {
  'use strict';

  const pesos = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });
  const dinero = (valor) => pesos.format(Math.round(valor));
  const cuentaHumana = (valor) => `$${Math.round(valor).toLocaleString('es-MX')}`;

  const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter]);

  const MINIMO = 10_000;
  const MAXIMO = 2_000_000;

  const estado = {
    cuenta: 150_000,
    seguroId: null,
  };

  const $ = (id) => document.getElementById(id);
  const seguros = window.GMM_SEGUROS;
  const { calcular } = window.GMM;

  /* ---------- controles ---------- */

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
    const nodoAviso = $('cuenta-aviso');
    nodoAviso.hidden = !aviso;
    nodoAviso.textContent = aviso;

    pintar();
  }

  slider.addEventListener('input', (evento) => fijarCuenta(evento.target.value, 'slider'));
  numero.addEventListener('input', (evento) => {
    const soloDigitos = evento.target.value.replace(/[^\d]/g, '');
    if (soloDigitos !== evento.target.value) evento.target.value = soloDigitos;
    fijarCuenta(soloDigitos || 0, 'numero');
  });
  numero.addEventListener('blur', () => {
    // La caja siempre termina mostrando el número con el que se calculó.
    numero.value = String(estado.cuenta);
  });

  function listaSeguros() {
    return seguros.todos();
  }

  function seguroActivo() {
    const lista = listaSeguros();
    return lista.find((seguro) => seguro.id === estado.seguroId) || lista[0];
  }

  function elegirSeguro(id) {
    estado.seguroId = id;
    seguros.fijarActivo(id);
    pintar();
    const activo = pills.querySelector('[aria-pressed="true"]');
    if (activo) activo.focus({ preventScroll: true });
  }

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

  function pintarBarra(calculo) {
    const cuenta = calculo.cuenta;
    const porcentajeTuyo = cuenta > 0 ? (calculo.totalTuyo / cuenta) * 100 : 0;
    const porcentajeAseguradora = 100 - porcentajeTuyo;

    $('barra-tuya').style.width = `${porcentajeTuyo}%`;
    $('barra-aseguradora').style.width = `${porcentajeAseguradora}%`;

    const texto = (nodo, valor, porcentaje) => {
      nodo.textContent = porcentaje >= 14 ? dinero(valor) : '';
    };
    texto($('barra-tuya-texto'), calculo.totalTuyo, porcentajeTuyo);
    texto($('barra-aseguradora-texto'), calculo.pagaAseguradora, porcentajeAseguradora);

    $('barra').setAttribute(
      'aria-label',
      `De ${dinero(cuenta)}, ${dinero(calculo.totalTuyo)} salen de tu bolsa y ${dinero(calculo.pagaAseguradora)} los paga la aseguradora.`,
    );
  }

  function pintarDesglose(calculo, seguro) {
    $('renglon-entrada').textContent = dinero(calculo.pagoDeEntrada);

    const porcentaje = Math.round(calculo.coaseguro * 100);
    const sobrante = Math.max(calculo.cuenta - calculo.deducible, 0);
    $('renglon-porcentaje').textContent =
      sobrante > 0 ? `(${porcentaje}% de ${dinero(sobrante)})` : '';
    $('renglon-resto').textContent = dinero(calculo.tuParteDelResto);

    const avisoTope = $('aviso-tope');
    if (calculo.topeAplicado && calculo.tope !== null) {
      const sinTope = sobrante * calculo.coaseguro;
      avisoTope.hidden = false;
      avisoTope.textContent =
        `Tu ${porcentaje}% serían ${dinero(sinTope)}, pero tu techo es ${dinero(calculo.tope)}: ` +
        `no pagas más de eso. Aquí está tu ahorro.`;
    } else if (calculo.tope === null && sobrante > 0) {
      avisoTope.hidden = false;
      avisoTope.textContent =
        `Este seguro no trae techo escrito para tu parte del resto. ` +
        `Con una cuenta enorme, ese ${porcentaje}% no tiene freno.`;
    } else {
      avisoTope.hidden = true;
      avisoTope.textContent = '';
    }

    $('renglon-total').textContent = dinero(calculo.totalTuyo);
    $('renglon-aseguradora').textContent = dinero(calculo.pagaAseguradora);

    const filaExcedente = $('renglon-excedente-fila');
    if (calculo.excedente > 0) {
      filaExcedente.hidden = false;
      $('renglon-excedente').textContent = dinero(calculo.excedente);
    } else {
      filaExcedente.hidden = true;
      $('renglon-excedente').textContent = '';
    }

    const avisoSuma = $('aviso-suma');
    if (calculo.excedeSuma) {
      avisoSuma.hidden = false;
      avisoSuma.textContent =
        `La cuenta rebasa el máximo que paga la aseguradora (${dinero(calculo.sumaAsegurada)}). ` +
        `Ella paga su tope y la diferencia sale de tu bolsa.`;
    } else {
      avisoSuma.hidden = true;
      avisoSuma.textContent = '';
    }
  }

  function tarjetaSeguro(seguro, calculo, esActivo) {
    const articulo = document.createElement('article');
    articulo.className = 'tarjeta-seguro' + (esActivo ? ' es-activo' : '');

    const porcentajeTuyo = calculo.cuenta > 0 ? (calculo.totalTuyo / calculo.cuenta) * 100 : 0;
    const porcentaje = Math.round(calculo.coaseguro * 100);

    articulo.innerHTML = `
      <header class="tarjeta-seguro-cabecera">
        <h3>${escapar(seguro.nombre)}</h3>
        ${esActivo ? '<span class="marca-activo">En el simulador</span>' : ''}
      </header>
      <p class="tarjeta-seguro-total">${dinero(calculo.totalTuyo)}<small> de tu bolsa</small></p>
      <div class="mini-barra" aria-hidden="true">
        <span class="mini-tuya" style="width:${porcentajeTuyo.toFixed(2)}%"></span>
      </div>
      <ul class="tarjeta-seguro-datos">
        <li><span>Pago de entrada</span><strong>${dinero(seguro.deducible)}</strong></li>
        <li><span>Tu parte del resto</span><strong>${porcentaje}%${calculo.tope !== null ? ` · techo ${dinero(calculo.tope)}` : ' · tope no indicado'}</strong></li>
        <li><span>Máximo aseguradora</span><strong>${dinero(seguro.sumaAsegurada)}</strong></li>
        ${seguro.prima ? `<li><span>Prima al año</span><strong>${dinero(seguro.prima)}</strong></li>` : ''}
      </ul>
      ${seguro.avisoTope ? `<p class="aviso-suave">⚠️ ${escapar(seguro.avisoTope)}</p>` : ''}
      ${calculo.excedeSuma ? '<p class="aviso-suave">⚠️ La cuenta rebasa el máximo asegurado.</p>' : ''}
      ${seguro.propio ? `<button class="quitar" type="button" data-quitar="${escapar(seguro.id)}">Quitar este seguro</button>` : ''}
    `;

    return articulo;
  }

  function pintarComparador() {
    const contenedor = $('comparador');
    const activo = seguroActivo();
    contenedor.textContent = '';
    listaSeguros().forEach((seguro) => {
      const calculo = calcular({
        cuenta: estado.cuenta,
        deducible: seguro.deducible,
        coaseguro: seguro.coaseguro,
        topeCoaseguro: seguro.topeCoaseguro,
        sumaAsegurada: seguro.sumaAsegurada,
      });
      contenedor.appendChild(tarjetaSeguro(seguro, calculo, seguro.id === activo.id));
    });

    $('cuenta-compara').textContent = cuentaHumana(estado.cuenta);
  }

  function pintarEscenarios() {
    const lista = $('escenarios-lista');
    lista.textContent = '';
    (window.GMM_ESCENARIOS ? window.GMM_ESCENARIOS.CASOS : []).forEach((caso) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'chip' + (caso.fuerte ? ' chip-fuerte' : '');
      boton.textContent = `${caso.emoji} ${caso.nombre}`;
      boton.title = `Cuenta de ${dinero(caso.costo)}${caso.nota ? ` — ${caso.nota}` : ''}`;
      boton.addEventListener('click', () => fijarCuenta(caso.costo));
      lista.appendChild(boton);
    });
  }

  function pintar() {
    const seguro = seguroActivo();
    const calculo = calcular({
      cuenta: estado.cuenta,
      deducible: seguro.deducible,
      coaseguro: seguro.coaseguro,
      topeCoaseguro: seguro.topeCoaseguro,
      sumaAsegurada: seguro.sumaAsegurada,
    });

    pintarPills();
    pintarBarra(calculo);
    pintarDesglose(calculo, seguro);
    pintarComparador();
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
    const coaseguro = Number(coaseguroCrudo) / 100;
    const sumaAsegurada = Number(sumaCruda);

    if (!nombre) return mostrarError('Ponle un nombre al seguro.');
    if (deducibleCrudo === '' || !Number.isFinite(deducible) || deducible < 0) {
      return mostrarError('Revisa el pago de entrada.');
    }
    if (coaseguroCrudo === '' || !Number.isFinite(coaseguro) || coaseguro < 0 || coaseguro > 1) {
      return mostrarError('Tu parte del resto va entre 0 y 100.');
    }
    if (sumaCruda === '' || !Number.isFinite(sumaAsegurada) || sumaAsegurada <= 0) {
      return mostrarError('Falta el máximo que paga la aseguradora.');
    }

    const nuevo = seguros.agregar({
      nombre,
      corto: nombre,
      deducible,
      coaseguro,
      topeCoaseguro: topeCrudo === '' ? null : Number(topeCrudo),
      sumaAsegurada,
    });

    estado.seguroId = nuevo.id;
    seguros.fijarActivo(nuevo.id);
    formulario.reset();
    mostrarError('');
    formulario.closest('details').open = false;
    pintar();

    // Si el navegador no guarda datos, decirlo en la propia sección.
    const avisoForm = $('form-aviso');
    if (seguros.persistente()) {
      avisoForm.hidden = true;
      avisoForm.textContent = '';
    } else {
      avisoForm.hidden = false;
      avisoForm.textContent =
        'Este navegador no permite guardar datos: el seguro funciona mientras la página esté abierta.';
    }
  });

  function mostrarError(mensaje) {
    errorForm.hidden = !mensaje;
    errorForm.textContent = mensaje || '';
    return undefined;
  }

  $('comparador').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-quitar]');
    if (!boton) return;
    const id = boton.getAttribute('data-quitar');
    seguros.eliminar(id);
    if (estado.seguroId === id) estado.seguroId = listaSeguros()[0].id;
    pintar();
    const activo = pills.querySelector('[aria-pressed="true"]');
    if (activo) activo.focus({ preventScroll: true });
  });

  /* ---------- arranque ---------- */

  pintarEscenarios();
  const guardado = seguros.activo();
  const inicial = listaSeguros().find((seguro) => seguro.id === guardado);
  estado.seguroId = (inicial || listaSeguros()[0]).id;
  fijarCuenta(estado.cuenta);
})();
