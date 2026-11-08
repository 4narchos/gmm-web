/*
 * propuestas.js — el resto de las dos propuestas: lo que cuesta al año y
 * qué incluye cada una. Datos tomados del cuadro comparativo de las pólizas.
 */
(function (root) {
  'use strict';

  const PROPUESTAS = {
    smnyl: {
      plan: 'Íntegro',
      zona: 'Yucatán',
      prima: {
        conceptos: [
          { nombre: 'Lo que cuesta el seguro en sí', glosa: 'prima básica', monto: 26_361.64 },
          { nombre: 'Extras que agregas', glosa: 'beneficios adicionales', monto: 1_538.44 },
          { nombre: 'Papelería y emisión', glosa: 'derecho de póliza', monto: 1_600 },
          { nombre: 'Impuesto', glosa: 'IVA 16%', monto: 4_720.01 },
        ],
        total: 34_220.09,
        pagos: [{ nombre: 'Un solo pago al año', monto: 34_220.09 }],
        notaPagos: 'No ofrece pagos diferidos: es anual.',
      },
      caracteristicas: {
        deducibleAccidente: 'Incluido: si el accidente te manda al hospital, no pagas el pago de entrada.',
        dental: 'Dental Premium: dos limpiezas gratis al año y descuento en resinas.',
        maternidad: 'Apoyo económico en parto o cesárea, más complicaciones del embarazo y del recién nacido.',
        urgencias: 'Orientación por teléfono (médica, nutricional, psicológica), ambulancia terrestre y referencias.',
        telemedicina: 'Orientación médica por teléfono.',
        familia: 'Protección Patrimonial: si falleces o quedas incapacitado, tu cónyuge e hijos menores de 25 años siguen asegurados cinco años sin pagar prima.',
        cancer: 'Enfermedades catastróficas incluidas en la cobertura.',
        rehabilitacion: 'Pago directo con los médicos que están en su red.',
        extranjero: 'Incluye asistencia en el extranjero, enfermedades catastróficas fuera del país y estudiantes o trabajadores en el extranjero.',
        antiguedad: 'Continuidad Preferente express: te permite seguir cubierta si cambias de plan.',
        hospitales: 'Red amplia de médicos y hospitales en convenio, con pago directo.',
        esperas: 'Día 1: accidentes, apendicitis, gastroenteritis, golpe de calor e infarto sin enfermedad coronaria. A los 10 meses: maternidad y recién nacido. Al tercer año: hemorroides, amígdalas, rodilla, hernias, litiasis, reflujo y padecimientos de senos o ginecológicos. Al cuarto año: preexistencias declaradas sin síntomas.',
        gastoUsual: 'Se paga conforme al tabulador de la red de la aseguradora.',
      },
    },
    allianz: {
      plan: 'Amplio',
      zona: 'Zona VI (incluye Yucatán)',
      prima: {
        conceptos: [
          { nombre: 'Lo que cuesta el seguro en sí', glosa: 'prima básica', monto: 17_569.78 },
          { nombre: 'Extras que agregas', glosa: 'beneficios adicionales', monto: 0 },
          { nombre: 'Papelería y emisión', glosa: 'derecho de póliza', monto: 1_800 },
          { nombre: 'Impuesto', glosa: 'IVA 16%', monto: 3_099.16 },
        ],
        total: 22_468.94,
        pagos: [
          { nombre: 'Un solo pago al año', monto: 22_468.94 },
          { nombre: 'En dos pagos (semestral)', monto: 23_319.28 },
          { nombre: 'En cuatro pagos (trimestral)', monto: 23_767.12 },
          { nombre: 'Mes con mes', monto: 24_072.36 },
        ],
        notaPagos: 'Pagar en partes cuesta un poco más al año.',
      },
      caracteristicas: {
        deducibleAccidente: 'Incluido: si el accidente te manda al hospital, no pagas el pago de entrada.',
        dental: 'Allianz Dental / Dental Más: dos evaluaciones y limpiezas al año.',
        maternidad: 'Cubre el embarazo entre los 15 y los 44 años, a partir de 10 meses de antigüedad.',
        urgencias: 'Servicio 911: ambulancia terrestre gratis hasta dos veces al año.',
        telemedicina: 'MiDocOnline: consultas digitales ilimitadas con médicos generales y especialistas (pediatras, psicólogos, nutriólogos).',
        familia: 'Módulo de Protección Familiar disponible como opción aparte.',
        cancer: 'Tu parte del resto baja a la mitad en quimioterapia acompañada por el equipo de manejo de casos (Case Management).',
        rehabilitacion: 'Segunda opinión médica para cirugías y terapias de rehabilitación sin límite de sesiones.',
        extranjero: 'Estudiar en el extranjero no está cubierto en la cotización base (se pide al año de antigüedad).',
        antiguedad: 'Reconoce antigüedad según los criterios de suscripción.',
        hospitales: 'Nivel Amplio: Star Médica, Hospital Faro del Mayab (Christus Muguerza), Clínica Videre y Oftalmérida.',
        esperas: '10 meses para maternidad. El resto de los padecimientos queda sujeto a las condiciones generales del producto.',
        gastoUsual: '100% del gasto usual y acostumbrado.',
      },
    },
  };

  // Cada fila: el tema, el emoji y la etiqueta con la que se busca en cada propuesta.
  const TEMAS = [
    { clave: 'deducibleAccidente', emoji: '🚑', titulo: 'Accidentes sin pago de entrada' },
    { clave: 'dental', emoji: '🦷', titulo: 'Dentista' },
    { clave: 'maternidad', emoji: '🤰', titulo: 'Embarazo, parto y recién nacido' },
    { clave: 'urgencias', emoji: '☎️', titulo: 'Urgencias y orientación' },
    { clave: 'telemedicina', emoji: '💻', titulo: 'Consultas a distancia' },
    { clave: 'familia', emoji: '👨‍👩‍👧', titulo: 'Si te pasa algo, tu familia' },
    { clave: 'cancer', emoji: '🎗️', titulo: 'Cáncer y quimioterapia' },
    { clave: 'rehabilitacion', emoji: '🦵', titulo: 'Rehabilitación y segunda opinión' },
    { clave: 'extranjero', emoji: '✈️', titulo: 'Fuera del país' },
    { clave: 'antiguedad', emoji: '🔗', titulo: 'Continuidad y antigüedad' },
    { clave: 'hospitales', emoji: '🏥', titulo: 'Hospitales en Mérida' },
    { clave: 'esperas', emoji: '⏳', titulo: 'Tiempos de espera' },
    { clave: 'gastoUsual', emoji: '🧾', titulo: 'Gasto usual y acostumbrado' },
  ];

  root.GMM_PROPUESTAS = { PROPUESTAS, TEMAS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
