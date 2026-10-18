'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     description: Autentica las credenciales del usuario y retorna un Token JWT junto con sus datos y permisos.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombreUsuario
 *               - password
 *             properties:
 *               nombreUsuario:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin123*
 *     responses:
 *       200:
 *         description: Autenticación exitosa
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
 *                   example: Inicio de sesión exitoso
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     idUsuario:
 *                       type: integer
 *                       example: 1
 *                     nombreUsuario:
 *                       type: string
 *                       example: admin
 *                     rol:
 *                       type: string
 *                       example: Administrador
 *                     permisos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["citas.crear", "citas.ver", "pacientes.crear"]
 *                     persona:
 *                       type: object
 *                       nullable: true
 *                       example:
 *                         tipo: Doctor
 *                         id: 1
 *                         nombres: Carlos Mendoza
 *                         colegiatura: COP-12345
 *       400:
 *         description: Campos faltantes o inválidos
 *       401:
 *         description: Credenciales incorrectas
 *       403:
 *         description: Cuenta de usuario inactiva
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: Retorna la información actualizada del usuario, rol, permisos y datos profesionales a partir del Token Bearer JWT.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/perfil', verificarAutenticacion, authController.perfil);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Notifica al cliente para que elimine el token local.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post('/logout', verificarAutenticacion, authController.logout);

module.exports = router;
