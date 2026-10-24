'use strict';

const { Router } = require('express');
const piezasDentalesController = require('../controllers/piezas-dentales.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PiezaDental:
 *       type: object
 *       properties:
 *         idPieza:
 *           type: integer
 *           description: Código FDI de la pieza dental (11-48 adultos, 51-85 deciduos)
 *           example: 16
 *         nombrePieza:
 *           type: string
 *           example: Primer molar
 *         cuadrante:
 *           type: integer
 *           description: Cuadrante FDI (1-4 adulto, 5-8 decidua)
 *           example: 1
 *         arcada:
 *           type: string
 *           enum: [Superior, Inferior]
 *           example: Superior
 */

/**
 * @swagger
 * /api/piezas-dentales:
 *   get:
 *     summary: Listar piezas dentales
 *     description: >
 *       Retorna el catálogo de piezas dentales en sistema FDI.
 *       Permite filtrar por arcada (Superior/Inferior), cuadrante (1-8) y búsqueda por nombre.
 *     tags: [Piezas Dentales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: arcada
 *         schema:
 *           type: string
 *           enum: [Superior, Inferior]
 *         description: Filtrar por arcada
 *       - in: query
 *         name: cuadrante
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 8
 *         description: Filtrar por cuadrante FDI (1-4 adulto, 5-8 decidua)
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre de pieza o código FDI
 *     responses:
 *       200:
 *         description: Listado de piezas dentales
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
 *                 total:
 *                   type: integer
 *                   example: 52
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PiezaDental'
 *       400:
 *         description: Parámetros de filtro inválidos
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarAutenticacion, piezasDentalesController.listarPiezasDentales);

/**
 * @swagger
 * /api/piezas-dentales/{idPieza}:
 *   get:
 *     summary: Obtener una pieza dental por su código FDI
 *     description: Retorna los datos de una pieza dental identificada por su código FDI.
 *     tags: [Piezas Dentales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPieza
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código FDI de la pieza dental (ej. 16 = Primer molar superior derecho)
 *         example: 16
 *     responses:
 *       200:
 *         description: Pieza dental encontrada
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
 *                 datos:
 *                   $ref: '#/components/schemas/PiezaDental'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pieza dental no encontrada
 */
router.get('/:idPieza', verificarAutenticacion, piezasDentalesController.obtenerPiezaDentalPorId);

/**
 * @swagger
 * /api/piezas-dentales/{idPieza}:
 *   put:
 *     summary: Actualizar el nombre de una pieza dental
 *     description: >
 *       Permite modificar el nombre descriptivo de una pieza dental por su código FDI.
 *       Los campos idPieza, cuadrante y arcada son fijos del estándar FDI y no se modifican.
 *     tags: [Piezas Dentales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPieza
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código FDI de la pieza dental
 *         example: 16
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombrePieza
 *             properties:
 *               nombrePieza:
 *                 type: string
 *                 maxLength: 60
 *                 example: Primer molar superior derecho
 *     responses:
 *       200:
 *         description: Pieza dental actualizada con éxito
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
 *                 datos:
 *                   $ref: '#/components/schemas/PiezaDental'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pieza dental no encontrada
 */
router.put('/:idPieza', verificarAutenticacion, piezasDentalesController.actualizarPiezaDental);

module.exports = router;

