'use strict';

const { Router } = require('express');
const especialidadesController = require('../controllers/especialidades.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Especialidad:
 *       type: object
 *       properties:
 *         idEspecialidad:
 *           type: integer
 *           example: 1
 *         nombreEspecialidad:
 *           type: string
 *           example: Ortodoncia
 *         descripcionEspecialidad:
 *           type: string
 *           example: Diagnóstico, prevención y tratamiento de anomalías dentofaciales
 *         totalDoctores:
 *           type: integer
 *           example: 3
 *     EspecialidadInput:
 *       type: object
 *       required:
 *         - nombreEspecialidad
 *       properties:
 *         nombreEspecialidad:
 *           type: string
 *           maxLength: 100
 *           example: Ortodoncia
 *         descripcionEspecialidad:
 *           type: string
 *           maxLength: 200
 *           example: Diagnóstico, prevención y tratamiento de anomalías dentofaciales
 */

/**
 * @swagger
 * /api/especialidades:
 *   get:
 *     summary: Listar todas las especialidades
 *     description: Retorna la lista de especialidades registradas en el sistema con el conteo de doctores asignados. Soporta filtro por texto.
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar por nombre o descripción
 *     responses:
 *       200:
 *         description: Lista de especialidades obtenida correctamente
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
 *                     $ref: '#/components/schemas/Especialidad'
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarAutenticacion, especialidadesController.listarEspecialidades);

/**
 * @swagger
 * /api/especialidades/{id}:
 *   get:
 *     summary: Obtener una especialidad por ID
 *     description: Retorna los datos detallados de una especialidad y la lista de doctores que la ejercen.
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la especialidad
 *     responses:
 *       200:
 *         description: Especialidad encontrada
 *       404:
 *         description: Especialidad no encontrada
 */
router.get('/:idEspecialidad', verificarAutenticacion, especialidadesController.obtenerEspecialidadPorId);

/**
 * @swagger
 * /api/especialidades/{id}/doctores:
 *   get:
 *     summary: Obtener doctores asociados a una especialidad
 *     description: Lista todos los médicos/doctores vinculados con esta especialidad.
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctores vinculados obtenidos
 *       404:
 *         description: Especialidad no encontrada
 */
router.get('/:idEspecialidad/doctores', verificarAutenticacion, especialidadesController.obtenerDoctoresPorEspecialidad);

/**
 * @swagger
 * /api/especialidades:
 *   post:
 *     summary: Registrar una nueva especialidad
 *     description: Crea una especialidad odontológica o médica. El nombre debe ser único.
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EspecialidadInput'
 *     responses:
 *       201:
 *         description: Especialidad creada con éxito
 *       400:
 *         description: Datos requeridos faltantes o inválidos
 *       409:
 *         description: Ya existe una especialidad con ese nombre
 */
router.post('/', verificarAutenticacion, especialidadesController.crearEspecialidad);

/**
 * @swagger
 * /api/especialidades/{id}:
 *   put:
 *     summary: Actualizar una especialidad
 *     description: Modifica el nombre o la descripción de una especialidad existente.
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EspecialidadInput'
 *     responses:
 *       200:
 *         description: Especialidad actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Especialidad no encontrada
 *       409:
 *         description: Conflicto por nombre duplicado
 */
router.put('/:idEspecialidad', verificarAutenticacion, especialidadesController.actualizarEspecialidad);

/**
 * @swagger
 * /api/especialidades/{id}:
 *   delete:
 *     summary: Eliminar una especialidad
 *     description: Elimina una especialidad si no se encuentra asignada a ningún doctor.
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Especialidad eliminada con éxito
 *       400:
 *         description: No se puede eliminar porque tiene doctores asignados
 *       404:
 *         description: Especialidad no encontrada
 */
router.delete('/:idEspecialidad', verificarAutenticacion, especialidadesController.eliminarEspecialidad);

module.exports = router;
