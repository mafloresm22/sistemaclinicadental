'use strict';

const { verificarToken } = require('../utils/jwt');

/**
 * Middleware para autenticar usuarios mediante Token Bearer JWT
 */
function verificarAutenticacion(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      mensaje: 'Acceso no autorizado: No se proporcionó un token de sesión válido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodificado = verificarToken(token);
    req.usuario = decodificado;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        codigo: 'TOKEN_EXPIRADO',
        mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      });
    }

    return res.status(401).json({
      success: false,
      codigo: 'TOKEN_INVALIDO',
      mensaje: 'Token de autenticación inválido o alterado.',
    });
  }
}

/**
 * Middleware para validar si el usuario autenticado cuenta con un permiso específico
 * {string} permisoRequerido - Código del permiso (ej: 'citas.crear')
 */
function tienePermiso(permisoRequerido) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        mensaje: 'Acceso no autorizado: Usuario no autenticado',
      });
    }

    const permisos = req.usuario.permisos || [];

    // Si tiene permiso comodín '*' o el permiso exacto
    if (permisos.includes('*') || permisos.includes(permisoRequerido)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      codigo: 'PERMISO_DENEGADO',
      mensaje: `Acceso denegado: No cuentas con el permiso requerido [${permisoRequerido}]`,
    });
  };
}

/**
 * Middleware para validar si el usuario pertenece a alguno de los roles permitidos
 * @param  {...string} rolesPermitidos - Lista de nombres de roles permitidos (ej: 'Administrador', 'Doctor')
 */
function tieneRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        mensaje: 'Acceso no autorizado: Usuario no autenticado',
      });
    }

    if (rolesPermitidos.includes(req.usuario.rol)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      codigo: 'ROL_NO_AUTORIZADO',
      mensaje: `Acceso denegado: Requiere uno de los siguientes roles [${rolesPermitidos.join(', ')}]`,
    });
  };
}

module.exports = {
  verificarAutenticacion,
  tienePermiso,
  tieneRol,
};
