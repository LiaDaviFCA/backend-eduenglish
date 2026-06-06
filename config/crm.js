// config/crm.js
// Integración con HubSpot CRM vía API v3
// Documentación: https://developers.hubspot.com/docs/api/crm/contacts

const fetch = require('node-fetch');
const { pool } = require('../db/connection');

const HUBSPOT_API = 'https://api.hubapi.com/crm/v3/objects/contacts';

/**
 * Envía un lead al CRM (HubSpot) y actualiza el registro en BD.
 * Se llama de forma asíncrona después de guardar en BD,
 * para que un fallo del CRM no bloquee la respuesta al usuario.
 */
async function enviarAlCRM(leadId, leadData) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  // Si no hay token configurado, solo loguea y sale
  if (!token || token.startsWith('pat-na1-xxxxx')) {
    console.log(`[CRM] ⚠️  Token no configurado. Lead ${leadId} no enviado al CRM (modo desarrollo).`);
    return;
  }

  try {
    // Mapear campos al esquema de HubSpot
    const hubspotPayload = {
      properties: {
        firstname:   leadData.nombre_completo.split(' ')[0],
        lastname:    leadData.nombre_completo.split(' ').slice(1).join(' '),
        phone:       leadData.telefono,
        email:       leadData.correo_electronico,
        // Propiedades personalizadas (créalas en HubSpot Settings > Properties)
        nivel_ingles:         leadData.nivel_ingles,
        modalidad_preferida:  leadData.modalidad_preferida,
        horario_preferido:    leadData.horario_preferido,
        motivo_estudio:       leadData.motivo_estudio || '',
        desea_prueba_nivel:   leadData.desea_prueba_nivel ? 'Sí' : 'No',
        origen_lead:          leadData.origen,
        hs_lead_status:       'NEW'
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

    // Actualizar BD: marcar como enviado al CRM
    await pool.execute(
      `UPDATE leads_escuela_ingles
       SET crm_enviado = 1, crm_fecha_envio = NOW(), crm_contact_id = ?
       WHERE id = ?`,
      [crmContactId, leadId]
    );

    console.log(`[CRM] ✅ Lead ${leadId} → HubSpot contacto ID ${crmContactId}`);

  } catch (err) {
    // El fallo del CRM NO detiene el flujo; el lead ya está en BD
    console.error(`[CRM] ❌ Error al enviar lead ${leadId}:`, err.message);
    // En producción aquí podrías encolar el reintento (Redis, Bull, etc.)
  }
}

module.exports = { enviarAlCRM };
