'use strict';

const { Router } = require('express');
const infraestructuraController = require('../controllers/infraestructura.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Sede:
 *       type: object
 *       properties:
 *         idSede:
 *           type: integer
 *           example: 1
 *         nombreSede:
 *           type: string
 *           example: Sede Central Miraflores
 *         direccionSede:
 *           type: string
 *           example: Av. Larco 1234, Lima
 *         telefonoSede:
 *           type: string
 *           example: "+51 987654321"
 *         estadoSede:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 *         totalConsultorios:
 *           type: integer
 *           example: 4
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SedeInput:
 *       type: object
 *       required:
 *         - nombreSede
 *       properties:
 *         nombreSede:
 *           type: string
 *           maxLength: 100
 *           example: Sede Central Miraflores
 *         direccionSede:
 *           type: string
 *           maxLength: 200
 *           example: Av. Larco 1234, Lima
 *         telefonoSede:
 *           type: string
 *           maxLength: 20
 *           example: "+51 987654321"
 *         estadoSede:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           default: Activo
 *           example: Activo
 *     Consultorio:
 *       type: object
 *       properties:
 *         idConsultorio:
 *           type: integer
 *           example: 1
 *         nombreConsultorio:
 *           type: string
 *           example: Consultorio 101 - Odontopediatría
 *         estadoConsultorio:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 *         sedeId:
 *           type: integer
 *           example: 1
 *         nombreSede:
 *           type: string
 *           example: Sede Central Miraflores
 *     ConsultorioInput:
 *       type: object
 *       required:
 *         - nombreConsultorio
 *         - sedeId
 *       properties:
 *         nombreConsultorio:
 *           type: string
 *           maxLength: 80
 *           example: Consultorio 101 - Odontopediatría
 *         sedeId:
 *           type: integer
 *           example: 1
 *         estadoConsultorio:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           default: Activo
 *           example: Activo
 *     EstadoToggleInput:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 */

router.use(verificarAutenticacion);

// RUTAS: SEDES

/**
 * @swagger
 * /api/infraestructura/sedes:
 *   get:
 *     summary: Listar todas las sedes
 *     description: Retorna la lista de sedes de la clínica con filtros opcionales de búsqueda y estado, incluyendo el conteo de consultorios.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar por nombre, dirección o teléfono
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado de la sede
 *     responses:
 *       200:
 *         description: Lista de sedes obtenida correctamente
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
 *                     $ref: '#/components/schemas/Sede'
 *       401:
 *         description: No autenticado
 */
router.get('/sedes', infraestructuraController.listarSedes);

/**
 * @swagger
 * /api/infraestructura/sedes/{idSede}:
 *   get:
 *     summary: Obtener detalle de una sede por ID
 *     description: Retorna los datos de la sede y el listado de consultorios que pertenecen a ella.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSede
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sede a consultar
 *     responses:
 *       200:
 *         description: Detalle de la sede obtenido con éxito
 *       404:
 *         description: Sede no encontrada
 */
router.get('/sedes/:idSede', infraestructuraController.obtenerSedePorId);

/**
 * @swagger
 * /api/infraestructura/sedes:
 *   post:
 *     summary: Registrar una nueva sede
 *     description: Crea una nueva sede para la clínica con validación de nombre único.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SedeInput'
 *     responses:
 *       201:
 *         description: Sede creada exitosamente
 *       400:
 *         description: Datos inválidos o nombre duplicado
 */
router.post('/sedes', infraestructuraController.crearSede);

/**
 * @swagger
 * /api/infraestructura/sedes/{idSede}:
 *   put:
 *     summary: Actualizar una sede
 *     description: Actualiza los datos de una sede existente.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSede
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SedeInput'
 *     responses:
 *       200:
 *         description: Sede actualizada correctamente
 *       400:
 *         description: Datos inválidos o nombre duplicado
 *       404:
 *         description: Sede no encontrada
 */
router.put('/sedes/:idSede', infraestructuraController.actualizarSede);

/**
 * @swagger
 * /api/infraestructura/sedes/{idSede}/estado:
 *   patch:
 *     summary: Cambiar estado de una sede
 *     description: Permite activar o desactivar una sede (Activo / Inactivo).
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSede
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
 *               - estadoSede
 *             properties:
 *               estadoSede:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 example: Inactivo
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       404:
 *         description: Sede no encontrada
 */
router.patch('/sedes/:idSede/estado', infraestructuraController.cambiarEstadoSede);

/**
 * @swagger
 * /api/infraestructura/sedes/{idSede}:
 *   delete:
 *     summary: Eliminar una sede
 *     description: Elimina una sede si no cuenta con consultorios o historial de citas asociado.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSede
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sede eliminada correctamente
 *       400:
 *         description: No se puede eliminar por dependencias existentes
 *       404:
 *         description: Sede no encontrada
 */
router.delete('/sedes/:idSede', infraestructuraController.eliminarSede);

// RUTAS: CONSULTORIO

/**
 * @swagger
 * /api/infraestructura/consultorios:
 *   get:
 *     summary: Listar todos los consultorios
 *     description: Retorna consultorios con opción de filtrar por sede específica, término de búsqueda o estado.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sedeId
 *         schema:
 *           type: integer
 *         description: Filtrar consultorios por ID de sede
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre de consultorio o sede
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado del consultorio
 *     responses:
 *       200:
 *         description: Lista de consultorios obtenida correctamente
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
 *                     $ref: '#/components/schemas/Consultorio'
 */
router.get('/consultorios', infraestructuraController.listarConsultorios);

/**
 * @swagger
 * /api/infraestructura/consultorios/{idConsultorio}:
 *   get:
 *     summary: Obtener detalle de un consultorio por ID
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idConsultorio
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del consultorio obtenido correctamente
 *       404:
 *         description: Consultorio no encontrado
 */
router.get('/consultorios/:idConsultorio', infraestructuraController.obtenerConsultorioPorId);

/**
 * @swagger
 * /api/infraestructura/consultorios:
 *   post:
 *     summary: Registrar un nuevo consultorio
 *     description: Asigna un consultorio a una sede específica, validando que el nombre no se repita en dicha sede.
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsultorioInput'
 *     responses:
 *       201:
 *         description: Consultorio creado exitosamente
 *       400:
 *         description: Datos inválidos o nombre duplicado en la misma sede
 */
router.post('/consultorios', infraestructuraController.crearConsultorio);

/**
 * @swagger
 * /api/infraestructura/consultorios/{idConsultorio}:
 *   put:
 *     summary: Actualizar un consultorio
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idConsultorio
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsultorioInput'
 *     responses:
 *       200:
 *         description: Consultorio actualizado exitosamente
 *       400:
 *         description: Datos inválidos o duplicados
 *       404:
 *         description: Consultorio no encontrado
 */
router.put('/consultorios/:idConsultorio', infraestructuraController.actualizarConsultorio);

/**
 * @swagger
 * /api/infraestructura/consultorios/{idConsultorio}/estado:
 *   patch:
 *     summary: Cambiar estado de un consultorio
 *     tags: [Infraestructura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idConsultorio
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
 *               - estadoConsultorio
 *             properties:
 *               estadoConsultorio:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 example: Inactivo
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       404:
 *         description: Consultorio no encontrado
 */
router.patch('/consultorios/:idConsultorio/estado', infraestructuraController.cambiarEstadoConsultorio);

module.exports = router;
