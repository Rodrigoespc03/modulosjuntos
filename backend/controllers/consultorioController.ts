import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  createConsultorioSchema, 
  updateConsultorioSchema, 
  consultorioIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllConsultorios = asyncHandler(async (req: Request, res: Response) => {
  const consultorios = await prisma.consultorio.findMany();
  res.json(consultorios);
});

export const getConsultorioById = [
  validateParams(consultorioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const consultorio = await prisma.consultorio.findUnique({ where: { id } });
    
    if (!consultorio) {
      throw createNotFoundError('Consultorio no encontrado');
    }
    
    res.json(consultorio);
  })
];

export const createConsultorio = [
  validateBody(createConsultorioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = getValidatedBody(req);
    const organizacion_id = (req as any).user?.organizacion_id;

    if (!organizacion_id) {
      throw createNotFoundError('Usuario no tiene organización asignada');
    }

    const consultorio = await prisma.consultorio.create({
      data: { 
        ...validatedData,
        organizaciones: {
          connect: { id: organizacion_id }
        }
      },
    });
    res.json(consultorio);
  })
];

export const updateConsultorio = [
  validateParams(consultorioIdSchema),
  validateBody(updateConsultorioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);

    // Verificar que el consultorio existe
    const existingConsultorio = await prisma.consultorio.findUnique({
      where: { id }
    });

    if (!existingConsultorio) {
      throw createNotFoundError('Consultorio no encontrado');
    }

    const consultorio = await prisma.consultorio.update({
      where: { id },
      data: validatedData,
    });
    res.json(consultorio);
  })
];

export const deleteConsultorio = [
  validateParams(consultorioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);

    // Verificar que el consultorio existe
    const consultorio = await prisma.consultorio.findUnique({
      where: { id }
    });

    if (!consultorio) {
      throw createNotFoundError('Consultorio no encontrado');
    }

    await prisma.consultorio.delete({ where: { id } });
    res.status(204).send();
  })
]; 