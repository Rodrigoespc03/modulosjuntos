import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  createHistorialCobroSchema,
  updateHistorialCobroSchema,
  historialCobroIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllHistorialCobros = asyncHandler(async (req: Request, res: Response) => {
    const historial = await prisma.historialCobro.findMany({
        include: {
            cobro: true,
            usuario: true,
        },
    });
    res.json(historial);
});

export const getHistorialCobroById = [
    validateParams(historialCobroIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        
        const registro = await prisma.historialCobro.findUnique({
            where: { id },
            include: {
                cobro: true,
                usuario: true,
            },
        });
        
        if (!registro) {
            throw createNotFoundError('Registro de historial no encontrado');
        }
        
        res.json(registro);
    })
];

export const createHistorialCobro = [
    validateBody(createHistorialCobroSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { cobro_id, usuario_id, tipo_cambio, detalles_antes, detalles_despues } = getValidatedBody(req);
        
        // Verificar que el cobro existe
        const cobro = await prisma.cobro.findUnique({ where: { id: cobro_id } });
        if (!cobro) {
            throw createNotFoundError('El cobro especificado no existe');
        }
        
        // Verificar que el usuario existe
        const usuario = await prisma.usuario.findUnique({ where: { id: usuario_id } });
        if (!usuario) {
            throw createNotFoundError('El usuario especificado no existe');
        }
        
        const registro = await prisma.historialCobro.create({
            data: {
                cobro_id,
                usuario_id,
                tipo_cambio,
                detalles_antes: detalles_antes || {},
                detalles_despues,
            },
        });
        
        res.status(200).json(registro);
    })
];

export const updateHistorialCobro = [
    validateParams(historialCobroIdSchema),
    validateBody(updateHistorialCobroSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        const { cobro_id, usuario_id, tipo_cambio, detalles_antes, detalles_despues } = getValidatedBody(req);
        
        const updateData: any = {};
        
        if (cobro_id) {
            const cobro = await prisma.cobro.findUnique({ where: { id: cobro_id } });
            if (!cobro) {
                throw createNotFoundError('El cobro especificado no existe');
            }
            updateData.cobro_id = cobro_id;
        }
        
        if (usuario_id) {
            const usuario = await prisma.usuario.findUnique({ where: { id: usuario_id } });
            if (!usuario) {
                throw createNotFoundError('El usuario especificado no existe');
            }
            updateData.usuario_id = usuario_id;
        }
        
        if (tipo_cambio) {
            updateData.tipo_cambio = tipo_cambio;
        }
        
        if (detalles_antes !== undefined) {
            updateData.detalles_antes = detalles_antes;
        }
        
        if (detalles_despues !== undefined) {
            updateData.detalles_despues = detalles_despues;
        }
        
        const registro = await prisma.historialCobro.update({
            where: { id },
            data: updateData,
        });
        
        res.status(200).json(registro);
    })
];

export const deleteHistorialCobro = [
    validateParams(historialCobroIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        
        await prisma.historialCobro.delete({ where: { id } });
        
        res.status(200).json({ message: 'HistorialCobro eliminado' });
    })
]; 