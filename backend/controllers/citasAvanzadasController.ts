import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import { 
  validateBody, 
  validateParams, 
  getValidatedBody, 
  getValidatedParams 
} from '../middleware/validation';
import {
  validateFechaCitaMedica,
  validateConflictoHorarios,
  validateImage,
  validateMultipleFiles
} from '../middleware/advancedValidation';
import { 
  fechaCitaMedicaSchema,
  pacienteAvanzadoSchema,
  disponibilidadMedicaAvanzadaSchema,
  montoMedicoSchema 
} from '../schemas/advancedValidations';
import { citaIdSchema, usuarioIdSchema } from '../schemas/validationSchemas';
import { createNotFoundError, createConflictError, createBadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// ========================================
// CONTROLLER CON VALIDACIONES AVANZADAS
// ========================================

/**
 * Crear cita médica con validaciones avanzadas
 * Incluye validación de horarios, conflictos y reglas de negocio
 */
export const createCitaAvanzada = [
  validateBody(fechaCitaMedicaSchema.merge(z.object({
    paciente_id: z.string().uuid('ID de paciente inválido'),
    doctor_id: z.string().uuid('ID de doctor inválido'),
    tipo_cita: z.enum(['CONSULTA', 'CONTROL', 'EMERGENCIA', 'CIRUGIA']),
    observaciones: z.string().optional(),
  }))),
  validateFechaCitaMedica,
  validateConflictoHorarios,
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    
    // Validaciones adicionales de negocio
    
    // 1. Verificar que el doctor existe y está activo
    const doctor = await prisma.usuario.findFirst({
      where: { 
        id: data.doctor_id, 
        rol: 'DOCTOR',
        // Agregar campo activo si existe en el schema
      }
    });
    
    if (!doctor) {
      throw createNotFoundError('Doctor no encontrado o inactivo');
    }
    
    // 2. Verificar que el paciente existe
    const paciente = await prisma.pacientes.findUnique({
      where: { id: data.paciente_id }
    });
    
    if (!paciente) {
      throw createNotFoundError('Paciente no encontrado');
    }
    
    // 3. Verificar disponibilidad del doctor en esa fecha/hora
    const fechaCita = new Date(data.fecha_hora);
    const diaSemana = fechaCita.getDay();
    const horaCita = fechaCita.getHours();
    const minutoCita = fechaCita.getMinutes();
    const horarioCompleto = `${horaCita.toString().padStart(2, '0')}:${minutoCita.toString().padStart(2, '0')}`;
    
    const disponibilidad = await prisma.disponibilidad_medico.findFirst({
      where: {
        doctor_id: data.doctor_id,
        dia_semana: diaSemana,
        activo: true,
        hora_inicio: { lte: horarioCompleto },
        hora_fin: { gt: horarioCompleto }
      }
    });
    
    if (!disponibilidad) {
      throw createConflictError('El doctor no está disponible en el horario solicitado');
    }
    
    // 4. Verificar que no hay conflictos con otras citas
    const fechaInicio = new Date(data.fecha_hora);
    const fechaFin = new Date(fechaInicio.getTime() + (data.duracion * 60000));
    
    const citasConflicto = await prisma.citas.findMany({
      where: {
        doctor_id: data.doctor_id,
        estado: { in: ['PROGRAMADA', 'EN_CURSO'] },
        OR: [
          {
            AND: [
              { fecha_hora: { lte: fechaInicio } },
              { 
                fecha_hora: { 
                  gte: new Date(fechaInicio.getTime() - (120 * 60000)) // 2 horas antes
                } 
              }
            ]
          },
          {
            AND: [
              { fecha_hora: { gte: fechaInicio } },
              { fecha_hora: { lte: fechaFin } }
            ]
          }
        ]
      }
    });
    
    if (citasConflicto.length > 0) {
      throw createConflictError('Ya existe una cita programada en este horario');
    }
    
    // 5. Crear la cita
    const nuevaCita = await prisma.citas.create({
      data: {
        paciente_id: data.paciente_id,
        doctor_id: data.doctor_id,
        fecha_hora: data.fecha_hora,
        duracion: data.duracion,
        estado: 'PROGRAMADA',
        tipo_cita: data.tipo_cita,
        observaciones: data.observaciones,
        // Agregar campos adicionales según el schema
      },
      include: {
        paciente: {
          select: { nombre: true, apellido: true, telefono: true }
        },
        doctor: {
          select: { nombre: true, apellido: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Cita médica creada exitosamente',
      data: nuevaCita
    });
  })
];

/**
 * Registrar paciente con validaciones avanzadas
 * Incluye validación de tutor legal para menores y seguro médico
 */
export const registrarPacienteAvanzado = [
  validateBody(pacienteAvanzadoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    
    // Validaciones adicionales
    
    // 1. Verificar que el email no esté en uso
    const pacienteExistente = await prisma.pacientes.findFirst({
      where: { email: data.email }
    });
    
    if (pacienteExistente) {
      throw createConflictError('Ya existe un paciente con este email');
    }
    
    // 2. Si es menor de edad, validar datos del tutor
    if (data.es_menor && data.tutor_legal) {
      // Validar que el teléfono del tutor no sea igual al del paciente
      if (data.tutor_legal.telefono === data.telefono) {
        throw createBadRequestError('El teléfono del tutor debe ser diferente al del paciente');
      }
    }
    
    // 3. Crear el paciente
    const nuevoPaciente = await prisma.pacientes.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero,
        telefono: data.telefono,
        email: data.email,
        organizacion_id: 'placeholder-org-id', // Usar ID real de la organización del contexto
        documento_identidad: null,
        direccion: null
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      data: nuevoPaciente
    });
  })
];

