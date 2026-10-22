'use strict';

const { Router } = require('express');
const { pool } = require('../config/db');

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check del servidor
 *     description: Verifica que el servidor Express y la conexión a MySQL funcionen correctamente.
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Servidor y base de datos operativos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 mensaje:
 *                   type: string
 *                   example: Servidor y BD funcionando correctamente
 *                 resultado:
 *                   type: integer
 *                   example: 2
 *                   description: Resultado de SELECT 1+1 (confirma query activo)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error de conexión a la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/health', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    res.json({
      success: true,
      mensaje: 'Servidor y BD funcionando correctamente',
      resultado: rows[0].resultado,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Rutas del sistema

const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);

const especialidadesRoutes = require('./especialidades.routes');
router.use('/especialidades', especialidadesRoutes);

const infraestructuraRoutes = require('./infraestructura.routes');
router.use('/infraestructura', infraestructuraRoutes);

const doctoresRoutes = require('./doctores.routes');
router.use('/doctores', doctoresRoutes);

const tratamientosRoutes = require('./tratamientos.routes');
router.use('/tratamientos', tratamientosRoutes);

module.exports = router;

