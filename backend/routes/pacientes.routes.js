'use strict';

const { Router } = require('express');
const pacientesController = require('../controllers/pacientes.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AntecedenteInput:
 *       type: object
 *       required:
 *         - tipoAntecedente
 *       properties:
 *         tipoAntecedente:
 *           type: string
 *           enum: [Alergia, Enfermedad, Medicacion, Cirugia, Otro]
 *           example: Alergia
 *         descripcionAntecedente:
 *           type: string
 *           example: Alergia severa a la penicilina y amoxicilina
 *     Antecedente:
 *       type: object
 *       properties:
 *         idAntecedente:
 *           type: integer
 *           example: 1
 *         pacienteId:
 *           type: integer
 *           example: 10
 *         tipoAntecedente:
 *           type: string
 *           enum: [Alergia, Enfermedad, Medicacion, Cirugia, Otro]
 *           example: Alergia
 *         descripcionAntecedente:
 *           type: string
 *           example: Alergia a la penicilina
 *         fechaRegistro:
 *           type: string
 *           format: date-time
 *         registradoPorId:
 *           type: integer
 *           example: 2
 *         registradoPorNombre:
 *           type: string
 *           example: admin
 *     Paciente:
 *       type: object
 *       properties:
 *         idPaciente:
 *           type: integer
 *           example: 1
 *         nombrePaciente:
 *           type: string
 *           example: Juan Carlos
 *         apellidosPaciente:
 *           type: string
 *           example: Pérez Gómez
 *         tipoDocumento:
 *           type: string
 *           enum: [DNI, CE, Pasaporte]
 *           example: DNI
 *         documentoPaciente:
 *           type: string
 *           example: "72345678"
 *         fechaNacimientoPaciente:
 *           type: string
 *           format: date
 *           example: "1992-06-15"
 *         sexoPaciente:
 *           type: string
 *           enum: [Masculino, Femenino, Otro]
 *           example: Masculino
 *         celularPaciente:
 *           type: string
 *           example: "987654321"
 *         correoPaciente:
 *           type: string
 *           format: email
 *           example: juan.perez@example.com
 *         direccionPaciente:
 *           type: string
 *           example: Av. Javier Prado Este 1234
 *         contactoEmergenciaNombre:
 *           type: string
 *           example: María Gómez
 *         contactoEmergenciaCelular:
 *           type: string
 *           example: "912345678"
 *         apoderadoId:
 *           type: integer
 *           nullable: true
 *           example: null
 *         apoderadoNombre:
 *           type: string
 *           nullable: true
 *           example: null
 *         estadoPaciente:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 *         totalAntecedentes:
 *           type: integer
 *           example: 2
 *         antecedentes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Antecedente'
 *     PacienteInput:
 *       type: object
 *       required:
 *         - nombrePaciente
 *         - apellidosPaciente
 *         - documentoPaciente
 *       properties:
 *         nombrePaciente:
 *           type: string
 *           maxLength: 80
 *           example: Juan Carlos
 *         apellidosPaciente:
 *           type: string
 *           maxLength: 100
 *           example: Pérez Gómez
 *         tipoDocumento:
 *           type: string
 *           enum: [DNI, CE, Pasaporte]
 *           default: DNI
 *           example: DNI
 *         documentoPaciente:
 *           type: string
 *           maxLength: 20
 *           example: "72345678"
 *         fechaNacimientoPaciente:
 *           type: string
 *           format: date
 *           example: "1992-06-15"
 *         sexoPaciente:
 *           type: string
 *           enum: [Masculino, Femenino, Otro]
 *           example: Masculino
 *         celularPaciente:
 *           type: string
 *           maxLength: 20
 *           example: "987654321"
 *         correoPaciente:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           example: juan.perez@example.com
 *         direccionPaciente:
 *           type: string
 *           maxLength: 200
 *           example: Av. Javier Prado Este 1234
 *         contactoEmergenciaNombre:
 *           type: string
 *           maxLength: 100
 *           example: María Gómez
 *         contactoEmergenciaCelular:
 *           type: string
 *           maxLength: 20
 *           example: "912345678"
 *         apoderadoId:
 *           type: integer
 *           nullable: true
 *           example: null
 *           description: ID de otro paciente que actúa como apoderado (en caso de menores de edad)
 *         antecedentes:
 *           type: array
 *           description: Lista inicial de antecedentes médicos opcionales a registrar junto con el paciente
 *           items:
 *             $ref: '#/components/schemas/AntecedenteInput'
 */

/**
 * @swagger
 * /api/pacientes:
 *   get:
 *     summary: Listar todos los pacientes
 *     description: Retorna la lista de pacientes registrados con filtros opcionales de búsqueda y estado.
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Término de búsqueda por documento, nombre o apellidos
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtro por estado del paciente
 *     responses:
 *       200:
 *         description: Lista de pacientes obtenida correctamente
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
 *                   example: Pacientes obtenidos correctamente
 *                 total:
 *                   type: integer
 *                   example: 1
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Paciente'
 *       401:
 *         description: No autenticado
 */
router.get('/', verificarAutenticacion, pacientesController.listarPacientes);

/**
 * @swagger
 * /api/pacientes/{idPaciente}:
 *   get:
 *     summary: Obtener detalle de un paciente por ID
 *     description: Retorna los datos del paciente junto con su lista de antecedentes médicos registrados.
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del paciente
 *     responses:
 *       200:
 *         description: Datos del paciente y antecedentes
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/:idPaciente', verificarAutenticacion, pacientesController.obtenerPacientePorId);

/**
 * @swagger
 * /api/pacientes:
 *   post:
 *     summary: Registrar un nuevo paciente
 *     description: Registra un paciente en la base de datos y opcionalmente sus antecedentes médicos en una sola transacción atómica.
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteInput'
 *     responses:
 *       201:
 *         description: Paciente registrado exitosamente
 *       400:
 *         description: Datos requeridos faltantes o inválidos
 *       409:
 *         description: Ya existe un paciente con el mismo documento
 */
router.post('/', verificarAutenticacion, pacientesController.crearPaciente);

/**
 * @swagger
 * /api/pacientes/{idPaciente}:
 *   put:
 *     summary: Actualizar datos de un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteInput'
 *     responses:
 *       200:
 *         description: Paciente actualizado exitosamente
 *       404:
 *         description: Paciente no encontrado
 *       409:
 *         description: Documento duplicado con otro paciente
 */
router.put('/:idPaciente', verificarAutenticacion, pacientesController.actualizarPaciente);

/**
 * @swagger
 * /api/pacientes/{idPaciente}/estado:
 *   patch:
 *     summary: Cambiar estado del paciente (Activo / Inactivo)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
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
 *               - estadoPaciente
 *             properties:
 *               estadoPaciente:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 example: Inactivo
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       404:
 *         description: Paciente no encontrado
 */
router.patch('/:idPaciente/estado', verificarAutenticacion, pacientesController.cambiarEstadoPaciente);

/**
 * @swagger
 * /api/pacientes/{idPaciente}:
 *   delete:
 *     summary: Eliminar un paciente (eliminación lógica)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente eliminado correctamente
 *       404:
 *         description: Paciente no encontrado
 */
router.delete('/:idPaciente', verificarAutenticacion, pacientesController.eliminarPaciente);

/**
 * @swagger
 * /api/pacientes/{idPaciente}/antecedentes:
 *   get:
 *     summary: Listar antecedentes médicos de un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de antecedentes obtenida
 */
router.get('/:idPaciente/antecedentes', verificarAutenticacion, pacientesController.listarAntecedentesPorPaciente);

/**
 * @swagger
 * /api/pacientes/{idPaciente}/antecedentes:
 *   post:
 *     summary: Agregar un antecedente médico a un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AntecedenteInput'
 *     responses:
 *       201:
 *         description: Antecedente agregado correctamente
 *       404:
 *         description: Paciente no encontrado
 */
router.post('/:idPaciente/antecedentes', verificarAutenticacion, pacientesController.agregarAntecedente);

/**
 * @swagger
 * /api/pacientes/{idPaciente}/antecedentes/{idAntecedente}:
 *   delete:
 *     summary: Eliminar un antecedente médico específico
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPaciente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idAntecedente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Antecedente eliminado exitosamente
 *       404:
 *         description: Antecedente no encontrado
 */
router.delete('/:idPaciente/antecedentes/:idAntecedente', verificarAutenticacion, pacientesController.eliminarAntecedente);

module.exports = router;