/**
 * Subir imagen de perfil de paciente
 * Incluye validación avanzada de archivos
 */
export const subirImagenPerfil = [
  validateParams(z.object({ pacienteId: z.string().uuid() })),
  ...validateImage,
  asyncHandler(async (req: Request, res: Response) => {
    const { pacienteId } = getValidatedParams(req);
    const archivo = (req as any).validatedFile;
    
    // Verificar que el paciente existe
    const paciente = await prisma.pacientes.findUnique({
      where: { id: pacienteId }
    });
    
    if (!paciente) {
      throw createNotFoundError('Paciente no encontrado');
    }
    
    // Simular guardado del archivo
    const nombreArchivo = `perfil_${pacienteId}_${Date.now()}.${archivo.mimetype.split('/')[1]}`;
    const rutaArchivo = `/uploads/perfiles/${nombreArchivo}`;
    
    // En un caso real, aquí guardarías el archivo en el sistema de archivos o cloud storage
    // Por ejemplo: await uploadToCloudStorage(archivo.buffer, nombreArchivo);
    
    // Actualizar el paciente con la ruta de la imagen
    const pacienteActualizado = await prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        // imagen_perfil: rutaArchivo // Agregar este campo al schema si no existe
      }
    });
    
    res.json({
      success: true,
      message: 'Imagen de perfil subida exitosamente',
      data: {
        paciente: pacienteActualizado,
        imagen: {
          nombre: nombreArchivo,
          ruta: rutaArchivo,
          tamaño: archivo.size,
          tipo: archivo.mimetype
        }
      }
    });
  })
];

/**
 * Subir documentos múltiples (imágenes y PDFs)
 */
