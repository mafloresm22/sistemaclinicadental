'use strict';

const { pool } = require('../config/db');

/**
 * Listar todas las piezas dentales con filtros opcionales
 */
async function listarPiezasDentales(req, res, next) {
  try {
    const { arcada, cuadrante, busqueda, q } = req.query;
    const termino = (busqueda || q || '').trim();

    let sql = `
      SELECT idPieza, nombrePieza, cuadrante, arcada
      FROM piezas_dentales
      WHERE 1 = 1
    `;
    const params = [];

    if (arcada) {
      const arcadasValidas = ['Superior', 'Inferior'];
      if (!arcadasValidas.includes(arcada)) {
        return res.status(400).json({
          success: false,
          mensaje: `El valor de arcada debe ser uno de: ${arcadasValidas.join(', ')}.`,
        });
      }
      sql += ' AND arcada = ?';
      params.push(arcada);
    }

    if (cuadrante !== undefined && cuadrante !== '') {
      const cuadranteNum = Number(cuadrante);
      if (!Number.isInteger(cuadranteNum) || cuadranteNum < 1 || cuadranteNum > 8) {
        return res.status(400).json({
          success: false,
          mensaje: 'El cuadrante debe ser un entero entre 1 y 8.',
        });
      }
      sql += ' AND cuadrante = ?';
      params.push(cuadranteNum);
    }

    if (termino) {
      sql += ' AND (nombrePieza LIKE ? OR idPieza LIKE ?)';
      params.push(`%${termino}%`, `%${termino}%`);
    }

    sql += ' ORDER BY idPieza ASC';

    const [rows] = await pool.query(sql, params);

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
 * Obtener una pieza dental por su ID (código FDI)
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

    const [rows] = await pool.query(
      'SELECT idPieza, nombrePieza, cuadrante, arcada FROM piezas_dentales WHERE idPieza = ?',
      [id]
    );

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
 * Actualizar el nombre de una pieza dental por su ID (código FDI)
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

    const { nombrePieza } = req.body;

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

    // Verificar que existe
    const [existe] = await pool.query(
      'SELECT idPieza FROM piezas_dentales WHERE idPieza = ?',
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna pieza dental con ID (FDI) ${id}.`,
      });
    }

    await pool.query(
      'UPDATE piezas_dentales SET nombrePieza = ? WHERE idPieza = ?',
      [nombreLimpio, id]
    );

    const [updated] = await pool.query(
      'SELECT idPieza, nombrePieza, cuadrante, arcada FROM piezas_dentales WHERE idPieza = ?',
      [id]
    );

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
