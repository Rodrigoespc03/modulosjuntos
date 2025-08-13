import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  createServicioSchema, 
  updateServicioSchema, 
  servicioIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllServicios = asyncHandler(async (req: Request, res: Response) => {
  const servicios = await prisma.servicio.findMany();
  res.json(servicios);
});

export const getServicioById = [
  validateParams(servicioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const servicio = await prisma.servicio.findUnique({ where: { id } });
    
    if (!servicio) {
      throw createNotFoundError('Servicio no encontrado');
    }
    
    res.json(servicio);
  })
];

export const createServicio = [
  validateBody(createServicioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = getValidatedBody(req);
    const organizacion_id = (req as any).user?.organizacion_id;

    if (!organizacion_id) {
      throw createNotFoundError('Usuario no tiene organización asignada');
    }

    const servicio = await prisma.servicio.create({ 
      data: { 
        ...validatedData,
        organizaciones: {
          connect: { id: organizacion_id }
        }
      } 
    });
    res.status(201).json(servicio);
  })
];

export const updateServicio = [
  validateParams(servicioIdSchema),
  validateBody(updateServicioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);

    // Verificar que el servicio existe
    const existingServicio = await prisma.servicio.findUnique({
      where: { id }
    });

    if (!existingServicio) {
      throw createNotFoundError('Servicio no encontrado');
    }

    const servicio = await prisma.servicio.update({ 
      where: { id }, 
      data: validatedData 
    });
    res.json(servicio);
  })
];

export const deleteServicio = [
  validateParams(servicioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);

    // Verificar que el servicio existe
    const servicio = await prisma.servicio.findUnique({
      where: { id }
    });

    if (!servicio) {
      throw createNotFoundError('Servicio no encontrado');
    }

    await prisma.servicio.delete({ where: { id } });
    res.status(204).send();
  })
]; 