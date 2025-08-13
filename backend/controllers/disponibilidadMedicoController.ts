import { Request, Response } from 'express'
import prisma from '../prisma'
import asyncHandler from '../utils/asyncHandler';
import { z } from 'zod';
import { 
  createDisponibilidadMedicoSchema,
  updateDisponibilidadMedicoSchema,
  disponibilidadMedicoIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, validateQuery, getValidatedBody, getValidatedParams, getValidatedQuery } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

export const getDisponibilidadesMedico = [
  validateQuery(z.object({
    usuario_id: z.string().uuid().optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { usuario_id } = getValidatedQuery(req);
    const where = usuario_id ? { usuario_id } : {};
    const disponibilidades = await prisma.disponibilidad_medico.findMany({ where });
    res.json(disponibilidades);
  })
];

export const createDisponibilidadMedico = [
  validateBody(createDisponibilidadMedicoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { usuario_id, dia_semana, hora_inicio, hora_fin } = getValidatedBody(req);
    
    // Validar duplicados
    const existing = await prisma.disponibilidad_medico.findFirst({
      where: {
        usuario_id,
        dia_semana,
        hora_inicio,
        hora_fin
      }
    });
    
    if (existing) {
      throw createConflictError('Ya existe una disponibilidad con ese día y horario para este médico');
    }
    
    const disponibilidad = await prisma.disponibilidad_medico.create({
      data: { usuario_id, dia_semana, hora_inicio, hora_fin }
    });
    
    res.status(201).json(disponibilidad);
  })
];

export const updateDisponibilidadMedico = [
  validateParams(disponibilidadMedicoIdSchema),
  validateBody(updateDisponibilidadMedicoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const { dia_semana, hora_inicio, hora_fin } = getValidatedBody(req);
    
    // Validar duplicados (excluyendo el propio)
    const existing = await prisma.disponibilidad_medico.findFirst({
      where: {
        id: { not: id },
        dia_semana,
        hora_inicio,
        hora_fin
      }
    });
    
    if (existing) {
      throw createConflictError('Ya existe una disponibilidad con ese día y horario para este médico');
    }
    
    const disponibilidad = await prisma.disponibilidad_medico.update({
      where: { id },
      data: { dia_semana, hora_inicio, hora_fin }
    });
    
    res.json(disponibilidad);
  })
];

export const deleteDisponibilidadMedico = [
  validateParams(disponibilidadMedicoIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    await prisma.disponibilidad_medico.delete({ where: { id } });
    res.status(204).end();
  })
]; 