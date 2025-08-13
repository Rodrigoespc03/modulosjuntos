import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  registerOrganizationSchema,
  completeOnboardingStepSchema,
  inviteUsersSchema,
  organizacionIdSchema,
  stepIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface OrganizationRegistrationData {
  // Datos de la clínica
  nombre: string;
  ruc: string;
  email: string;
  telefono: string;
  ciudad: string;
  
  // Datos del administrador
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Configuración
  tipoClinica: string;
  numMedicos: string;
  modulos: string[];
  plan: string;
}

export const registerOrganization = [
  validateBody(registerOrganizationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data: OrganizationRegistrationData = getValidatedBody(req);

    // Verificar si ya existe una organización con ese RUC
    const existingOrg = await prisma.organizaciones.findFirst({
      where: { ruc: data.ruc }
    });

    if (existingOrg) {
      throw createConflictError('Ya existe una organización registrada con ese RUC');
    }

    // Verificar si ya existe un usuario con ese email
    const existingUser = await prisma.usuario.findFirst({
      where: { email: data.adminEmail }
    });

    if (existingUser) {
      throw createConflictError('Ya existe un usuario registrado con ese email');
    }

    // Crear la organización
    const organizacion = await prisma.organizaciones.create({
      data: {
        nombre: data.nombre,
        ruc: data.ruc,
        email: data.email,
        telefono: data.telefono,
        direccion: data.ciudad,
        color_primario: '#3B82F6', // Color por defecto
        color_secundario: '#1F2937' // Color por defecto
      }
    });

    // Generar token temporal (sin contraseña por ahora)
    const tempToken = Math.random().toString(36).slice(-8);

    // Crear un consultorio por defecto primero
    const consultorio = await prisma.consultorio.create({
      data: {
        nombre: 'Consultorio Principal',
        direccion: data.ciudad,
        organizacion_id: organizacion.id
      }
    });

    // Crear el usuario administrador con el consultorio_id correcto
    const adminUser = await prisma.usuario.create({
      data: {
        nombre: data.adminNombre,
        email: data.adminEmail,
        telefono: data.telefono,
        rol: 'DOCTOR',
        apellido: 'Administrador',
        consultorio_id: consultorio.id,
        organizacion_id: organizacion.id,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true
      }
    });

    // Crear conceptos de cobro básicos si el módulo de cobros está activo
    if (data.modulos && data.modulos.includes('cobros')) {
      // Por ahora, solo creamos el consultorio. Los conceptos se crearán cuando se haga el primer cobro
      console.log('Módulo de cobros activado para la organización:', organizacion.id);
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        email: adminUser.email, 
        rol: adminUser.rol,
        organizacionId: organizacion.id 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Organización registrada exitosamente',
      data: {
        organizacion: {
          id: organizacion.id,
          nombre: organizacion.nombre,
          ruc: organizacion.ruc,
          email: organizacion.email
        },
        usuario: {
          id: adminUser.id,
          nombre: adminUser.nombre,
          email: adminUser.email,
          rol: adminUser.rol
        },
        token,
        onboarding: true
      }
    });
  })
];

// Obtener progreso del onboarding
export const getOnboardingProgress = [
  validateParams(organizacionIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { organizacionId } = getValidatedParams(req);

    const organizacion = await prisma.organizaciones.findUnique({
      where: { id: organizacionId },
      include: {
        usuarios: true,
        consultorios: true
      }
    });

    if (!organizacion) {
      throw createNotFoundError('Organización no encontrada');
    }

    // Calcular progreso basado en la configuración
    const steps = [
      { id: 1, name: 'Registro', completed: true },
      { id: 2, name: 'Perfil', completed: !!organizacion.color_primario },
      { id: 3, name: 'Usuarios', completed: organizacion.usuarios.length > 1 },
      { id: 4, name: 'Configuración', completed: organizacion.consultorios.length > 0 },
      { id: 5, name: 'Primer Uso', completed: false } // Se completará cuando usen el sistema
    ];

    const progress = {
      totalSteps: steps.length,
      completedSteps: steps.filter(step => step.completed).length,
      steps
    };

    res.json({
      success: true,
      data: progress
    });
  })
];

// Completar paso del onboarding
export const completeOnboardingStep = [
  validateParams(organizacionIdSchema.merge(stepIdSchema)),
  validateBody(completeOnboardingStepSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { organizacionId, stepId } = getValidatedParams(req);
    const stepData = getValidatedBody(req);

    let updateData: any = {};

    // Actualizar según el paso completado
    switch (stepId) {
      case '2': // Perfil
        updateData = {
          color_primario: stepData.primaryColor,
          color_secundario: stepData.secondaryColor,
          horarios_atencion: stepData.horarios
        };
        break;
      
      case '3': // Usuarios
        // Los usuarios se manejan por separado
        break;
      
      case '4': // Configuración
        updateData = {
          modulos_activos: stepData.modulos
        };
        break;
      
      case '5': // Primer uso
        updateData = {
          onboarding_completado: true
        };
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.organizaciones.update({
        where: { id: organizacionId },
        data: updateData
      });
    }

    res.json({
      success: true,
      message: `Paso ${stepId} completado exitosamente`
    });
  })
];

// Invitar usuarios
export const inviteUsers = [
  validateParams(organizacionIdSchema),
  validateBody(inviteUsersSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { organizacionId } = getValidatedParams(req);
    const { usuarios } = getValidatedBody(req);

    const invitedUsers = [];

    for (const userData of usuarios) {
      // Generar contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8);

      const user = await prisma.usuario.create({
        data: {
          nombre: userData.nombre,
          email: userData.email,
          telefono: userData.telefono || '',
          rol: userData.rol,
          apellido: userData.apellido || '',
          consultorio_id: '', // Se asignará después
          organizacion_id: organizacionId
        }
      });

      invitedUsers.push({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        tempPassword
      });
    }

    res.json({
      success: true,
      message: 'Usuarios invitados exitosamente',
      data: invitedUsers
    });
  })
]; 