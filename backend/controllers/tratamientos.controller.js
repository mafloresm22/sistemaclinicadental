'use strict';

const { pool } = require('../config/db');

/**
 * Listar todos los tratamientos usando SP
 */
async function listarTratamientos(req, res, next) {
  try {
    const { busqueda, estado } = req.query;
    const termino = (busqueda || '').trim();
    const estadoFiltro = estado || '';

    const [rows] = await pool.query('CALL sp_listar_tratamientos(?, ?)', [termino, estadoFiltro]);
    const tratamientos = rows[0];

    return res.json({
      success: true,
      mensaje: 'Tratamientos obtenidos correctamente',
      total: tratamientos.length,
      datos: tratamientos,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener un tratamiento por su ID usando SP
 */
async function obtenerTratamientoPorId(req, res, next) {
  try {
    const id = req.params.idTratamiento;

    const [result] = await pool.query('CALL sp_obtener_tratamiento_por_id(?)', [id]);
    const tratamientos = result[0];

    if (tratamientos.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún tratamiento con ID ${id}`,
      });
    }

    return res.json({
      success: true,
      mensaje: 'Tratamiento obtenido con éxito',
      datos: tratamientos[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear un nuevo tratamiento usando SP
 */
async function crearTratamiento(req, res, next) {
  try {
    const { nombreTratamiento, descripcionTratamiento, duracionEstimadaMin, costoBase } = req.body;

    // Validaciones obligatorias
    if (!nombreTratamiento || !nombreTratamiento.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del tratamiento es obligatorio.',
      });
    }

    if (costoBase === undefined || costoBase === null || isNaN(Number(costoBase))) {
      return res.status(400).json({
        success: false,
        mensaje: 'El costo base es obligatorio y debe ser un número válido.',
      });
    }

    if (Number(costoBase) < 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El costo base no puede ser negativo.',
      });
    }

    const nombreLimpio = nombreTratamiento.trim();

    if (nombreLimpio.length > 120) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del tratamiento no puede superar los 120 caracteres.',
      });
    }

    const descripcionLimpia = descripcionTratamiento && descripcionTratamiento.trim()
      ? descripcionTratamiento.trim()
      : null;

    if (descripcionLimpia && descripcionLimpia.length > 255) {
      return res.status(400).json({
        success: false,
        mensaje: 'La descripción no puede superar los 255 caracteres.',
      });
    }

    const duracion = duracionEstimadaMin ? Number(duracionEstimadaMin) : null;

    if (duracion !== null && (!Number.isInteger(duracion) || duracion <= 0)) {
      return res.status(400).json({
        success: false,
        mensaje: 'La duración estimada debe ser un número entero positivo.',
      });
    }

    // Verificar duplicados usando SP
    const [resultDuplicado] = await pool.query(
      'CALL sp_verificar_tratamiento_nombre(?, NULL)',
      [nombreLimpio]
    );
    if (resultDuplicado[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe un tratamiento registrado con el nombre "${nombreLimpio}".`,
      });
    }

    // Insertar mediante SP
    await pool.query(
      'CALL sp_crear_tratamiento(?, ?, ?, ?, @insertId)',
      [nombreLimpio, descripcionLimpia, duracion, Number(costoBase)]
    );

    // Obtener el ID insertado
    const [rowsId] = await pool.query('SELECT @insertId AS insertId');
    const insertId = rowsId[0].insertId;

    return res.status(201).json({
      success: true,
      mensaje: 'Tratamiento creado con éxito',
      datos: {
        idTratamiento: insertId,
        nombreTratamiento: nombreLimpio,
        descripcionTratamiento: descripcionLimpia,
        duracionEstimadaMin: duracion,
        costoBase: Number(costoBase),
        estadoTratamiento: 'Activo',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar un tratamiento existente usando SP
 */
async function actualizarTratamiento(req, res, next) {
  try {
    const id = req.params.idTratamiento;
    const { nombreTratamiento, descripcionTratamiento, duracionEstimadaMin, costoBase } = req.body;

    // Verificar existencia
    const [resultExistente] = await pool.query('CALL sp_obtener_tratamiento_por_id(?)', [id]);
    if (resultExistente[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún tratamiento con ID ${id}`,
      });
    }

    // Validaciones
    if (!nombreTratamiento || !nombreTratamiento.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del tratamiento es obligatorio.',
      });
    }

    if (costoBase === undefined || costoBase === null || isNaN(Number(costoBase))) {
      return res.status(400).json({
        success: false,
        mensaje: 'El costo base es obligatorio y debe ser un número válido.',
      });
    }

    if (Number(costoBase) < 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El costo base no puede ser negativo.',
      });
    }

    const nombreLimpio = nombreTratamiento.trim();

    if (nombreLimpio.length > 120) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del tratamiento no puede superar los 120 caracteres.',
      });
    }

    const descripcionLimpia = descripcionTratamiento && descripcionTratamiento.trim()
      ? descripcionTratamiento.trim()
      : null;

    if (descripcionLimpia && descripcionLimpia.length > 255) {
      return res.status(400).json({
        success: false,
        mensaje: 'La descripción no puede superar los 255 caracteres.',
      });
    }

    const duracion = duracionEstimadaMin ? Number(duracionEstimadaMin) : null;

    if (duracion !== null && (!Number.isInteger(duracion) || duracion <= 0)) {
      return res.status(400).json({
        success: false,
        mensaje: 'La duración estimada debe ser un número entero positivo.',
      });
    }

    // Verificar duplicado excluyendo el ID actual
    const [resultDuplicado] = await pool.query(
      'CALL sp_verificar_tratamiento_nombre(?, ?)',
      [nombreLimpio, id]
    );
    if (resultDuplicado[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe otro tratamiento con el nombre "${nombreLimpio}".`,
      });
    }

    // Actualizar mediante SP
    await pool.query(
      'CALL sp_actualizar_tratamiento(?, ?, ?, ?, ?)',
      [id, nombreLimpio, descripcionLimpia, duracion, Number(costoBase)]
    );

    return res.json({
      success: true,
      mensaje: 'Tratamiento actualizado con éxito',
      datos: {
        idTratamiento: Number(id),
        nombreTratamiento: nombreLimpio,
        descripcionTratamiento: descripcionLimpia,
        duracionEstimadaMin: duracion,
        costoBase: Number(costoBase),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cambiar el estado (Activo/Inactivo) de un tratamiento usando SP
 */
async function cambiarEstadoTratamiento(req, res, next) {
  try {
    const id = req.params.idTratamiento;
    const { estadoTratamiento } = req.body;

    const estadosValidos = ['Activo', 'Inactivo'];
    if (!estadoTratamiento || !estadosValidos.includes(estadoTratamiento)) {
      return res.status(400).json({
        success: false,
        mensaje: `El estado debe ser uno de: ${estadosValidos.join(', ')}.`,
      });
    }

    // Verificar existencia
    const [resultExistente] = await pool.query('CALL sp_obtener_tratamiento_por_id(?)', [id]);
    if (resultExistente[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún tratamiento con ID ${id}`,
      });
    }

    // Actualizar estado mediante SP
    await pool.query('CALL sp_cambiar_estado_tratamiento(?, ?)', [id, estadoTratamiento]);

    return res.json({
      success: true,
      mensaje: `Estado del tratamiento actualizado a "${estadoTratamiento}" correctamente`,
      datos: {
        idTratamiento: Number(id),
        estadoTratamiento,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarTratamientos,
  obtenerTratamientoPorId,
  crearTratamiento,
  actualizarTratamiento,
  cambiarEstadoTratamiento,
};

