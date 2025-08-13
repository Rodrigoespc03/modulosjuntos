import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  createCobroConceptoSchema,
  updateCobroConceptoSchema,
  cobroConceptoIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllCobroConceptos = asyncHandler(async (req: Request, res: Response) => {
    const conceptos = await prisma.cobroConcepto.findMany({
        include: {
            cobro: true,
            consultorio: true,
        },
    });
    res.json(conceptos);
});

export const getCobroConceptoById = [
    validateParams(cobroConceptoIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        
        const concepto = await prisma.cobroConcepto.findUnique({
            where: { id },
            include: {
                cobro: true,
                consultorio: true,
            },
        });
        
        if (!concepto) {
            throw createNotFoundError('CobroConcepto no encontrado');
        }
        
        res.json(concepto);
    })
];

export const createCobroConcepto = [
    validateBody(createCobroConceptoSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const validatedData = getValidatedBody(req);
        const { cobro_id, servicio_id, precio_unitario, cantidad, subtotal, consultorio_id } = validatedData;
        
        // Verificar que el cobro existe
        const cobro = await prisma.cobro.findUnique({ where: { id: cobro_id } });
        if (!cobro) {
            throw createNotFoundError('El cobro especificado no existe');
        }
        
        // Verificar que el consultorio existe
        const consultorio = await prisma.consultorio.findUnique({ where: { id: consultorio_id } });
        if (!consultorio) {
            throw createNotFoundError('El consultorio especificado no existe');
        }
        
        // Verificar que el servicio existe
        const servicio = await prisma.servicio.findUnique({ where: { id: servicio_id } });
        if (!servicio) {
            throw createNotFoundError('El servicio especificado no existe');
        }
        
        const concepto = await prisma.cobroConcepto.create({
            data: {
                cobro_id,
                servicio_id,
                precio_unitario: parseFloat(precio_unitario),
                cantidad: parseInt(cantidad),
                subtotal: parseFloat(subtotal),
                consultorio_id,
            },
        });
        
        res.status(200).json(concepto);
    })
];

export const updateCobroConcepto = [
    validateParams(cobroConceptoIdSchema),
    validateBody(updateCobroConceptoSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        const validatedData = getValidatedBody(req);
        const { cobro_id, servicio_id, precio_unitario, cantidad, subtotal, consultorio_id } = validatedData;
        
        const updateData: any = {};
        
        if (cobro_id) {
            const cobro = await prisma.cobro.findUnique({ where: { id: cobro_id } });
            if (!cobro) {
                throw createNotFoundError('El cobro especificado no existe');
            }
            updateData.cobro_id = cobro_id;
        }
        
        if (servicio_id) {
            const servicio = await prisma.servicio.findUnique({ where: { id: servicio_id } });
            if (!servicio) {
                throw createNotFoundError('El servicio especificado no existe');
            }
            updateData.servicio_id = servicio_id;
        }
        
        if (precio_unitario) {
            updateData.precio_unitario = parseFloat(precio_unitario);
        }
        
        if (cantidad) {
            updateData.cantidad = parseInt(cantidad);
        }
        
        if (subtotal) {
            updateData.subtotal = parseFloat(subtotal);
        }
        
        if (consultorio_id) {
            const consultorio = await prisma.consultorio.findUnique({ where: { id: consultorio_id } });
            if (!consultorio) {
                throw createNotFoundError('El consultorio especificado no existe');
            }
            updateData.consultorio_id = consultorio_id;
        }
        
        const concepto = await prisma.cobroConcepto.update({
            where: { id },
            data: updateData,
        });
        
        res.json(concepto);
    })
];

export const deleteCobroConcepto = [
    validateParams(cobroConceptoIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        
        await prisma.cobroConcepto.delete({ where: { id } });
        
        res.json({ message: 'CobroConcepto eliminado' });
    })
]; 