// db/connection.js
// Pool de conexiones MySQL reutilizable

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'eduenglish_leads',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '-06:00'   // Zona horaria México Centro
});

// Verificar conexión al iniciar
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida —', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
