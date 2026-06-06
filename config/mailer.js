// config/mailer.js
// Servicio de correos — EduEnglishMx
// Proveedor: Resend (resend.com) — sin restricciones de red en Railway
// Envía dos correos por cada lead:
//   1. Notificación al área comercial (ventas)
//   2. Confirmación de registro al prospecto

const { Resend } = require('resend');

// ─── CLIENTE RESEND ──────────────────────────────────────────
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── HELPER: color de nivel ──────────────────────────────────
function nivelColor(nivel) {
  const map = {
    'Sin conocimientos': '#6A3DB8',
    'Básico':            '#1A6B3C',
    'Intermedio':        '#C9973A',
    'Avanzado':          '#0E6B6B',
    'No lo sé':          '#888888'
  };
  return map[nivel] || '#2E4A8B';
}

// ═══════════════════════════════════════════════════════════
// 1. CORREO AL ÁREA COMERCIAL (ventas)
// ═══════════════════════════════════════════════════════════
async function notificarVentas(leadId, lead) {
  const destino = process.env.MAIL_VENTAS;
  if (!destino) {
    console.log('[MAIL] ⚠️  MAIL_VENTAS no configurado. Notificación omitida.');
    return;
  }

  const resend = getResend();
  const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F0F4FC;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FC;padding:32px 0">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">

          <tr>
            <td style="background:#0E6B6B;padding:28px 36px;">
              <p style="margin:0;color:#D0ECEC;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">EduEnglishMx · Área Comercial</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700">Nuevo Lead Registrado</h1>
            </td>
          </tr>

          <tr>
            <td style="background:#1A6B3C;padding:14px 36px">
              <p style="margin:0;color:#ffffff;font-size:14px">
                <strong>ID:</strong> LEAD-${leadId} &nbsp;|&nbsp;
                <strong>Fecha:</strong> ${fecha} &nbsp;|&nbsp;
                <strong>Origen:</strong> Landing Page
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 36px">
              <h2 style="margin:0 0 20px;color:#0E6B6B;font-size:16px;border-bottom:2px solid #D0ECEC;padding-bottom:10px">Datos del Prospecto</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${filaInfo('Nombre', lead.nombre_completo)}
                ${filaInfo('Edad', lead.edad + ' años')}
                ${filaInfo('Teléfono', lead.telefono)}
                ${filaInfo('Correo', lead.correo_electronico)}
              </table>

              <h2 style="margin:28px 0 20px;color:#1A6B3C;font-size:16px;border-bottom:2px solid #D4EDDA;padding-bottom:10px">Preferencias Académicas</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${filaInfo('Nivel de inglés', `<span style="background:${nivelColor(lead.nivel_ingles)};color:#fff;padding:3px 10px;border-radius:100px;font-size:13px">${lead.nivel_ingles}</span>`)}
                ${filaInfo('Modalidad', lead.modalidad_preferida)}
                ${filaInfo('Horario', lead.horario_preferido)}
                ${filaInfo('Motivo', lead.motivo_estudio || '<span style="color:#888">No especificado</span>')}
                ${filaInfo('Prueba de nivel', lead.desea_prueba_nivel ? 'Sí la quiere' : 'No por ahora')}
                ${lead.comentarios ? filaInfo('Comentarios', lead.comentarios) : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 32px">
              <div style="background:#F5F8FF;border-radius:10px;padding:20px;border-left:4px solid #0E6B6B">
                <p style="margin:0 0 8px;font-size:14px;color:#444;font-weight:600">Acción recomendada</p>
                <p style="margin:0;font-size:13px;color:#666">
                  Contactar al prospecto en las próximas <strong>24 horas</strong> para mayor probabilidad de conversión.
                  ${lead.desea_prueba_nivel ? '<br><strong>Recuerda:</strong> solicitó una prueba de nivel gratuita.' : ''}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#F0F4FC;padding:20px 36px;text-align:center;border-top:1px solid #DDD5C8">
              <p style="margin:0;font-size:12px;color:#888">
                EduEnglishMx — Sistema de Captación de Leads v1.0
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;

  const { error } = await resend.emails.send({
    from:    'EduEnglishMx Leads <onboarding@resend.dev>',
    to:      destino,
    subject: `Nuevo lead registrado — ${lead.nombre_completo} [LEAD-${leadId}]`,
    html
  });

  if (error) throw new Error(error.message);
  console.log(`[MAIL] ✅ Notificación enviada a ventas (${destino}) — LEAD-${leadId}`);
}

// ═══════════════════════════════════════════════════════════
// 2. CORREO DE CONFIRMACIÓN AL PROSPECTO
// ═══════════════════════════════════════════════════════════
async function confirmarProspecto(leadId, lead) {
  const resend = getResend();

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F0F4FC;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FC;padding:32px 0">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">

          <tr>
            <td style="background:#0E6B6B;padding:40px 36px;text-align:center">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px">✓</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700">¡Gracias por tu interés!</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:15px">Tu registro fue recibido correctamente</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 36px 20px">
              <p style="margin:0;font-size:16px;color:#333">
                Hola, <strong>${lead.nombre_completo.split(' ')[0]}</strong>
              </p>
              <p style="margin:14px 0 0;font-size:15px;color:#555;line-height:1.7">
                Recibimos tu solicitud de información en <strong>EduEnglishMx</strong>.
                Un asesor personal revisará tu perfil y se pondrá en contacto contigo
                en las próximas <strong>24 horas hábiles</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 28px">
              <div style="background:#F5F8FF;border-radius:12px;padding:24px;border:1px solid #D0ECEC">
                <h2 style="margin:0 0 18px;color:#0E6B6B;font-size:15px;font-weight:700">Resumen de tu registro</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${filaResumen('Modalidad', lead.modalidad_preferida)}
                  ${filaResumen('Horario preferido', lead.horario_preferido)}
                  ${filaResumen('Nivel de inglés', lead.nivel_ingles)}
                  ${filaResumen('ID de registro', `LEAD-${leadId}`)}
                </table>
                ${lead.desea_prueba_nivel ? `
                <div style="margin-top:16px;background:#D4EDDA;border-radius:8px;padding:12px 16px;border-left:3px solid #1A6B3C">
                  <p style="margin:0;font-size:13px;color:#1A6B3C;font-weight:600">
                    Solicitaste una prueba de nivel gratuita. Tu asesor te indicará cómo tomarla.
                  </p>
                </div>` : ''}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 28px">
              <h2 style="margin:0 0 16px;color:#333;font-size:15px;font-weight:700">¿Qué sigue?</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${pasoSiguiente('1', '#0E6B6B', 'Tu asesor te contactará', 'En menos de 24 horas hábiles por teléfono o correo.')}
                ${pasoSiguiente('2', '#1A6B3C', 'Conoce tu nivel', lead.desea_prueba_nivel ? 'Realizarás una prueba de nivel gratuita de 15 min.' : 'Te orientamos según el nivel que nos indicaste.')}
                ${pasoSiguiente('3', '#C9973A', 'Elige tu plan', 'Te presentamos los horarios y modalidades disponibles.')}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 32px">
              <div style="background:#FFF8F0;border-radius:10px;padding:18px;border-left:4px solid #C9973A;text-align:center">
                <p style="margin:0 0 6px;font-size:13px;color:#666">¿Tienes dudas inmediatas? Contáctanos:</p>
                <p style="margin:0;font-size:15px;font-weight:700;color:#C9973A">
                  722-123-4567 &nbsp;|&nbsp; hola@eduenglishmx.mx
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#0D1117;padding:24px 36px;text-align:center">
              <p style="margin:0 0 6px;color:#D0ECEC;font-size:15px;font-weight:700">EduEnglishMx</p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45)">
                Metepec, Estado de México &nbsp;|&nbsp; hola@eduenglishmx.mx
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.3)">
                Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;

  const { error } = await resend.emails.send({
    from:    'EduEnglishMx <onboarding@resend.dev>',
    to:      lead.correo_electronico,
    subject: `¡Gracias por tu interés en EduEnglishMx, ${lead.nombre_completo.split(' ')[0]}!`,
    html
  });

  if (error) throw new Error(error.message);
  console.log(`[MAIL] ✅ Confirmación enviada al prospecto (${lead.correo_electronico}) — LEAD-${leadId}`);
}

