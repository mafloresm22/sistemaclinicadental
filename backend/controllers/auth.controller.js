'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generarToken } = require('../utils/jwt');

/**
 * Iniciar sesión de usuario
 */
async function login(req, res, next) {
  try {
    const { nombreUsuario, password } = req.body;

    // 1. Validar campos obligatorios
    if (!nombreUsuario || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Por favor, proporciona el nombre de usuario y la contraseña.',
      });
    }

    // 2. Buscar usuario mediante SP
    const [usuarios] = await pool.query('CALL sp_login_usuario(?)', [nombreUsuario.trim()]);
    const usuarioRows = usuarios[0];

    if (usuarioRows.length === 0) {
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    const usuario = usuarioRows[0];

    // 3. Validar si el usuario está eliminado
    if (usuario.deletedAt) {
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    // 4. Validar estado del usuario
    if (usuario.estadoUsuario !== 'Activo') {
      return res.status(403).json({
        success: false,
        mensaje: 'Tu cuenta se encuentra inactiva. Por favor, contacta al administrador.',
      });
    }

    // 5. Comparar contraseña con el hash guardado
    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    // 6. Obtener permisos del rol mediante SP
    const [permisosResult] = await pool.query('CALL sp_obtener_permisos_rol(?)', [usuario.rolId]);
    const permisosRows = permisosResult[0];
    const permisos = permisosRows.map((row) => row.codigoPermiso);

    // 7. Determinar si el usuario está vinculado a un Doctor o a un Empleado mediante SP
    const [doctorResult] = await pool.query('CALL sp_obtener_doctor_por_usuario(?)', [usuario.idUsuario]);
    const doctores = doctorResult[0];

    let doctorInfo = null;
    let empleadoInfo = null;

    if (doctores.length > 0) {
      doctorInfo = doctores[0];
    } else {
      const [empleadoResult] = await pool.query('CALL sp_obtener_empleado_por_usuario(?)', [usuario.idUsuario]);
      const empleados = empleadoResult[0];
      if (empleados.length > 0) {
        empleadoInfo = empleados[0];
      }
    }

    // 8. Actualizar la fecha y hora de último login mediante SP
    await pool.query('CALL sp_actualizar_ultimo_login(?)', [usuario.idUsuario]);

    // 9. Construir el payload y generar el Token JWT
    const payload = {
      idUsuario: usuario.idUsuario,
      nombreUsuario: usuario.nombreUsuario,
      rolId: usuario.rolId,
      rol: usuario.nombreRol,
      permisos,
      doctor: doctorInfo,
      empleado: empleadoInfo,
    };

    const token = generarToken(payload);

    // 10. Responder al cliente
    return res.json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        idUsuario: usuario.idUsuario,
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.nombreRol,
        permisos,
        persona: doctorInfo
          ? {
            tipo: 'Doctor',
            id: doctorInfo.idDoctor,
            nombres: `${doctorInfo.nombreDoctor} ${doctorInfo.apellidosDoctor}`,
            colegiatura: doctorInfo.nroColegiatura,
          }
          : empleadoInfo
            ? {
              tipo: 'Empleado',
              id: empleadoInfo.idEmpleado,
              nombres: `${empleadoInfo.nombreEmpleado} ${empleadoInfo.apellidosEmpleado}`,
              cargo: empleadoInfo.cargoEmpleado,
            }
            : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener perfil del usuario autenticado actual mediante SP
 */
async function perfil(req, res, next) {
  try {
    const idUsuario = req.usuario.idUsuario;

    const [usuarioResult] = await pool.query('CALL sp_obtener_perfil_usuario(?)', [idUsuario]);
    const usuarios = usuarioResult[0];

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    const usuario = usuarios[0];

    // Obtener permisos actualizados
    const [permisosResult] = await pool.query('CALL sp_obtener_permisos_rol(?)', [usuario.idRol]);
    const permisosRows = permisosResult[0];

    // Obtener datos de doctor o empleado si aplica
    const [doctorResult] = await pool.query('CALL sp_obtener_doctor_por_usuario(?)', [idUsuario]);
    const doctores = doctorResult[0];

    let personal = null;
    if (doctores.length > 0) {
      personal = { tipo: 'Doctor', ...doctores[0] };
    } else {
      const [empleadoResult] = await pool.query('CALL sp_obtener_empleado_por_usuario(?)', [idUsuario]);
      const empleados = empleadoResult[0];
      if (empleados.length > 0) {
        personal = { tipo: 'Empleado', ...empleados[0] };
      }
    }

    return res.json({
      success: true,
      usuario: {
        idUsuario: usuario.idUsuario,
        nombreUsuario: usuario.nombreUsuario,
        estado: usuario.estadoUsuario,
        ultimoLogin: usuario.ultimoLogin,
        creadoEn: usuario.createdAt,
        rol: {
          id: usuario.idRol,
          nombre: usuario.nombreRol,
          descripcion: usuario.descripcionRol,
        },
        permisos: permisosRows.map((p) => p.codigoPermiso),
        personal,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cierre de sesión
 */
async function logout(req, res) {
  return res.json({
    success: true,
    mensaje: 'Sesión finalizada correctamente. Recuerda eliminar el token del almacenamiento local.',
  });
}

module.exports = {
  login,
  perfil,
  logout,
};