// config/crm.js
// Integración con HubSpot CRM vía API v3
// Usa Service Key (pat-na1-xxx) con campos estándar

const fetch = require('node-fetch');
const { pool } = require('../db/connection');

const HUBSPOT_API = 'https://api.hubapi.com/crm/v3/objects/contacts';

async function enviarAlCRM(leadId, leadData) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!token || token.includes('xxxxx')) {
    console.log(`[CRM] ⚠️  Token no configurado. Lead ${leadId} no enviado al CRM.`);
    return;
  }

  try {
    const nombreParts = leadData.nombre_completo.split(' ');
    const firstname = nombreParts[0];
    const lastname  = nombreParts.slice(1).join(' ') || '';

    const hubspotPayload = {
      properties: {
        // Campos estándar
        firstname,
        lastname,
        phone:          leadData.telefono,
        email:          leadData.correo_electronico,
        hs_lead_status: 'NEW',

        // Campos personalizados
        edad:                String(leadData.edad),
        nivel_ingles:        leadData.nivel_ingles        || '',
        modalidad_preferida: leadData.modalidad_preferida || '',
        horario_preferido:   leadData.horario_preferido   || '',
        motivo_estudio:      leadData.motivo_estudio      || '',
        desea_prueba_nivel:  leadData.desea_prueba_nivel ? 'true' : 'false',
        comentarios:         leadData.comentarios         || ''
      }
    };

    const response = await fetch(HUBSPOT_API, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(hubspotPayload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HubSpot respondió con ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    const crmContactId = result.id;

    await pool.execute(
      `UPDATE leads_escuela_ingles
       SET crm_enviado = 1, crm_fecha_envio = NOW(), crm_contact_id = ?
       WHERE id = ?`,
      [crmContactId, leadId]
    );

    console.log(`[CRM] ✅ Lead ${leadId} → HubSpot contacto ID ${crmContactId}`);

  } catch (err) {
    console.error(`[CRM] ❌ Error al enviar lead ${leadId}:`, err.message);
  }
}

module.exports = { enviarAlCRM };
