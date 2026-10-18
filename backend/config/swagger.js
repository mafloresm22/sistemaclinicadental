'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Clínica - API REST',
      version: '1.0.0',
      description: `API backend del Sistema de Gestión Clínica.
        \n Puedes probar cada endpoint directamente desde esta interfaz.`,
      contact: {
        name: 'Equipo Clínica',
        email: 'soporte@clinica.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor local',
      },
    ],
    // Esquemas reutilizables
    components: {
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            mensaje: { type: 'string', example: 'Operación exitosa' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error interno del servidor' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT para autenticarte. Formato: Bearer <token>',
        },
      },
    },
    // Tags para agrupar endpoints
    tags: [
      { name: 'Autenticación', description: 'Inicio de sesión, perfil y cierre de sesión' },
      { name: 'Sistema', description: 'Estado del servidor y base de datos' },
      { name: 'Especialidades', description: 'Gestión de especialidades odontológicas/médicas' },
      { name: 'Infraestructura', description: 'Gestión de Sedes y Consultorios de la clínica' },
      { name: 'Pacientes', description: 'Gestión de pacientes' },
      { name: 'Médicos', description: 'Gestión de médicos' },
      { name: 'Citas', description: 'Gestión de citas médicas' },
    ],
  },
  // Archivos donde swagger-jsdoc buscará comentarios JSDoc con @swagger
  apis: [
    './routes/*.js',
    './controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
