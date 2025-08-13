import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import { 
  createPrecioConsultorioSchema,
  updatePrecioConsultorioSchema,
  precioConsultorioIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllPreciosConsultorio = asyncHandler(async (req: Request, res: Response) => {
    const precios = await prisma.precioConsultorio.findMany();
    res.json(precios);
});

export const getPrecioConsultorioById = [
    validateParams(precioConsultorioIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        
        const precio = await prisma.precioConsultorio.findUnique({ 
            where: { id } 
        });
        
        if (!precio) {
            throw createNotFoundError('PrecioConsultorio no encontrado');
        }
        
        res.json(precio);
    })
];

export const createPrecioConsultorio = [
    validateBody(createPrecioConsultorioSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { consultorio_id, concepto, precio } = getValidatedBody(req);
        
        const nuevoPrecio = await prisma.precioConsultorio.create({
            data: {
                consultorio_id,
                concepto,
                precio,
            },
        });
        
        res.status(200).json(nuevoPrecio);
    })
];

export const updatePrecioConsultorio = [
    validateParams(precioConsultorioIdSchema),
    validateBody(updatePrecioConsultorioSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        const { consultorio_id, concepto, precio } = getValidatedBody(req);
        
        const data: any = {};
        if (consultorio_id !== undefined) data.consultorio_id = consultorio_id;
        if (concepto !== undefined) data.concepto = concepto;
        if (precio !== undefined) data.precio = precio;
        
        if (Object.keys(data).length === 0) {
            throw createNotFoundError('No se enviaron campos para actualizar');
        }
        
        const precioActualizado = await prisma.precioConsultorio.update({
            where: { id },
            data,
        });
        
        res.status(200).json(precioActualizado);
    })
];

export const deletePrecioConsultorio = [
    validateParams(precioConsultorioIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        
        await prisma.precioConsultorio.delete({ where: { id } });
        
        res.status(200).json({ message: 'PrecioConsultorio eliminado' });
    })
]; 