export const subirDocumentosMultiples = [
  validateParams(z.object({ pacienteId: z.string().uuid() })),
  ...validateMultipleFiles,
  asyncHandler(async (req: Request, res: Response) => {
    const { pacienteId } = getValidatedParams(req);
    const archivos = (req as any).validatedFiles;
    
    // Verificar que el paciente existe
    const paciente = await prisma.pacientes.findUnique({
      where: { id: pacienteId }
    });
    
    if (!paciente) {
      throw createNotFoundError('Paciente no encontrado');
    }
    
    const archivosGuardados = [];
    
    // Procesar imágenes
    if (archivos.imagenes) {
      for (const imagen of archivos.imagenes) {
        const nombreArchivo = `imagen_${pacienteId}_${Date.now()}_${imagen.originalname}`;
        const rutaArchivo = `/uploads/imagenes/${nombreArchivo}`;
        
        archivosGuardados.push({
          tipo: 'imagen',
          nombre: nombreArchivo,
          ruta: rutaArchivo,
          tamaño: imagen.size,
          mimetype: imagen.mimetype
        });
      }
    }
    
    // Procesar documentos
    if (archivos.documentos) {
      for (const documento of archivos.documentos) {
        const nombreArchivo = `documento_${pacienteId}_${Date.now()}_${documento.originalname}`;
        const rutaArchivo = `/uploads/documentos/${nombreArchivo}`;
        
        archivosGuardados.push({
          tipo: 'documento',
          nombre: nombreArchivo,
          ruta: rutaArchivo,
          tamaño: documento.size,
          mimetype: documento.mimetype
        });
      }
    }
    
    res.json({
      success: true,
      message: `${archivosGuardados.length} archivos subidos exitosamente`,
      data: {
        paciente: paciente,
        archivos: archivosGuardados
      }
    });
  })
];

/**
 * Procesar pago con validaciones avanzadas
 */
export const procesarPagoAvanzado = [
  validateBody(montoMedicoSchema.merge(z.object({
    cita_id: z.string().uuid('ID de cita inválido'),
    concepto: z.string().min(1, 'Concepto requerido'),
  }))),
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    
    // Verificar que la cita existe
    const cita = await prisma.citas.findUnique({
      where: { id: data.cita_id },
      include: { paciente: true }
    });
    
    if (!cita) {
      throw createNotFoundError('Cita no encontrada');
    }
    
    // Crear el cobro
    const nuevoCobro = await prisma.cobros.create({
      data: {
        paciente_id: cita.paciente_id,
        fecha_cobro: new Date(),
        monto_total: data.monto_total,
        estado: 'COMPLETADO',
        notas: data.concepto,
        usuario_id: 'placeholder-user-id', // Usar ID real del usuario del contexto
        metodo_pago: data.metodos_pago[0]?.metodo || 'EFECTIVO'
      }
    });
    
    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: {
        cobro: nuevoCobro,
        cita: cita,
        metodos_pago: data.metodos_pago
      }
    });
  })
];

/**
 * Obtener citas con filtros avanzados
 */
export const obtenerCitasAvanzadas = [
  validateBody(z.object({
    doctor_id: z.string().uuid().optional(),
    fecha_desde: z.string().datetime().optional(),
    fecha_hasta: z.string().datetime().optional(),
    estado: z.enum(['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']).optional(),
    tipo_cita: z.enum(['CONSULTA', 'CONTROL', 'EMERGENCIA', 'CIRUGIA']).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const filtros = getValidatedBody(req);
    
    const whereCondition: any = {};
    
    if (filtros.doctor_id) whereCondition.doctor_id = filtros.doctor_id;
    if (filtros.estado) whereCondition.estado = filtros.estado;
    if (filtros.tipo_cita) whereCondition.tipo_cita = filtros.tipo_cita;
    
    if (filtros.fecha_desde || filtros.fecha_hasta) {
      whereCondition.fecha_hora = {};
      if (filtros.fecha_desde) whereCondition.fecha_hora.gte = new Date(filtros.fecha_desde);
      if (filtros.fecha_hasta) whereCondition.fecha_hora.lte = new Date(filtros.fecha_hasta);
    }
    
    const [citas, total] = await Promise.all([
      prisma.citas.findMany({
        where: whereCondition,
        include: {
          paciente: { select: { nombre: true, apellido: true, telefono: true } },
          doctor: { select: { nombre: true, apellido: true } }
        },
        orderBy: { fecha_hora: 'desc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
      prisma.citas.count({ where: whereCondition })
    ]);
    
    res.json({
      success: true,
      data: citas,
      pagination: {
        page: filtros.page,
        limit: filtros.limit,
        total,
        totalPages: Math.ceil(total / filtros.limit)
      }
    });
  })
];