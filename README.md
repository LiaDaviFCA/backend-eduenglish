# Backend EduEnglish – Sistema de Captación de Leads

**Modelos de Evaluación de Software – 2026A**

Backend RESTful en Node.js + Express para capturar leads de la Landing Page de EduEnglish, almacenarlos en MySQL e integrarlos con HubSpot CRM.

---

## Estructura del Proyecto

```
backend-eduenglish/
├── server.js              ← Punto de entrada
├── package.json
├── .env.example           ← Variables de entorno (copia a .env)
├── db/
│   ├── connection.js      ← Pool de conexiones MySQL
│   └── schema.sql         ← Script de creación de BD y tabla
├── routes/
│   └── leads.js           ← Endpoints GET/POST /api/leads
├── middleware/
│   └── validateLead.js    ← Validación server-side de datos
└── config/
    └── crm.js             ← Integración con HubSpot API
```

---

## Instalación Local (desarrollo)

### Requisitos previos
- Node.js 18+
- MySQL 8.0+ (local o en la nube)

### Pasos

```bash
# 1. Clonar o descomprimir el proyecto
cd backend-eduenglish

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales reales

# 4. Crear la base de datos
mysql -u root -p < db/schema.sql

# 5. Iniciar en modo desarrollo
npm run dev
```

El servidor estará en `http://localhost:3000`

---

## Conectar la Landing Page al Backend

En `landing_escuela_ingles.html`, busca la línea:
```js
await new Promise(r => setTimeout(r, 1800)); // simulación
```

Y reemplaza TODO el bloque de simulación por:
```js
const response = await fetch('https://tu-backend.com/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre_completo:    lead.nombre_completo,
    edad:               lead.edad,
    telefono:           lead.telefono,
    correo_electronico: lead.correo_electronico,
    nivel_ingles:       lead.nivel_ingles,
    modalidad_preferida:lead.modalidad_preferida,
    horario_preferido:  lead.horario_preferido,
    motivo_estudio:     lead.motivo_estudio,
    desea_prueba_nivel: lead.desea_prueba_nivel,
    comentarios:        lead.comentarios,
    acepta_privacidad:  true
  })
});

if (!response.ok) throw new Error('Error del servidor');
const data = await response.json();
lead.id = data.lead_id;   // Usa el ID real de BD
```

---

## Endpoints disponibles

| Método | Ruta             | Descripción                              |
|--------|-----------------|------------------------------------------|
| GET    | `/health`        | Estado del servidor                      |
| POST   | `/api/leads`     | Crear nuevo lead (desde el formulario)   |
| GET    | `/api/leads`     | Listar todos los leads (requiere API Key en producción) |
| GET    | `/api/leads/:id` | Obtener un lead por ID                   |

### Ejemplo POST `/api/leads`
```json
{
  "nombre_completo":    "Mariana Torres",
  "edad":               19,
  "telefono":           "7291234567",
  "correo_electronico": "mariana@email.com",
  "nivel_ingles":       "Básico",
  "modalidad_preferida":"En línea",
  "horario_preferido":  "Sábados",
  "motivo_estudio":     "Trabajo",
  "desea_prueba_nivel": true,
  "acepta_privacidad":  true
}
```

### Respuesta exitosa (201)
```json
{
  "ok":      true,
  "mensaje": "¡Registro exitoso! Un asesor se pondrá en contacto contigo en menos de 24 horas.",
  "lead_id": "LEAD-42",
  "datos": {
    "nombre": "Mariana Torres",
    "correo": "mariana@email.com"
  }
}
```

---

## Despliegue en Railway (gratis)

1. Crea una cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto → **Deploy from GitHub** (sube el código a un repo)
3. Agrega un plugin de **MySQL** en Railway
4. En **Variables**, agrega las del `.env` con los datos de Railway
5. Railway detecta automáticamente `npm start` y despliega

**URL de tu backend:** `https://backend-eduenglish.up.railway.app`

---

## Seguridad implementada

- **Helmet** – Cabeceras HTTP de seguridad
- **CORS** – Solo tu dominio puede llamar a la API
- **Rate Limiter** – Máximo 10 envíos por hora por IP
- **Validación doble** – Client-side (HTML) + Server-side (middleware)
- **Sanitización** – Datos limpios antes de insertar en BD
- **Consultas parametrizadas** – Prevención de SQL Injection
- **Límite de body** – Máximo 10KB por petición

---

## Integración con HubSpot CRM

1. Crea cuenta gratis en [hubspot.com](https://hubspot.com)
2. Ve a **Settings → Integrations → API Key**
3. Crea un **Private App** con scope `crm.objects.contacts.write`
4. Copia el token y pégalo en `.env` como `HUBSPOT_ACCESS_TOKEN`
5. En HubSpot, crea propiedades personalizadas: `nivel_ingles`, `modalidad_preferida`, `horario_preferido`, `motivo_estudio`, `desea_prueba_nivel`, `origen_lead`

---

## Credenciales de acceso (para entrega)

| Recurso | Dato |
|---------|------|
| URL Landing Page | `https://tu-landing.netlify.app` |
| URL Backend API  | `https://tu-backend.up.railway.app` |
| BD Host          | Ver Railway → MySQL → Connect |
| BD Name          | `eduenglish_leads` |
| BD User          | `eduenglish_user` |
| BD Password      | (configurada en Railway) |
| CRM              | HubSpot – `https://app.hubspot.com` |
| CRM User         | (el que registraste en HubSpot) |
