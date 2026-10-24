'use strict';

const { pool } = require('../config/db');

// Tipos de datos permitidos para validaciones previas
const TIPOS_ANTECEDENTES_PERMITIDOS = ['Alergia', 'Enfermedad', 'Medicacion', 'Cirugia', 'Otro'];
const TIPOS_DOCUMENTO_PERMITIDOS = ['DNI', 'CE', 'Pasaporte'];
const SEXOS_PERMITIDOS = ['Masculino', 'Femenino', 'Otro'];

/**
 * Listar todos los pacientes usando el SP sp_listar_pacientes
 */
async function listarPacientes(req, res, next) {
  try {
    const { busqueda, q, estado } = req.query;
    const termino = (busqueda || q || '').trim();
    const estadoFiltro = estado || '';

    const [rows] = await pool.query('CALL sp_listar_pacientes(?, ?)', [termino, estadoFiltro]);
    const pacientes = rows[0];

    return res.json({
      success: true,
      mensaje: 'Pacientes obtenidos correctamente',
      total: pacientes.length,
      datos: pacientes,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener un paciente por su ID con sus antecedentes médicos usando SPs
 */
async function obtenerPacientePorId(req, res, next) {
  try {
    const { idPaciente } = req.params;

    // 1. Obtener datos del paciente
    const [resultPaciente] = await pool.query('CALL sp_obtener_paciente_por_id(?)', [idPaciente]);
    const pacientes = resultPaciente[0];

    if (!pacientes || pacientes.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún paciente con ID ${idPaciente}`,
      });
    }

    const paciente = pacientes[0];

    // 2. Obtener antecedentes del paciente
    const [resultAntecedentes] = await pool.query('CALL sp_listar_antecedentes_paciente(?)', [idPaciente]);
    paciente.antecedentes = resultAntecedentes[0] || [];

    return res.json({
      success: true,
      mensaje: 'Paciente obtenido con éxito',
      datos: paciente,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear un nuevo paciente con soporte para antecedentes médicos en una sola transacción usando SPs
 */
async function crearPaciente(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      nombrePaciente,
      apellidosPaciente,
      tipoDocumento = 'DNI',
      documentoPaciente,
      fechaNacimientoPaciente,
      sexoPaciente,
      celularPaciente,
      correoPaciente,
      direccionPaciente,
      contactoEmergenciaNombre,
      contactoEmergenciaCelular,
      apoderadoId,
      antecedentes = [], // Array opcional: [{ tipoAntecedente, descripcionAntecedente }]
    } = req.body;

    // Validaciones de campos obligatorios
    if (!nombrePaciente || !nombrePaciente.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del paciente es obligatorio.',
      });
    }

    if (!apellidosPaciente || !apellidosPaciente.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los apellidos del paciente son obligatorios.',
      });
    }

    if (!documentoPaciente || !documentoPaciente.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El número de documento del paciente es obligatorio.',
      });
    }

    const tipoDocFinal = tipoDocumento || 'DNI';
    if (!TIPOS_DOCUMENTO_PERMITIDOS.includes(tipoDocFinal)) {
      return res.status(400).json({
        success: false,
        mensaje: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO_PERMITIDOS.join(', ')}`,
      });
    }

    if (sexoPaciente && !SEXOS_PERMITIDOS.includes(sexoPaciente)) {
      return res.status(400).json({
        success: false,
        mensaje: `Sexo inválido. Permitidos: ${SEXOS_PERMITIDOS.join(', ')}`,
      });
    }

    const documentoLimpio = documentoPaciente.trim();

    // Validar duplicado de documento mediante SP
    const [resultDoc] = await pool.query('CALL sp_verificar_paciente_documento(?, ?, NULL)', [
      tipoDocFinal,
      documentoLimpio,
    ]);

    if (resultDoc[0] && resultDoc[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe un paciente registrado con ${tipoDocFinal} "${documentoLimpio}".`,
      });
    }

    // Iniciar transacción para registrar paciente y antecedentes asociados
    await connection.beginTransaction();

    await connection.query(
      `CALL sp_crear_paciente(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @insertId)`,
      [
        nombrePaciente.trim(),
        apellidosPaciente.trim(),
        tipoDocFinal,
        documentoLimpio,
        fechaNacimientoPaciente || null,
        sexoPaciente || null,
        celularPaciente ? celularPaciente.trim() : null,
        correoPaciente ? correoPaciente.trim() : null,
        direccionPaciente ? direccionPaciente.trim() : null,
        contactoEmergenciaNombre ? contactoEmergenciaNombre.trim() : null,
        contactoEmergenciaCelular ? contactoEmergenciaCelular.trim() : null,
        apoderadoId ? parseInt(apoderadoId, 10) : null,
      ]
    );

    const [rowsId] = await connection.query('SELECT @insertId AS insertId');
    const idPaciente = rowsId[0]?.insertId;

    if (!idPaciente) {
      throw new Error('No se pudo obtener el ID del paciente generado por el SP.');
    }

    const usuarioIdActual = req.usuario?.idUsuario || null;

    // Registrar antecedentes si fueron proporcionados
    if (Array.isArray(antecedentes) && antecedentes.length > 0) {
      for (const ant of antecedentes) {
        if (!ant.tipoAntecedente || !TIPOS_ANTECEDENTES_PERMITIDOS.includes(ant.tipoAntecedente)) {
          continue;
        }

        await connection.query(
          `CALL sp_crear_antecedente_paciente(?, ?, ?, ?, @antId)`,
          [
            idPaciente,
            ant.tipoAntecedente,
            ant.descripcionAntecedente ? ant.descripcionAntecedente.trim() : null,
            usuarioIdActual,
          ]
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      mensaje: 'Paciente registrado exitosamente',
      datos: {
        idPaciente,
        nombrePaciente: nombrePaciente.trim(),
        apellidosPaciente: apellidosPaciente.trim(),
        tipoDocumento: tipoDocFinal,
        documentoPaciente: documentoLimpio,
      },
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Actualizar los datos de un paciente usando SP
 */
async function actualizarPaciente(req, res, next) {
  try {
    const { idPaciente } = req.params;
    const {
      nombrePaciente,
      apellidosPaciente,
      tipoDocumento,
      documentoPaciente,
      fechaNacimientoPaciente,
      sexoPaciente,
      celularPaciente,
      correoPaciente,
      direccionPaciente,
      contactoEmergenciaNombre,
      contactoEmergenciaCelular,
      apoderadoId,
      estadoPaciente,
    } = req.body;

    // Verificar existencia del paciente
    const [resultExiste] = await pool.query('CALL sp_obtener_paciente_por_id(?)', [idPaciente]);
    if (!resultExiste[0] || resultExiste[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún paciente con ID ${idPaciente}`,
      });
    }

    // Validaciones
    if (!nombrePaciente || !nombrePaciente.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del paciente es obligatorio.',
      });
    }

    if (!apellidosPaciente || !apellidosPaciente.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los apellidos del paciente son obligatorios.',
      });
    }

    if (!documentoPaciente || !documentoPaciente.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El número de documento del paciente es obligatorio.',
      });
    }

    const tipoDocFinal = tipoDocumento || 'DNI';
    const documentoLimpio = documentoPaciente.trim();

    // Validar duplicado de documento excluyendo al paciente actual
    const [resultDoc] = await pool.query('CALL sp_verificar_paciente_documento(?, ?, ?)', [
      tipoDocFinal,
      documentoLimpio,
      idPaciente,
    ]);

    if (resultDoc[0] && resultDoc[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe otro paciente con ${tipoDocFinal} "${documentoLimpio}".`,
      });
    }

    await pool.query(
      `CALL sp_actualizar_paciente(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idPaciente,
        nombrePaciente.trim(),
        apellidosPaciente.trim(),
        tipoDocFinal,
        documentoLimpio,
        fechaNacimientoPaciente || null,
        sexoPaciente || null,
        celularPaciente ? celularPaciente.trim() : null,
        correoPaciente ? correoPaciente.trim() : null,
        direccionPaciente ? direccionPaciente.trim() : null,
        contactoEmergenciaNombre ? contactoEmergenciaNombre.trim() : null,
        contactoEmergenciaCelular ? contactoEmergenciaCelular.trim() : null,
        apoderadoId ? parseInt(apoderadoId, 10) : null,
        estadoPaciente || null,
      ]
    );

    return res.json({
      success: true,
      mensaje: 'Paciente actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cambiar estado del paciente (Activo / Inactivo) usando SP
 */
async function cambiarEstadoPaciente(req, res, next) {
  try {
    const { idPaciente } = req.params;
    const { estadoPaciente } = req.body;

    if (!estadoPaciente || !['Activo', 'Inactivo'].includes(estadoPaciente)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El estado es obligatorio y debe ser "Activo" o "Inactivo".',
      });
    }

    // Verificar si existe el paciente
    const [resultExiste] = await pool.query('CALL sp_obtener_paciente_por_id(?)', [idPaciente]);
    if (!resultExiste[0] || resultExiste[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún paciente con ID ${idPaciente}`,
      });
    }

    await pool.query('CALL sp_cambiar_estado_paciente(?, ?)', [idPaciente, estadoPaciente]);

    return res.json({
      success: true,
      mensaje: `Paciente ${estadoPaciente === 'Activo' ? 'activado' : 'inactivado'} correctamente`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Eliminación lógica (soft-delete) de un paciente usando SP
 */
async function eliminarPaciente(req, res, next) {
  try {
    const { idPaciente } = req.params;

    // Verificar si existe el paciente
    const [resultExiste] = await pool.query('CALL sp_obtener_paciente_por_id(?)', [idPaciente]);
    if (!resultExiste[0] || resultExiste[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún paciente con ID ${idPaciente}`,
      });
    }

    await pool.query('CALL sp_eliminar_paciente(?)', [idPaciente]);

    return res.json({
      success: true,
      mensaje: 'Paciente eliminado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// MÉTODOS PARA ANTECEDENTES DEL PACIENTE
// ==========================================

/**
 * Listar antecedentes de un paciente específico usando SP
 */
async function listarAntecedentesPorPaciente(req, res, next) {
  try {
    const { idPaciente } = req.params;

    const [rows] = await pool.query('CALL sp_listar_antecedentes_paciente(?)', [idPaciente]);
    const antecedentes = rows[0] || [];

    return res.json({
      success: true,
      mensaje: 'Antecedentes obtenidos correctamente',
      total: antecedentes.length,
      datos: antecedentes,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Agregar un nuevo antecedente a un paciente existente usando SP
 */
async function agregarAntecedente(req, res, next) {
  try {
    const { idPaciente } = req.params;
    const { tipoAntecedente, descripcionAntecedente } = req.body;

    if (!tipoAntecedente || !TIPOS_ANTECEDENTES_PERMITIDOS.includes(tipoAntecedente)) {
      return res.status(400).json({
        success: false,
        mensaje: `El tipo de antecedente es obligatorio. Permitidos: ${TIPOS_ANTECEDENTES_PERMITIDOS.join(', ')}`,
      });
    }

    // Verificar que el paciente exista
    const [paciente] = await pool.query('CALL sp_obtener_paciente_por_id(?)', [idPaciente]);
    if (!paciente[0] || paciente[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún paciente con ID ${idPaciente}`,
      });
    }

    const usuarioIdActual = req.usuario?.idUsuario || null;

    await pool.query(
      'CALL sp_crear_antecedente_paciente(?, ?, ?, ?, @insertId)',
      [
        idPaciente,
        tipoAntecedente,
        descripcionAntecedente ? descripcionAntecedente.trim() : null,
        usuarioIdActual,
      ]
    );

    const [rowsId] = await pool.query('SELECT @insertId AS insertId');
    const idAntecedente = rowsId[0]?.insertId;

    return res.status(201).json({
      success: true,
      mensaje: 'Antecedente médico registrado exitosamente',
      datos: {
        idAntecedente,
        pacienteId: Number(idPaciente),
        tipoAntecedente,
        descripcionAntecedente: descripcionAntecedente ? descripcionAntecedente.trim() : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Eliminar un antecedente médico por su ID usando SP
 */
async function eliminarAntecedente(req, res, next) {
  try {
    const { idPaciente, idAntecedente } = req.params;

    const [result] = await pool.query('CALL sp_eliminar_antecedente_paciente(?, ?)', [
      idAntecedente,
      idPaciente,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró el antecedente con ID ${idAntecedente} para este paciente`,
      });
    }

    return res.json({
      success: true,
      mensaje: 'Antecedente médico eliminado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  cambiarEstadoPaciente,
  eliminarPaciente,
  listarAntecedentesPorPaciente,
  agregarAntecedente,
  eliminarAntecedente,
};
