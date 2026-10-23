'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

/**
 * Genera el nombre de usuario base: 3 primeras letras del nombre + 3 primeras letras del apellido
 */
function generarBaseUsername(nombre, apellidos) {
  const limpiar = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-zA-Z0-9]/g, '')     // solo alfanumérico
      .toLowerCase();

  const n = limpiar(nombre);
  const primerApellido = (apellidos || '').trim().split(/\s+/)[0];
  const a = limpiar(primerApellido);

  const subN = n.slice(0, 3);
  const subA = a.slice(0, 3);
  const resultado = `${subN}${subA}`;
  return resultado.length >= 2 ? resultado : 'doc';
}

/**
 * Listar todos los doctores usando SP
 */
async function listarDoctores(req, res, next) {
  try {
    const { busqueda, q, estado } = req.query;
    const termino = (busqueda || q || '').trim();
    const estadoFiltro = estado || '';

    const [rows] = await pool.query('CALL sp_listar_doctores(?, ?)', [termino, estadoFiltro]);
    const doctores = rows[0];

    return res.json({
      success: true,
      mensaje: 'Doctores obtenidos correctamente',
      total: doctores.length,
      datos: doctores,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener un doctor por su ID usando SP
 */
async function obtenerDoctorPorId(req, res, next) {
  try {
    const id = req.params.idDoctor;

    const [result] = await pool.query('CALL sp_obtener_doctor_por_id(?)', [id]);
    const doctores = result[0];

    if (doctores.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún doctor con ID ${id}`,
      });
    }

    return res.json({
      success: true,
      mensaje: 'Doctor obtenido con éxito',
      datos: doctores[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear un nuevo doctor usando SP
 */
async function crearDoctor(req, res, next) {
  try {
    const {
      nombreDoctor,
      apellidosDoctor,
      tipoDocumento,
      documentoDoctor,
      nroColegiatura,
      celularDoctor,
      correoDoctor,
      especialidades, // array de IDs: [1, 2]
    } = req.body;

    // Validaciones obligatorias
    if (!nombreDoctor || !nombreDoctor.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del doctor es obligatorio.',
      });
    }

    if (!apellidosDoctor || !apellidosDoctor.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los apellidos del doctor son obligatorios.',
      });
    }

    if (!documentoDoctor || !documentoDoctor.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El documento del doctor es obligatorio.',
      });
    }

    const tiposValidos = ['DNI', 'CE', 'Pasaporte'];
    const tipoFinal = tipoDocumento && tiposValidos.includes(tipoDocumento) ? tipoDocumento : 'DNI';

    const nombreLimpio = nombreDoctor.trim();
    const apellidosLimpio = apellidosDoctor.trim();
    const documentoLimpio = documentoDoctor.trim();
    const celularLimpio = celularDoctor && celularDoctor.trim() ? celularDoctor.trim() : null;
    const correoLimpio = correoDoctor && correoDoctor.trim() ? correoDoctor.trim() : null;
    const colegiaturaLimpia = nroColegiatura && nroColegiatura.trim() ? nroColegiatura.trim() : null;

    if (nombreLimpio.length > 80) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre no puede superar los 80 caracteres.',
      });
    }

    if (apellidosLimpio.length > 100) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los apellidos no pueden superar los 100 caracteres.',
      });
    }

    if (correoLimpio) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoLimpio)) {
        return res.status(400).json({
          success: false,
          mensaje: 'El correo electrónico no tiene un formato válido.',
        });
      }
    }

    // Verificar duplicado por documento
    const [resultDoc] = await pool.query('CALL sp_verificar_doctor_documento(?, NULL)', [documentoLimpio]);
    if (resultDoc[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe un doctor registrado con el documento "${documentoLimpio}".`,
      });
    }

    // Verificar duplicado por correo (si se proporcionó)
    if (correoLimpio) {
      const [resultCorreo] = await pool.query('CALL sp_verificar_doctor_correo(?, NULL)', [correoLimpio]);
      if (resultCorreo[0].length > 0) {
        return res.status(409).json({
          success: false,
          mensaje: `Ya existe un doctor registrado con el correo "${correoLimpio}".`,
        });
      }
    }

    // Transacción: Crear usuario automático y registrar doctor vinculado
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Generar nombre de usuario único (3 primeras letras de nombre + 3 de apellido)
      const baseUsername = generarBaseUsername(nombreLimpio, apellidosLimpio);
      let usernameFinal = baseUsername;
      let contador = 1;

      while (true) {
        const [usuarioExiste] = await connection.query(
          'SELECT idUsuario FROM Usuarios WHERE nombreUsuario = ?',
          [usernameFinal]
        );
        if (usuarioExiste.length === 0) {
          break;
        }
        usernameFinal = `${baseUsername}${contador}`;
        contador++;
      }

      // 2. Hash de contraseña usando el DNI / Documento
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(documentoLimpio, saltRounds);

      // 3. Insertar usuario en la tabla Usuarios (rolId: 2 = Doctor)
      const [resUsuario] = await connection.query(
        'INSERT INTO Usuarios (nombreUsuario, passwordHash, estadoUsuario, rolId) VALUES (?, ?, ?, ?)',
        [usernameFinal, passwordHash, 'Activo', 2]
      );
      const nuevoUsuarioId = resUsuario.insertId;

      // 4. Insertar doctor mediante SP con el id de usuario generado
      await connection.query(
        'CALL sp_crear_doctor(?, ?, ?, ?, ?, ?, ?, ?, @insertId)',
        [
          nombreLimpio,
          apellidosLimpio,
          tipoFinal,
          documentoLimpio,
          colegiaturaLimpia,
          celularLimpio,
          correoLimpio,
          nuevoUsuarioId,
        ]
      );

      const [rowsId] = await connection.query('SELECT @insertId AS insertId');
      const insertId = rowsId[0].insertId;

      // 5. Asignar especialidades en tabla intermedia
      if (especialidades && Array.isArray(especialidades) && especialidades.length > 0) {
        for (const idEsp of especialidades) {
          await connection.query('CALL sp_asignar_especialidad_doctor(?, ?)', [insertId, Number(idEsp)]);
        }
      }

      await connection.commit();

      return res.status(201).json({
        success: true,
        mensaje: `Doctor creado con éxito. Se generó su usuario: "${usernameFinal}" (contraseña: su DNI)`,
        datos: {
          idDoctor: insertId,
          nombreDoctor: nombreLimpio,
          apellidosDoctor: apellidosLimpio,
          tipoDocumento: tipoFinal,
          documentoDoctor: documentoLimpio,
          nroColegiatura: colegiaturaLimpia,
          celularDoctor: celularLimpio,
          correoDoctor: correoLimpio,
          estadoDoctor: 'Activo',
          usuarioId: nuevoUsuarioId,
          nombreUsuario: usernameFinal,
          especialidades: especialidades || [],
        },
      });
    } catch (errTrans) {
      await connection.rollback();
      throw errTrans;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar un doctor existente usando SP
 */
async function actualizarDoctor(req, res, next) {
  try {
    const id = req.params.idDoctor;
    const {
      nombreDoctor,
      apellidosDoctor,
      tipoDocumento,
      documentoDoctor,
      nroColegiatura,
      celularDoctor,
      correoDoctor,
      especialidades,
    } = req.body;

    // Verificar existencia
    const [resultExistente] = await pool.query('CALL sp_obtener_doctor_por_id(?)', [id]);
    if (resultExistente[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún doctor con ID ${id}`,
      });
    }

    if (!nombreDoctor || !nombreDoctor.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del doctor es obligatorio.',
      });
    }

    if (!apellidosDoctor || !apellidosDoctor.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los apellidos del doctor son obligatorios.',
      });
    }

    if (!documentoDoctor || !documentoDoctor.trim()) {
      return res.status(400).json({
        success: false,
        mensaje: 'El documento del doctor es obligatorio.',
      });
    }

    const tiposValidos = ['DNI', 'CE', 'Pasaporte'];
    const tipoFinal = tipoDocumento && tiposValidos.includes(tipoDocumento) ? tipoDocumento : 'DNI';

    const nombreLimpio = nombreDoctor.trim();
    const apellidosLimpio = apellidosDoctor.trim();
    const documentoLimpio = documentoDoctor.trim();
    const celularLimpio = celularDoctor && celularDoctor.trim() ? celularDoctor.trim() : null;
    const correoLimpio = correoDoctor && correoDoctor.trim() ? correoDoctor.trim() : null;
    const colegiaturaLimpia = nroColegiatura && nroColegiatura.trim() ? nroColegiatura.trim() : null;

    if (nombreLimpio.length > 80) {
      return res.status(400).json({ success: false, mensaje: 'El nombre no puede superar los 80 caracteres.' });
    }
    if (apellidosLimpio.length > 100) {
      return res.status(400).json({ success: false, mensaje: 'Los apellidos no pueden superar los 100 caracteres.' });
    }

    if (correoLimpio) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoLimpio)) {
        return res.status(400).json({ success: false, mensaje: 'El correo electrónico no tiene un formato válido.' });
      }
    }

    // Verificar duplicado de documento excluyendo el ID actual
    const [resultDoc] = await pool.query('CALL sp_verificar_doctor_documento(?, ?)', [documentoLimpio, id]);
    if (resultDoc[0].length > 0) {
      return res.status(409).json({
        success: false,
        mensaje: `Ya existe otro doctor con el documento "${documentoLimpio}".`,
      });
    }

    // Verificar duplicado de correo excluyendo el ID actual
    if (correoLimpio) {
      const [resultCorreo] = await pool.query('CALL sp_verificar_doctor_correo(?, ?)', [correoLimpio, id]);
      if (resultCorreo[0].length > 0) {
        return res.status(409).json({
          success: false,
          mensaje: `Ya existe otro doctor con el correo "${correoLimpio}".`,
        });
      }
    }

    // Actualizar mediante SP
    await pool.query(
      'CALL sp_actualizar_doctor(?, ?, ?, ?, ?, ?, ?, ?)',
      [id, nombreLimpio, apellidosLimpio, tipoFinal, documentoLimpio, colegiaturaLimpia, celularLimpio, correoLimpio]
    );

    // Sincronizar especialidades en tabla intermedia (si se proporcionaron)
    if (especialidades !== undefined && Array.isArray(especialidades)) {
      await pool.query('DELETE FROM Doctores_Especialidades WHERE doctorId = ?', [id]);
      for (const idEsp of especialidades) {
        await pool.query('CALL sp_asignar_especialidad_doctor(?, ?)', [id, Number(idEsp)]);
      }
    }

    return res.json({
      success: true,
      mensaje: 'Doctor actualizado con éxito',
      datos: {
        idDoctor: Number(id),
        nombreDoctor: nombreLimpio,
        apellidosDoctor: apellidosLimpio,
        tipoDocumento: tipoFinal,
        documentoDoctor: documentoLimpio,
        nroColegiatura: colegiaturaLimpia,
        celularDoctor: celularLimpio,
        correoDoctor: correoLimpio,
        especialidades: especialidades || [],
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cambiar el estado (Activo/Inactivo) de un doctor usando SP
 */
async function cambiarEstadoDoctor(req, res, next) {
  try {
    const id = req.params.idDoctor;
    const { estadoDoctor } = req.body;

    const estadosValidos = ['Activo', 'Inactivo'];
    if (!estadoDoctor || !estadosValidos.includes(estadoDoctor)) {
      return res.status(400).json({
        success: false,
        mensaje: `El estado debe ser uno de: ${estadosValidos.join(', ')}.`,
      });
    }

    const [resultExistente] = await pool.query('CALL sp_obtener_doctor_por_id(?)', [id]);
    if (resultExistente[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún doctor con ID ${id}`,
      });
    }

    await pool.query('CALL sp_cambiar_estado_doctor(?, ?)', [id, estadoDoctor]);

    return res.json({
      success: true,
      mensaje: `Estado del doctor actualizado a "${estadoDoctor}" correctamente`,
      datos: { idDoctor: Number(id), estadoDoctor },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Desactivar un doctor (estadoDoctor → 'Inactivo')
 * El DELETE no elimina físicamente: cambia el estado a Inactivo.
 */
async function eliminarDoctor(req, res, next) {
  try {
    const id = req.params.idDoctor;

    const [resultExistente] = await pool.query('CALL sp_obtener_doctor_por_id(?)', [id]);
    if (resultExistente[0].length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: `No se encontró ningún doctor con ID ${id}`,
      });
    }

    const doctor = resultExistente[0][0];

    if (doctor.estadoDoctor === 'Inactivo') {
      return res.status(400).json({
        success: false,
        mensaje: `El doctor "${doctor.nombreDoctor} ${doctor.apellidosDoctor}" ya se encuentra Inactivo.`,
      });
    }

    // Desactivar mediante SP (cambia estadoDoctor = 'Inactivo')
    await pool.query('CALL sp_eliminar_doctor(?)', [id]);

    return res.json({
      success: true,
      mensaje: `Doctor "${doctor.nombreDoctor} ${doctor.apellidosDoctor}" desactivado correctamente`,
      datos: {
        idDoctor: Number(id),
        estadoDoctor: 'Inactivo',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarDoctores,
  obtenerDoctorPorId,
  crearDoctor,
  actualizarDoctor,
  cambiarEstadoDoctor,
  eliminarDoctor,
};
