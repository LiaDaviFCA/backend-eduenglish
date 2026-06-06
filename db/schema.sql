-- ═══════════════════════════════════════════════════════
--  SCRIPT SQL – Base de Datos EduEnglish
--  Sistema de Captación de Leads – Escuela de Inglés
--  Modelos de Evaluación de Software 2026A
--  Compatible: MySQL 8.0+ / MariaDB 10.6+
-- ═══════════════════════════════════════════════════════

-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS eduenglish_leads
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eduenglish_leads;

-- 2. Tabla principal de leads
CREATE TABLE IF NOT EXISTS leads_escuela_ingles (
  id                  INT UNSIGNED       NOT NULL AUTO_INCREMENT,

  -- Datos del prospecto
  nombre_completo     VARCHAR(150)       NOT NULL,
  edad                TINYINT UNSIGNED   NOT NULL,
  telefono            VARCHAR(15)        NOT NULL,
  correo_electronico  VARCHAR(100)       NOT NULL,

  -- Preferencias académicas
  nivel_ingles        ENUM(
                        'Sin conocimientos',
                        'Básico',
                        'Intermedio',
                        'Avanzado',
                        'No lo sé'
                      )                  NOT NULL,

  modalidad_preferida ENUM(
                        'Presencial',
                        'En línea',
                        'Híbrida',
                        'Sin preferencia'
                      )                  NOT NULL,

  horario_preferido   ENUM(
                        'Mañana',
                        'Tarde',
                        'Noche',
                        'Sábados',
                        'Domingos',
                        'Sin preferencia'
                      )                  NOT NULL,

  motivo_estudio      ENUM(
                        'Escuela',
                        'Trabajo',
                        'Viaje',
                        'Certificación',
                        'Conversación',
                        'Regularización',
                        'Desarrollo personal'
                      )                  NULL DEFAULT NULL,

  desea_prueba_nivel  TINYINT(1)         NOT NULL DEFAULT 0,
  comentarios         TEXT               NULL DEFAULT NULL,

  -- Privacidad
  acepta_privacidad   TINYINT(1)         NOT NULL DEFAULT 0,

  -- Auditoría
  origen              VARCHAR(50)        NOT NULL DEFAULT 'Landing Page',
  fecha_registro      DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_origen           VARCHAR(45)        NULL DEFAULT NULL,   -- IPv4 o IPv6

  -- Integración CRM
  crm_enviado         TINYINT(1)         NOT NULL DEFAULT 0,
  crm_fecha_envio     DATETIME           NULL DEFAULT NULL,
  crm_contact_id      VARCHAR(50)        NULL DEFAULT NULL,   -- ID en HubSpot/CRM

  PRIMARY KEY (id),
  INDEX idx_correo    (correo_electronico),
  INDEX idx_fecha     (fecha_registro),
  INDEX idx_crm       (crm_enviado)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Leads captados desde la Landing Page de EduEnglish';

-- 3. Usuario dedicado (ejecuta como root)
-- Ajusta 'TuPasswordSeguro123' antes de usar en producción
CREATE USER IF NOT EXISTS 'eduenglish_user'@'%'
  IDENTIFIED BY 'TuPasswordSeguro123';

GRANT SELECT, INSERT, UPDATE ON eduenglish_leads.leads_escuela_ingles
  TO 'eduenglish_user'@'%';

FLUSH PRIVILEGES;

-- 4. Datos de prueba (opcional, comenta en producción)
INSERT INTO leads_escuela_ingles
  (nombre_completo, edad, telefono, correo_electronico,
   nivel_ingles, modalidad_preferida, horario_preferido,
   motivo_estudio, desea_prueba_nivel, acepta_privacidad, origen)
VALUES
  ('Mariana Torres',  19, '7291234567', 'mariana@test.com',
   'Básico',         'En línea',    'Sábados',  'Trabajo',  1, 1, 'Landing Page'),
  ('Carlos Mendoza',  25, '7221112233', 'carlos@test.com',
   'Intermedio',     'Presencial',  'Tarde',    'Certificación', 0, 1, 'Landing Page'),
  ('Laura Sánchez',   32, '7229988771', 'laura@test.com',
   'Sin conocimientos','Híbrida',   'Noche',    NULL,        1, 1, 'Landing Page');

SELECT 'Base de datos inicializada correctamente ✅' AS resultado;
