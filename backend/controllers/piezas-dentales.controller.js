'use strict';

const { pool } = require('../config/db');

/**
 * Listar todas las piezas dentales con filtros opcionales usando SP
 */
async function listarPiezasDentales(req, res, next) {
  try {
    const { arcada, cuadrante, busqueda, q } = req.query;
    const termino = (busqueda || q || '').trim();

    let arcadaParam = null;
    if (arcada) {
      const arcadasValidas = ['Superior', 'Inferior'];
      if (!arcadasValidas.includes(arcada)) {
        return res.status(400).json({
          success: false,
          mensaje: `El valor de arcada debe ser uno de: ${arcadasValidas.join(', ')}.`,
        });
      }
      arcadaParam = arcada;
    }

    let cuadranteParam = null;
    if (cuadrante !== undefined && cuadrante !== '') {
      const cuadranteNum = Number(cuadrante);
      if (!Number.isInteger(cuadranteNum) || cuadranteNum < 1 || cuadranteNum > 8) {
        return res.status(400).json({
          success: false,
          mensaje: 'El cuadrante debe ser un entero entre 1 y 8.',
        });
      }
      cuadranteParam = cuadranteNum;
    }

    const [result] = await pool.query('CALL sp_listar_piezas_dentales(?, ?, ?)', [
      arcadaParam,
      cuadranteParam,
      termino,
    ]);

    const rows = result[0];

    return res.json({
      success: true,
      mensaje: 'Piezas dentales obtenidas correctamente',
      total: rows.length,
      datos: rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener una pieza dental por su ID (código FDI) usando SP
 */
async function obtenerPiezaDentalPorId(req, res, next) {
  try {
    const id = Number(req.params.idPieza);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El ID de la pieza debe ser un número entero positivo.',
      });
    }

    const [result] = await pool.query('CALL sp_obtener_pieza_dental_por_id(?)', [id]);
    const rows = result[0];

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna pieza dental con ID (FDI) ${id}.`,
      });
    }

    return res.json({
      success: true,
      mensaje: 'Pieza dental obtenida con éxito',
      datos: rows[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar el nombre de una pieza dental por su ID (código FDI) usando SP
 */
async function actualizarPiezaDental(req, res, next) {
  try {
    const id = Number(req.params.idPieza);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El ID de la pieza debe ser un número entero positivo.',
      });
    }

    const { nombrePieza, cuadrante, arcada } = req.body;

    if (!nombrePieza || !nombrePieza.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El campo nombrePieza es obligatorio.',
      });
    }

    const nombreLimpio = nombrePieza.trim();

    if (nombreLimpio.length > 60) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la pieza no puede superar los 60 caracteres.',
      });
    }

    // Verificar que existe la pieza
    const [resultCheck] = await pool.query('CALL sp_obtener_pieza_dental_por_id(?)', [id]);
    const existe = resultCheck[0];

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna pieza dental con ID (FDI) ${id}.`,
      });
    }

    // Usamos los valores actuales si no se envían en el body
    const piezaActual = existe[0];
    const nuevoCuadrante = cuadrante !== undefined ? Number(cuadrante) : piezaActual.cuadrante;
    const nuevaArcada = arcada || piezaActual.arcada;

    // Ejecutar la actualización mediante SP pasando todos los campos requeridos
    await pool.query('CALL sp_actualizar_pieza_dental(?, ?, ?, ?)', [
      id,
      nombreLimpio,
      nuevoCuadrante,
      nuevaArcada
    ]);

    // Consultar el registro actualizado para retornarlo
    const [resultUpdated] = await pool.query('CALL sp_obtener_pieza_dental_por_id(?)', [id]);
    const updated = resultUpdated[0];

    return res.json({
      success: true,
      mensaje: 'Pieza dental actualizada con éxito',
      datos: updated[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarPiezasDentales,
  obtenerPiezaDentalPorId,
  actualizarPiezaDental,
};