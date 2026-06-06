// server.js
// Punto de entrada del backend EduEnglish
// Modelos de Evaluación de Software – 2026A

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const leadsRouter = require('./routes/leads');
const { testConnection } = require('./db/connection');

const app  = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
// SEGURIDAD
// ═══════════════════════════════════════════

// Cabeceras de seguridad HTTP
app.use(helmet());

// CORS: solo permite peticiones desde tu Landing Page
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Rate limiter: máximo 10 envíos de formulario por IP cada hora
const limiter = rateLimit({
  windowMs:         60 * 60 * 1000,   // 1 hora
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    ok:      false,
    mensaje: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en una hora.'
  },
  // Aplica el límite solo al endpoint de creación de leads
  skip: (req) => req.method === 'GET'
});

app.use('/api/leads', limiter);

// ═══════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════
app.use(express.json({ limit: '10kb' }));       // Limitar tamaño del body
app.use(express.urlencoded({ extended: true }));

// ═══════════════════════════════════════════
// RUTAS
// ═══════════════════════════════════════════

// Health check — útil para Railway / Render
app.get('/health', (req, res) => {
  res.json({
    ok:          true,
    servicio:    'Backend EduEnglish – Captación de Leads',
    version:     '1.0.0',
    entorno:     process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString()
  });
});

// Rutas principales
app.use('/api/leads', leadsRouter);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
});

// ═══════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════
async function start() {
  await testConnection();           // Verificar BD antes de abrir el puerto
  app.listen(PORT, () => {
    console.log(`\n🚀 EduEnglish Backend corriendo en puerto ${PORT}`);
    console.log(`   Entorno   : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health    : http://localhost:${PORT}/health`);
    console.log(`   POST Lead : http://localhost:${PORT}/api/leads`);
    console.log(`   GET Leads : http://localhost:${PORT}/api/leads\n`);
  });
}

start();
