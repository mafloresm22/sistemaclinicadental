'use strict';

const { pool } = require('../config/db');

/**
 * Listar todas las especialidades usando SP
 */
async function listarEspecialidades(req, res, next) {
  try {
    const { busqueda, q } = req.query;
    const termino = (busqueda || q || '').trim();

    const [rows] = await pool.query('CALL sp_listar_especialidades(?)', [termino]);
    const especialidades = rows[0];

    return res.json({
      success: true,
      mensaje: 'Especialidades obtenidas correctamente',
      total: especialidades.length,
      datos: especialidades,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener una especialidad por su ID con sus doctores usando SPs
 */
async function obtenerEspecialidadPorId(req, res, next) {
  try {
    const id = req.params.idEspecialidad;

    const [resultEsp] = await pool.query('CALL sp_obtener_especialidad_por_id(?)', [id]);
    const especialidades = resultEsp[0];

    if (especialidades.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna especialidad con ID ${id}`,
      });
    }

    const especialidad = especialidades[0];

    // Obtener doctores asociados activos usando SP
    const [resultDoctores] = await pool.query('CALL sp_obtener_doctores_por_especialidad(?)', [id]);
    const doctores = resultDoctores[0];

    especialidad.doctores = doctores;
    especialidad.totalDoctores = doctores.length;

    return res.json({
      success: true,
      mensaje: 'Especialidad obtenida con éxito',
      datos: especialidad,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener únicamente los doctores de una especialidad usando SPs
 */
async function obtenerDoctoresPorEspecialidad(req, res, next) {
  try {
    const id = req.params.idEspecialidad;

    const [resultEsp] = await pool.query('CALL sp_obtener_especialidad_por_id(?)', [id]);
    if (resultEsp[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna especialidad con ID ${id}`,
      });
    }

    const [resultDoctores] = await pool.query('CALL sp_obtener_doctores_por_especialidad(?)', [id]);
    const doctores = resultDoctores[0];

    return res.json({
      success: true,
      especialidad: resultEsp[0][0],
      total: doctores.length,
      datos: doctores,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear una nueva especialidad usando SPs
 */
async function crearEspecialidad(req, res, next) {
  try {
    const { nombreEspecialidad, descripcionEspecialidad } = req.body;

    if (!nombreEspecialidad || !nombreEspecialidad.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la especialidad es obligatorio.',
      });
    }

    const nombreLimpio = nombreEspecialidad.trim();
    const descripcionLimpia = descripcionEspecialidad ? descripcionEspecialidad.trim() : null;

    if (nombreLimpio.length > 100) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la especialidad no puede superar los 100 caracteres.',
      });
    }

    if (descripcionLimpia && descripcionLimpia.length > 200) {
      return res.status(400).json({
        success: false,
        mensaje: 'La descripción no puede superar los 200 caracteres.',
      });
    }

    // Verificar duplicados usando SP (excluirId = null)
    const [resultDuplicado] = await pool.query('CALL sp_verificar_especialidad_nombre(?, NULL)', [nombreLimpio]);
    if (resultDuplicado[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe una especialidad registrada con el nombre "${nombreLimpio}".`,
      });
    }

    // Insertar mediante SP
    const [resultado] = await pool.query('CALL sp_crear_especialidad(?, ?, @insertId)', [nombreLimpio, descripcionLimpia]);

    // Obtener el ID insertado mediante una consulta auxiliar del parámetro OUT
    const [rowsId] = await pool.query('SELECT @insertId AS insertId');
    const insertId = rowsId[0].insertId;

    return res.status(201).json({
      success: true,
      mensaje: 'Especialidad creada con éxito',
      datos: {
        idEspecialidad: insertId,
        nombreEspecialidad: nombreLimpio,
        descripcionEspecialidad: descripcionLimpia,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar una especialidad existente usando SPs
 */
async function actualizarEspecialidad(req, res, next) {
  try {
    const id = req.params.idEspecialidad;
    const { nombreEspecialidad, descripcionEspecialidad } = req.body;

    const [resultEsp] = await pool.query('CALL sp_obtener_especialidad_por_id(?)', [id]);
    if (resultEsp[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna especialidad con ID ${id}`,
      });
    }

    if (!nombreEspecialidad || !nombreEspecialidad.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la especialidad es obligatorio.',
      });
    }

    const nombreLimpio = nombreEspecialidad.trim();
    const descripcionLimpia = descripcionEspecialidad !== undefined
      ? (descripcionEspecialidad ? descripcionEspecialidad.trim() : null)
      : null;

    if (nombreLimpio.length > 100) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la especialidad no puede superar los 100 caracteres.',
      });
    }

    if (descripcionLimpia && descripcionLimpia.length > 200) {
      return res.status(400).json({
        success: false,
        mensaje: 'La descripción no puede superar los 200 caracteres.',
      });
    }

    // Validar duplicado excluyendo el ID actual
    const [resultDuplicado] = await pool.query('CALL sp_verificar_especialidad_nombre(?, ?)', [nombreLimpio, id]);
    if (resultDuplicado[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe otra especialidad con el nombre "${nombreLimpio}".`,
      });
    }

    // Actualizar mediante SP
    await pool.query('CALL sp_actualizar_especialidad(?, ?, ?)', [id, nombreLimpio, descripcionLimpia]);

    return res.json({
      success: true,
      mensaje: 'Especialidad actualizada con éxito',
      datos: {
        idEspecialidad: Number(id),
        nombreEspecialidad: nombreLimpio,
        descripcionEspecialidad: descripcionLimpia,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Eliminar una especialidad usando SPs
 */
async function eliminarEspecialidad(req, res, next) {
  try {
    const id = req.params.idEspecialidad;

    const [resultEsp] = await pool.query('CALL sp_obtener_especialidad_por_id(?)', [id]);
    if (resultEsp[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna especialidad con ID ${id}`,
      });
    }

    const especialidad = resultEsp[0][0];

    // Validar relaciones con doctores
    const [resultRelaciones] = await pool.query('CALL sp_contar_doctores_especialidad(?)', [id]);
    const totalDoctores = resultRelaciones[0][0].totalDoctores;

    if (totalDoctores > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `No se puede eliminar la especialidad "${especialidad.nombreEspecialidad}" porque tiene ${totalDoctores} doctor(es) asignado(s). Remueve primero las asignaciones correspondientes.`,
        totalDoctores,
      });
    }

    // Eliminar mediante SP
    await pool.query('CALL sp_eliminar_especialidad(?)', [id]);

    return res.json({
      success: true,
      mensaje: `Especialidad "${especialidad.nombreEspecialidad}" eliminada correctamente`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarEspecialidades,
  obtenerEspecialidadPorId,
  obtenerDoctoresPorEspecialidad,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
};