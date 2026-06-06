// middleware/validateLead.js
// Segunda capa de validación (server-side) — complementa la validación del frontend

const NIVEL_VALORES     = ['Sin conocimientos','Básico','Intermedio','Avanzado','No lo sé'];
const MODALIDAD_VALORES = ['Presencial','En línea','Híbrida','Sin preferencia'];
const HORARIO_VALORES   = ['Mañana','Tarde','Noche','Sábados','Domingos','Sin preferencia'];
const MOTIVO_VALORES    = ['Escuela','Trabajo','Viaje','Certificación','Conversación','Regularización','Desarrollo personal'];

function validateLead(req, res, next) {
  const body   = req.body;
  const errors = [];

  // ── Nombre completo ──────────────────────────────────────
  if (!body.nombre_completo || typeof body.nombre_completo !== 'string') {
    errors.push({ campo: 'nombre_completo', mensaje: 'El nombre completo es obligatorio.' });
  } else if (body.nombre_completo.trim().length < 3 || body.nombre_completo.trim().length > 150) {
    errors.push({ campo: 'nombre_completo', mensaje: 'El nombre debe tener entre 3 y 150 caracteres.' });
  }

  // ── Edad ─────────────────────────────────────────────────
  const edad = parseInt(body.edad);
  if (!body.edad && body.edad !== 0) {
    errors.push({ campo: 'edad', mensaje: 'La edad es obligatoria.' });
  } else if (isNaN(edad) || edad < 5 || edad > 99) {
    errors.push({ campo: 'edad', mensaje: 'La edad debe ser un número entre 5 y 99.' });
  }

  // ── Teléfono ─────────────────────────────────────────────
  if (!body.telefono) {
    errors.push({ campo: 'telefono', mensaje: 'El teléfono es obligatorio.' });
  } else if (!/^\d{10}$/.test(String(body.telefono).trim())) {
    errors.push({ campo: 'telefono', mensaje: 'El teléfono debe contener exactamente 10 dígitos.' });
  }

  // ── Correo ───────────────────────────────────────────────
  if (!body.correo_electronico) {
    errors.push({ campo: 'correo_electronico', mensaje: 'El correo electrónico es obligatorio.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.correo_electronico)) {
    errors.push({ campo: 'correo_electronico', mensaje: 'El correo electrónico no tiene un formato válido.' });
  }

  // ── Nivel de inglés ──────────────────────────────────────
  if (!body.nivel_ingles) {
    errors.push({ campo: 'nivel_ingles', mensaje: 'El nivel de inglés es obligatorio.' });
  } else if (!NIVEL_VALORES.includes(body.nivel_ingles)) {
    errors.push({ campo: 'nivel_ingles', mensaje: 'Valor no válido para nivel de inglés.' });
  }

  // ── Modalidad ────────────────────────────────────────────
  if (!body.modalidad_preferida) {
    errors.push({ campo: 'modalidad_preferida', mensaje: 'La modalidad preferida es obligatoria.' });
  } else if (!MODALIDAD_VALORES.includes(body.modalidad_preferida)) {
    errors.push({ campo: 'modalidad_preferida', mensaje: 'Valor no válido para modalidad.' });
  }

  // ── Horario ──────────────────────────────────────────────
  if (!body.horario_preferido) {
    errors.push({ campo: 'horario_preferido', mensaje: 'El horario preferido es obligatorio.' });
  } else if (!HORARIO_VALORES.includes(body.horario_preferido)) {
    errors.push({ campo: 'horario_preferido', mensaje: 'Valor no válido para horario.' });
  }

  // ── Motivo (opcional) ────────────────────────────────────
  if (body.motivo_estudio && !MOTIVO_VALORES.includes(body.motivo_estudio)) {
    errors.push({ campo: 'motivo_estudio', mensaje: 'Valor no válido para motivo de estudio.' });
  }

  // ── Prueba de nivel ──────────────────────────────────────
  if (body.desea_prueba_nivel === undefined || body.desea_prueba_nivel === null) {
    errors.push({ campo: 'desea_prueba_nivel', mensaje: 'Indica si deseas prueba de nivel.' });
  }

  // ── Aviso de privacidad ──────────────────────────────────
  if (!body.acepta_privacidad) {
    errors.push({ campo: 'acepta_privacidad', mensaje: 'Debes aceptar el aviso de privacidad.' });
  }

  // ── Resultado ────────────────────────────────────────────
  if (errors.length > 0) {
    return res.status(400).json({
      ok:      false,
      mensaje: 'Datos inválidos. Revisa los campos indicados.',
      errores: errors
    });
  }

  // Sanitizar y adjuntar al request limpio
  req.leadData = {
    nombre_completo:    body.nombre_completo.trim(),
    edad:               edad,
    telefono:           String(body.telefono).trim(),
    correo_electronico: body.correo_electronico.trim().toLowerCase(),
    nivel_ingles:       body.nivel_ingles,
    modalidad_preferida:body.modalidad_preferida,
    horario_preferido:  body.horario_preferido,
    motivo_estudio:     body.motivo_estudio || null,
    desea_prueba_nivel: body.desea_prueba_nivel ? 1 : 0,
    comentarios:        body.comentarios ? String(body.comentarios).trim().substring(0, 1000) : null,
    acepta_privacidad:  1,
    origen:             'Landing Page',
    ip_origen:          req.ip || req.headers['x-forwarded-for'] || null
  };

  next();
}

module.exports = validateLead;
