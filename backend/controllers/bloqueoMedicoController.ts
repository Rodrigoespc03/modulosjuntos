import { Request, Response } from 'express'
import prisma from '../prisma'
import asyncHandler from '../utils/asyncHandler';
import { z } from 'zod';
import { 
  createBloqueoMedicoSchema,
  updateBloqueoMedicoSchema,
  bloqueoMedicoIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, validateQuery, getValidatedBody, getValidatedParams, getValidatedQuery } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

export const getBloqueosMedico = [
  validateQuery(z.object({
    usuario_id: z.string().uuid().optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { usuario_id } = getValidatedQuery(req);
    const where = usuario_id ? { usuario_id } : {};
    const bloqueos = await prisma.bloqueo_medico.findMany({ where });
    res.json(bloqueos);
  })
];

export const createBloqueoMedico = [
  validateBody(createBloqueoMedicoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { usuario_id, fecha_inicio, fecha_fin, motivo } = getValidatedBody(req);
    
    const now = roundToMinute(new Date());
    const inicio = roundToMinute(new Date(fecha_inicio));
    
    console.log('DEBUG bloqueo:', {
      fecha_inicio,
      now: now.toISOString(),
      inicio: inicio.toISOString(),
      diffMs: inicio.getTime() - now.getTime(),
      nowLocal: new Date().toString(),
      inicioLocal: new Date(fecha_inicio).toString()
    });
    
    if (inicio <= now) {
      throw createConflictError('La fecha de inicio debe ser posterior a la actual');
    }
    
    // Parsear fechas a Date para evitar errores de Prisma
    const ini = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    
    // Validar solapamiento
    const overlapping = await prisma.bloqueo_medico.findFirst({
      where: {
        usuario_id,
        OR: [
          {
            fecha_inicio: { lte: fin },
            fecha_fin: { gte: ini }
          }
        ]
      }
    });
    
    if (overlapping) {
      throw createConflictError('Ya existe un bloqueo que se solapa con este periodo');
    }
    
    const bloqueo = await prisma.bloqueo_medico.create({
      data: { usuario_id, fecha_inicio: ini, fecha_fin: fin, motivo }
    });
    
    res.status(201).json(bloqueo);
  })
];

export const updateBloqueoMedico = [
  validateParams(bloqueoMedicoIdSchema),
  validateBody(updateBloqueoMedicoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const { fecha_inicio, fecha_fin, motivo } = getValidatedBody(req);
    
    if (new Date(fecha_inicio) < new Date()) {
      throw createConflictError('No puedes poner bloqueos en el pasado');
    }
    
    // Validar solapamiento (excluyendo el propio)
    const existing = await prisma.bloqueo_medico.findFirst({
      where: {
        id: { not: id },
        OR: [
          {
            fecha_inicio: { lte: fecha_fin },
            fecha_fin: { gte: fecha_inicio }
          }
        ]
      }
    });
    
    if (existing) {
      throw createConflictError('Ya existe un bloqueo que se solapa con este periodo');
    }
    
    const bloqueo = await prisma.bloqueo_medico.update({
      where: { id },
      data: { fecha_inicio, fecha_fin, motivo }
    });
    
    res.json(bloqueo);
  })
];

export const deleteBloqueoMedico = [
  validateParams(bloqueoMedicoIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    await prisma.bloqueo_medico.delete({ where: { id } });
    res.status(204).end();
  })
];

function roundToMinute(date: Date): Date {
  date.setSeconds(0, 0);
  return date;
} 