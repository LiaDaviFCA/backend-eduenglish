// routes/leads.js
// Rutas del módulo de leads

const express      = require('express');
const router       = express.Router();
const { pool }     = require('../db/connection');
const validateLead = require('../middleware/validateLead');
const { enviarAlCRM }  = require('../config/crm');
const { enviarCorreos } = require('../config/mailer');

// ──────────────────────────────────────────────────────────
// POST /api/leads
// Recibe, valida, guarda en BD y envía al CRM
// ──────────────────────────────────────────────────────────
router.post('/', validateLead, async (req, res) => {
  const lead = req.leadData;

  try {
    // 1. Insertar en BD
    const [result] = await pool.execute(
      `INSERT INTO leads_escuela_ingles
         (nombre_completo, edad, telefono, correo_electronico,
          nivel_ingles, modalidad_preferida, horario_preferido,
          motivo_estudio, desea_prueba_nivel, comentarios,
          acepta_privacidad, origen, ip_origen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lead.nombre_completo,
        lead.edad,
        lead.telefono,
        lead.correo_electronico,
        lead.nivel_ingles,
        lead.modalidad_preferida,
        lead.horario_preferido,
        lead.motivo_estudio,
        lead.desea_prueba_nivel,
        lead.comentarios,
        lead.acepta_privacidad,
        lead.origen,
        lead.ip_origen
      ]
    );

    const leadId = result.insertId;
    console.log(`[BD] ✅ Lead guardado — ID: ${leadId} | ${lead.nombre_completo} | ${lead.correo_electronico}`);

    // 2. Responder al usuario ANTES del CRM (no hacerlo esperar)
    res.status(201).json({
      ok:       true,
      mensaje:  '¡Registro exitoso! Un asesor se pondrá en contacto contigo en menos de 24 horas.',
      lead_id:  `LEAD-${leadId}`,
      datos: {
        nombre: lead.nombre_completo,
        correo: lead.correo_electronico
      }
    });

    // 3. Enviar correos y CRM de forma asíncrona (no bloquean la respuesta)
    enviarCorreos(leadId, lead);
    enviarAlCRM(leadId, lead);

  } catch (err) {
    console.error('[BD] ❌ Error al guardar lead:', err.message);
    res.status(500).json({
      ok:      false,
      mensaje: 'Ocurrió un error al guardar tu información. Por favor intenta nuevamente.'
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/leads
// Lista todos los leads (protegido: solo para admin/desarrollo)
// En producción añade autenticación (JWT, API Key, etc.)
// ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  // Verificación básica de API Key para producción
  const apiKey = req.headers['x-api-key'];
  if (process.env.NODE_ENV === 'production' && apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre_completo, edad, telefono, correo_electronico,
              nivel_ingles, modalidad_preferida, horario_preferido,
              motivo_estudio, desea_prueba_nivel, crm_enviado,
              fecha_registro, origen
       FROM leads_escuela_ingles
       ORDER BY fecha_registro DESC
       LIMIT 100`
    );

    res.json({
      ok:    true,
      total: rows.length,
      leads: rows
    });
  } catch (err) {
    console.error('[BD] ❌ Error al listar leads:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/leads/:id
// Obtiene un lead por su ID
// ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM leads_escuela_ingles WHERE id = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Lead no encontrado.' });
    res.json({ ok: true, lead: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
});

module.exports = router;