// ─── HELPERS HTML ────────────────────────────────────────────
function filaInfo(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F0F4FC;width:40%">
        <span style="font-size:13px;color:#888;font-weight:500">${label}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #F0F4FC">
        <span style="font-size:14px;color:#222;font-weight:600">${value}</span>
      </td>
    </tr>`;
}

function filaResumen(label, value) {
  return `
    <tr>
      <td style="padding:6px 0;width:45%"><span style="font-size:13px;color:#666">${label}</span></td>
      <td style="padding:6px 0"><span style="font-size:13px;color:#0E6B6B;font-weight:600">${value}</span></td>
    </tr>`;
}

function pasoSiguiente(num, color, titulo, desc) {
  return `
    <tr>
      <td style="padding:8px 0;vertical-align:top">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:14px">
              <div style="width:28px;height:28px;background:${color};border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:700;font-size:13px">${num}</div>
            </td>
            <td style="vertical-align:top;padding-top:4px">
              <p style="margin:0;font-size:14px;font-weight:600;color:#333">${titulo}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#666">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// ═══════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════
async function enviarCorreos(leadId, lead) {
  const resultados = await Promise.allSettled([
    notificarVentas(leadId, lead),
    confirmarProspecto(leadId, lead)
  ]);

  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      const tipo = i === 0 ? 'notificación a ventas' : 'confirmación al prospecto';
      console.error(`[MAIL] ❌ Error en ${tipo}:`, r.reason?.message);
    }
  });
}

module.exports = { enviarCorreos };
