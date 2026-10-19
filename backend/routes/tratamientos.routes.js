'use strict';

const { Router } = require('express');
const tratamientosController = require('../controllers/tratamientos.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Tratamiento:
 *       type: object
 *       properties:
 *         idTratamiento:
 *           type: integer
 *           example: 1
 *         nombreTratamiento:
 *           type: string
 *           example: Blanqueamiento dental
 *         descripcionTratamiento:
 *           type: string
 *           example: Tratamiento para aclarar el tono dental con peróxido de hidrógeno
 *         duracionEstimadaMin:
 *           type: integer
 *           example: 45
 *         costoBase:
 *           type: number
 *           format: float
 *           example: 150.00
 *         estadoTratamiento:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 *     TratamientoInput:
 *       type: object
 *       required:
 *         - nombreTratamiento
 *         - costoBase
 *       properties:
 *         nombreTratamiento:
 *           type: string
 *           maxLength: 120
 *           example: Profilaxis dental completa
 *         descripcionTratamiento:
 *           type: string
 *           maxLength: 255
 *           example: Limpieza profunda y remoción de sarro supragingival
 *         duracionEstimadaMin:
 *           type: integer
 *           example: 30
 *         costoBase:
 *           type: number
 *           format: float
 *           example: 80.00
 */

/**
 * @swagger
 * /api/tratamientos:
 *   get:
 *     summary: Listar todos los tratamientos
 *     description: Retorna la lista de tratamientos registrados en el sistema. Soporta filtro por texto y estado.
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar por nombre o descripción
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado del tratamiento
 *     responses:
 *       200:
 *         description: Lista de tratamientos obtenida correctamente
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
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tratamiento'
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarAutenticacion, tratamientosController.listarTratamientos);

/**
 * @swagger
 * /api/tratamientos/{idTratamiento}:
 *   get:
 *     summary: Obtener un tratamiento por ID
 *     description: Retorna los datos detallados de un tratamiento.
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTratamiento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tratamiento
 *     responses:
 *       200:
 *         description: Tratamiento encontrado
 *       404:
 *         description: Tratamiento no encontrado
 */
router.get('/:idTratamiento', verificarAutenticacion, tratamientosController.obtenerTratamientoPorId);

/**
 * @swagger
 * /api/tratamientos:
 *   post:
 *     summary: Registrar un nuevo tratamiento
 *     description: Crea un tratamiento dental con su costo base y duración estimada. El nombre debe ser único.
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TratamientoInput'
 *     responses:
 *       201:
 *         description: Tratamiento creado con éxito
 *       400:
 *         description: Datos requeridos faltantes o inválidos
 *       409:
 *         description: Ya existe un tratamiento con ese nombre
 */
router.post('/', verificarAutenticacion, tratamientosController.crearTratamiento);

/**
 * @swagger
 * /api/tratamientos/{idTratamiento}:
 *   put:
 *     summary: Actualizar un tratamiento
 *     description: Modifica los datos principales de un tratamiento existente (nombre, descripción, duración o costo base).
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTratamiento
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TratamientoInput'
 *     responses:
 *       200:
 *         description: Tratamiento actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tratamiento no encontrado
 *       409:
 *         description: Conflicto por nombre duplicado
 */
router.put('/:idTratamiento', verificarAutenticacion, tratamientosController.actualizarTratamiento);

/**
 * @swagger
 * /api/tratamientos/{idTratamiento}/estado:
 *   patch:
 *     summary: Cambiar estado de un tratamiento
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTratamiento
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estadoTratamiento
 *             properties:
 *               estadoTratamiento:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 example: Inactivo
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       404:
 *         description: Tratamiento no encontrado
 */
router.patch('/:idTratamiento/estado', verificarAutenticacion, tratamientosController.cambiarEstadoTratamiento);

module.exports = router;
