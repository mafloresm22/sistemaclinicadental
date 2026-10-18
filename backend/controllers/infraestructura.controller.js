'use strict';

const { pool } = require('../config/db');

// SEDES

/**
 * Listar todas las sedes
 */
async function listarSedes(req, res, next) {
  try {
    const { busqueda, estado } = req.query;
    const termino = (busqueda || '').trim();
    const filtroEstado = (estado || '').trim();

    const [rows] = await pool.query('CALL sp_listar_sedes(?, ?)', [termino, filtroEstado]);
    const sedes = rows[0];

    return res.json({
      success: true,
      mensaje: 'Sedes obtenidas correctamente',
      total: sedes.length,
      datos: sedes,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener una sede por su ID con la lista de sus consultorios
 */
async function obtenerSedePorId(req, res, next) {
  try {
    const { idSede } = req.params;

    const [resultSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [idSede]);
    const sedes = resultSede[0];

    if (sedes.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ninguna sede con ID ${idSede}`,
      });
    }

    const sede = sedes[0];

    // Obtener consultorios pertenecientes a la sede
    const [resultConsultorios] = await pool.query('CALL sp_obtener_consultorios_por_sede(?)', [idSede]);
    const consultorios = resultConsultorios[0];

    sede.consultorios = consultorios;
    sede.totalConsultorios = consultorios.length;

    return res.json({
      success: true,
      mensaje: 'Sede obtenida con éxito',
      datos: sede,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear una nueva sede
 */
async function crearSede(req, res, next) {
  try {
    const { nombreSede, direccionSede, telefonoSede, estadoSede } = req.body;

    if (!nombreSede || !nombreSede.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la sede es obligatorio.',
      });
    }

    const nombreLimpio = nombreSede.trim();
    const direccionLimpia = direccionSede && direccionSede.trim() ? direccionSede.trim() : 'Ninguno';
    const telefonoLimpio = telefonoSede && telefonoSede.trim() ? telefonoSede.trim() : 'Ninguno';
    const estadoFinal = estadoSede === 'Inactivo' ? 'Inactivo' : 'Activo';

    // Validar nombre duplicado usando SP
    const [resultDuplicado] = await pool.query('CALL sp_verificar_sede_nombre(?, NULL)', [nombreLimpio]);
    if (resultDuplicado[0].length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `Ya existe una sede registrada con el nombre "${nombreLimpio}".`,
      });
    }

    // Insertar mediante SP con parámetro OUT
    await pool.query('CALL sp_crear_sede(?, ?, ?, ?, @insertId)', [
      nombreLimpio,
      direccionLimpia,
      telefonoLimpio,
      estadoFinal,
    ]);

    const [rowsId] = await pool.query('SELECT @insertId AS insertId');
    const insertId = rowsId[0].insertId;

    const [nuevaSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [insertId]);

    return res.status(201).json({
      success: true,
      mensaje: 'Sede creada exitosamente.',
      datos: {
        ...nuevaSede[0][0],
        totalConsultorios: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar una sede existente
 */
async function actualizarSede(req, res, next) {
  try {
    const { idSede } = req.params;
    const { nombreSede, direccionSede, telefonoSede, estadoSede } = req.body;

    const [resultSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [idSede]);
    if (resultSede[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró la sede con ID ${idSede}`,
      });
    }

    if (!nombreSede || !nombreSede.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre de la sede es obligatorio.',
      });
    }

    const nombreLimpio = nombreSede.trim();
    const direccionLimpia = direccionSede && direccionSede.trim() ? direccionSede.trim() : 'Ninguno';
    const telefonoLimpio = telefonoSede && telefonoSede.trim() ? telefonoSede.trim() : 'Ninguno';
    const estadoFinal = estadoSede === 'Inactivo' ? 'Inactivo' : 'Activo';

    // Validar duplicado con otra sede distinta
    const [resultDuplicado] = await pool.query('CALL sp_verificar_sede_nombre(?, ?)', [nombreLimpio, idSede]);
    if (resultDuplicado[0].length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `Ya existe otra sede con el nombre "${nombreLimpio}".`,
      });
    }

    // Actualizar mediante SP
    await pool.query('CALL sp_actualizar_sede(?, ?, ?, ?, ?)', [
      idSede,
      nombreLimpio,
      direccionLimpia,
      telefonoLimpio,
      estadoFinal,
    ]);

    // Obtener datos actualizados junto con el conteo total de consultorios
    const [rowsActualizada] = await pool.query('CALL sp_listar_sedes(?, ?)', ['', '']);
    const sedeActualizada = rowsActualizada[0].find((s) => s.idSede == idSede);

    return res.json({
      success: true,
      mensaje: 'Sede actualizada correctamente.',
      datos: sedeActualizada,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cambiar estado de una sede
 */
async function cambiarEstadoSede(req, res, next) {
  try {
    const { idSede } = req.params;
    const { estadoSede } = req.body;

    if (!['Activo', 'Inactivo'].includes(estadoSede)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El estado debe ser "Activo" o "Inactivo".',
      });
    }

    const [resultSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [idSede]);
    if (resultSede[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró la sede con ID ${idSede}`,
      });
    }

    await pool.query('CALL sp_cambiar_estado_sede(?, ?)', [idSede, estadoSede]);

    return res.json({
      success: true,
      mensaje: `Sede marcada como ${estadoSede} correctamente.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Eliminar una sede
 */
async function eliminarSede(req, res, next) {
  try {
    const { idSede } = req.params;

    const [resultSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [idSede]);
    if (resultSede[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró la sede con ID ${idSede}`,
      });
    }

    const sede = resultSede[0][0];

    // Validar si tiene consultorios asociados
    const [resultConsultorios] = await pool.query('CALL sp_contar_consultorios_sede(?)', [idSede]);
    const totalConsultorios = resultConsultorios[0][0].total;

    if (totalConsultorios > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `No se puede eliminar la sede "${sede.nombreSede}" porque tiene ${totalConsultorios} consultorio(s) asociado(s). Elimina o traslada los consultorios primero.`,
      });
    }

    // Validar si tiene citas asociadas
    const [resultCitas] = await pool.query('CALL sp_contar_citas_sede(?)', [idSede]);
    const totalCitas = resultCitas[0][0].total;

    if (totalCitas > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `No se puede eliminar la sede porque tiene historial de citas médicas registradas. Puedes cambiar su estado a "Inactivo" en su lugar.`,
      });
    }

    // Eliminar mediante SP
    await pool.query('CALL sp_eliminar_sede(?)', [idSede]);

    return res.json({
      success: true,
      mensaje: `Sede "${sede.nombreSede}" eliminada correctamente.`,
    });
  } catch (err) {
    next(err);
  }
}

// CONSULTORIOS

/**
 * Listar consultorios con filtros por sede, término de búsqueda y estado
 */
async function listarConsultorios(req, res, next) {
  try {
    const { busqueda, sedeId, estado } = req.query;
    const termino = (busqueda || '').trim();
    const filtroSedeId = Number(sedeId) || 0;
    const filtroEstado = (estado || '').trim();

    const [rows] = await pool.query('CALL sp_listar_consultorios(?, ?, ?)', [
      termino,
      filtroSedeId,
      filtroEstado,
    ]);
    const consultorios = rows[0];

    return res.json({
      success: true,
      mensaje: 'Consultorios obtenidos correctamente',
      total: consultorios.length,
      datos: consultorios,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener un consultorio por su ID
 */
async function obtenerConsultorioPorId(req, res, next) {
  try {
    const { idConsultorio } = req.params;

    const [rows] = await pool.query('CALL sp_obtener_consultorio_por_id(?)', [idConsultorio]);
    const consultorios = rows[0];

    if (consultorios.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró el consultorio con ID ${idConsultorio}`,
      });
    }

    return res.json({
      success: true,
      mensaje: 'Consultorio obtenido con éxito',
      datos: consultorios[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear un nuevo consultorio
 */
async function crearConsultorio(req, res, next) {
  try {
    const { nombreConsultorio, sedeId, estadoConsultorio } = req.body;

    if (!nombreConsultorio || !nombreConsultorio.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del consultorio es obligatorio.',
      });
    }

    if (!sedeId) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debes seleccionar la sede a la que pertenece el consultorio.',
      });
    }

    // Validar que la sede exista utilizando el SP previo de sedes
    const [resultSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [sedeId]);
    if (resultSede[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'La sede seleccionada no existe.',
      });
    }
    const sede = resultSede[0][0];

    const nombreLimpio = nombreConsultorio.trim();
    const estadoFinal = estadoConsultorio === 'Inactivo' ? 'Inactivo' : 'Activo';

    // Validar si ya existe un consultorio con el mismo nombre en la misma sede usando SP
    const [resultExistente] = await pool.query('CALL sp_verificar_consultorio_nombre(?, ?, NULL)', [
      nombreLimpio,
      sedeId,
    ]);
    if (resultExistente[0].length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `Ya existe un consultorio con el nombre "${nombreLimpio}" en la sede "${sede.nombreSede}".`,
      });
    }

    // Insertar mediante SP con parámetro OUT
    await pool.query('CALL sp_crear_consultorio(?, ?, ?, @insertId)', [
      nombreLimpio,
      sedeId,
      estadoFinal,
    ]);

    const [rowsId] = await pool.query('SELECT @insertId AS insertId');
    const insertId = rowsId[0].insertId;

    const [nuevoConsultorio] = await pool.query('CALL sp_obtener_consultorio_por_id(?)', [insertId]);

    return res.status(201).json({
      success: true,
      mensaje: 'Consultorio creado exitosamente.',
      datos: nuevoConsultorio[0][0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar un consultorio existente
 */
async function actualizarConsultorio(req, res, next) {
  try {
    const { idConsultorio } = req.params;
    const { nombreConsultorio, sedeId, estadoConsultorio } = req.body;

    const [resultActual] = await pool.query('CALL sp_obtener_consultorio_por_id(?)', [idConsultorio]);
    if (resultActual[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró el consultorio con ID ${idConsultorio}`,
      });
    }
    const consultorioActual = resultActual[0][0];

    if (!nombreConsultorio || !nombreConsultorio.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del consultorio es obligatorio.',
      });
    }

    const sedeDestinoId = sedeId || consultorioActual.sedeId;

    // Validar existencia de la sede destino
    const [resultSede] = await pool.query('CALL sp_obtener_sede_por_id(?)', [sedeDestinoId]);
    if (resultSede[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'La sede seleccionada no existe.',
      });
    }
    const sede = resultSede[0][0];

    const nombreLimpio = nombreConsultorio.trim();
    const estadoFinal = estadoConsultorio === 'Inactivo' ? 'Inactivo' : 'Activo';

    // Validar nombre duplicado dentro de la misma sede usando SP
    const [resultDuplicado] = await pool.query('CALL sp_verificar_consultorio_nombre(?, ?, ?)', [
      nombreLimpio,
      sedeDestinoId,
      idConsultorio,
    ]);
    if (resultDuplicado[0].length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: `Ya existe un consultorio con el nombre "${nombreLimpio}" en la sede "${sede.nombreSede}".`,
      });
    }

    // Actualizar mediante SP
    await pool.query('CALL sp_actualizar_consultorio(?, ?, ?, ?)', [
      idConsultorio,
      nombreLimpio,
      sedeDestinoId,
      estadoFinal,
    ]);

    const [consultorioActualizado] = await pool.query('CALL sp_obtener_consultorio_por_id(?)', [
      idConsultorio,
    ]);

    return res.json({
      success: true,
      mensaje: 'Consultorio actualizado correctamente.',
      datos: consultorioActualizado[0][0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cambiar estado de un consultorio
 */
async function cambiarEstadoConsultorio(req, res, next) {
  try {
    const { idConsultorio } = req.params;
    const { estadoConsultorio } = req.body;

    if (!['Activo', 'Inactivo'].includes(estadoConsultorio)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El estado debe ser "Activo" o "Inactivo".',
      });
    }

    const [resultConsultorio] = await pool.query('CALL sp_obtener_consultorio_por_id(?)', [
      idConsultorio,
    ]);
    if (resultConsultorio[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró el consultorio con ID ${idConsultorio}`,
      });
    }

    await pool.query('CALL sp_cambiar_estado_consultorio(?, ?)', [idConsultorio, estadoConsultorio]);

    return res.json({
      success: true,
      mensaje: `Consultorio marcado como ${estadoConsultorio} correctamente.`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Sedes
  listarSedes,
  obtenerSedePorId,
  crearSede,
  actualizarSede,
  cambiarEstadoSede,
  eliminarSede,

  // Consultorios
  listarConsultorios,
  obtenerConsultorioPorId,
  crearConsultorio,
  actualizarConsultorio,
  cambiarEstadoConsultorio,
};
