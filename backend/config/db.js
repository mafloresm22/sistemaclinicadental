'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_clinica',
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 0,
  waitForConnections: true, // Mantiene la conexión viva (evita el "idle disconnect" de MySQL)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false, // Reintentar en caso de error PROTOCOL_CONNECTION_LOST
  dateStrings: true, // Devuelve fechas como string ISO, no como objetos Date
  timezone: '-05:00',
});

async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('Conexión establecida correctamente.');
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { pool, testConnection };
