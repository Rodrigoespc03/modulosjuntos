import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  createPacienteSchema, 
  updatePacienteSchema, 
  pacienteIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllPacientes = asyncHandler(async (req: Request, res: Response) => {
  // Aplicar filtro multi-tenant si está disponible
  const tenantFilter = (req as any).tenantFilter;
  
  const pacientes = await prisma.paciente.findMany({
    where: tenantFilter ? {
      organizacion_id: tenantFilter.organizacion_id
    } : {},
  });
  res.json(pacientes);
});

export const getPacienteById = [
  validateParams(pacienteIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const paciente = await prisma.paciente.findUnique({ where: { id } });
    
    if (!paciente) {
      throw createNotFoundError('Paciente no encontrado');
    }
    
    res.json(paciente);
  })
];

export const createPaciente = [
  validateBody(createPacienteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = getValidatedBody(req);
    const organizacion_id = (req as any).user?.organizacion_id;
    
    if (!organizacion_id) {
      throw createNotFoundError('Usuario no tiene organización asignada');
    }

    // Verificar duplicados por email
    const existing = await prisma.paciente.findFirst({
      where: {
        email: validatedData.email,
        organizacion_id: organizacion_id
      }
    });
    
    if (existing) {
      throw createConflictError('Ya existe un paciente con ese email');
    }

    const paciente = await prisma.paciente.create({
      data: {
        ...validatedData,
        fecha_nacimiento: new Date(validatedData.fecha_nacimiento),
        organizacion_id,
      },
    });

    res.status(201).json(paciente);
  })
];

export const updatePaciente = [
  validateParams(pacienteIdSchema),
  validateBody(updatePacienteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const organizacion_id = (req as any).user?.organizacion_id;

    // Verificar que el paciente existe
    const existingPaciente = await prisma.paciente.findUnique({
      where: { id }
    });

    if (!existingPaciente) {
      throw createNotFoundError('Paciente no encontrado');
    }

    // Si se está actualizando el email, verificar que no esté duplicado
    if (validatedData.email && validatedData.email !== existingPaciente.email) {
      const emailExists = await prisma.paciente.findFirst({
        where: {
          email: validatedData.email,
          organizacion_id: organizacion_id,
          id: { not: id }
        }
      });

      if (emailExists) {
        throw createConflictError('Ya existe un paciente con ese email');
      }
    }

    // Preparar datos para actualización
    const updateData: any = { ...validatedData };
    if (validatedData.fecha_nacimiento) {
      updateData.fecha_nacimiento = new Date(validatedData.fecha_nacimiento);
    }

    const paciente = await prisma.paciente.update({
      where: { id },
      data: updateData,
    });

    res.json(paciente);
  })
];

export const deletePaciente = [
  validateParams(pacienteIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id }
    });

    if (!paciente) {
      throw createNotFoundError('Paciente no encontrado');
    }

    await prisma.paciente.delete({
      where: { id }
    });

    res.status(204).send();
  })
];

export const searchPacientes = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;
  const organizacion_id = (req as any).user?.organizacion_id;

  if (!organizacion_id) {
    throw createNotFoundError('Usuario no tiene organización asignada');
  }

  const whereClause: any = {
    organizacion_id: organizacion_id
  };

  if (search) {
    whereClause.OR = [
      { nombre: { contains: search as string, mode: 'insensitive' } },
      { apellido: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { telefono: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const pacientes = await prisma.paciente.findMany({
    where: whereClause,
    orderBy: { nombre: 'asc' }
  });

  res.json(pacientes);
});

export const getPacientesByConsultorio = [
  validateParams(pacienteIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: consultorioId } = getValidatedParams(req);

    // Verificar que el consultorio existe
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: consultorioId }
    });

    if (!consultorio) {
      throw createNotFoundError('Consultorio no encontrado');
    }

    // Obtener pacientes que han tenido citas en este consultorio
    const pacientes = await prisma.paciente.findMany({
      where: {
        citas: {
          some: {
            consultorio_id: consultorioId
          }
        }
      },
      include: {
        citas: {
          where: {
            consultorio_id: consultorioId
          },
          orderBy: {
            fecha_inicio: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json(pacientes);
  })
]; 