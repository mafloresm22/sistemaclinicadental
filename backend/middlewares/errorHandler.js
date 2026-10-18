'use strict';

function errorHandler(err, req, res, next) {
  // Loguear el error completo en consola (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error no controlado:', err);
  }

  // Código de estado: usa el que ya traiga el error o 500
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    // Solo expone el stack en desarrollo para no filtrar internos en producción
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
