'use strict';

const { Router } = require('express');
const doctoresController = require('../controllers/doctores.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         idDoctor:
 *           type: integer
 *           example: 1
 *         nombreDoctor:
 *           type: string
 *           example: Carlos
 *         apellidosDoctor:
 *           type: string
 *           example: Ramírez Torres
 *         tipoDocumento:
 *           type: string
 *           enum: [DNI, CE, Pasaporte]
 *           example: DNI
 *         documentoDoctor:
 *           type: string
 *           example: "74512345"
 *         nroColegiatura:
 *           type: string
 *           example: COP-12345
 *         celularDoctor:
 *           type: string
 *           example: "987654321"
 *         correoDoctor:
 *           type: string
 *           example: c.ramirez@clinica.com
 *         estadoDoctor:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 *         usuarioId:
 *           type: integer
 *           example: 3
 *     DoctorInput:
 *       type: object
 *       required:
 *         - nombreDoctor
 *         - apellidosDoctor
 *         - documentoDoctor
 *       properties:
 *         nombreDoctor:
 *           type: string
 *           maxLength: 80
 *           example: Carlos
 *         apellidosDoctor:
 *           type: string
 *           maxLength: 100
 *           example: Ramírez Torres
 *         tipoDocumento:
 *           type: string
 *           enum: [DNI, CE, Pasaporte]
 *           default: DNI
 *           example: DNI
 *         documentoDoctor:
 *           type: string
 *           maxLength: 20
 *           example: "74512345"
 *         nroColegiatura:
 *           type: string
 *           maxLength: 20
 *           example: COP-12345
 *         celularDoctor:
 *           type: string
 *           maxLength: 20
 *           example: "987654321"
 *         correoDoctor:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           example: c.ramirez@clinica.com
 *         usuarioId:
 *           type: integer
 *           example: 3
 *         especialidades:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 2]
 *           description: IDs de especialidades a asignar al doctor (tabla Doctores_Especialidades)
 */

/**
 * @swagger
 * /api/doctores:
 *   get:
 *     summary: Listar todos los doctores
 *     description: Retorna la lista de doctores con sus especialidades. Soporta filtro por texto y estado.
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Filtrar por nombre, apellidos o documento
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de doctores obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarAutenticacion, doctoresController.listarDoctores);

/**
 * @swagger
 * /api/doctores/{idDoctor}:
 *   get:
 *     summary: Obtener un doctor por ID
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idDoctor
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 datos:
 *                   $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor no encontrado
 */
router.get('/:idDoctor', verificarAutenticacion, doctoresController.obtenerDoctorPorId);

/**
 * @swagger
 * /api/doctores:
 *   post:
 *     summary: Registrar un nuevo doctor
 *     description: |
 *       Crea un doctor y opcionalmente asigna especialidades (tabla intermedia Doctores_Especialidades).
 *       El documento y correo deben ser únicos.
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorInput'
 *     responses:
 *       201:
 *         description: Doctor creado con éxito
 *       400:
 *         description: Datos requeridos faltantes o inválidos
 *       409:
 *         description: Ya existe un doctor con ese documento o correo
 */
router.post('/', verificarAutenticacion, doctoresController.crearDoctor);

/**
 * @swagger
 * /api/doctores/{idDoctor}:
 *   put:
 *     summary: Actualizar un doctor
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idDoctor
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorInput'
 *     responses:
 *       200:
 *         description: Doctor actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Doctor no encontrado
 *       409:
 *         description: Documento o correo duplicado
 */
router.put('/:idDoctor', verificarAutenticacion, doctoresController.actualizarDoctor);

/**
 * @swagger
 * /api/doctores/{idDoctor}/estado:
 *   patch:
 *     summary: Cambiar estado de un doctor
 *     description: Activa o inactiva un doctor sin eliminarlo.
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idDoctor
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
 *               - estadoDoctor
 *             properties:
 *               estadoDoctor:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 example: Inactivo
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: Doctor no encontrado
 */
router.patch('/:idDoctor/estado', verificarAutenticacion, doctoresController.cambiarEstadoDoctor);

/**
 * @swagger
 * /api/doctores/{idDoctor}:
 *   delete:
 *     summary: Desactivar un doctor
 *     description: |
 *       Cambia el estado del doctor de **Activo** a **Inactivo**.
 *       No se realiza eliminación física de la base de datos.
 *       Si el doctor ya está Inactivo, retorna un error 400.
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idDoctor
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor desactivado correctamente
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
 *                   type: object
 *                   properties:
 *                     idDoctor:
 *                       type: integer
 *                     estadoDoctor:
 *                       type: string
 *                       example: Inactivo
 *       400:
 *         description: El doctor ya está Inactivo
 *       404:
 *         description: Doctor no encontrado
 */
router.delete('/:idDoctor', verificarAutenticacion, doctoresController.eliminarDoctor);

module.exports = router;
