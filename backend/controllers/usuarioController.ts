import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler';
import PermisosService from '../services/permisosService';
import { 
  createUsuarioSchema, 
  updateUsuarioSchema, 
  usuarioIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getAllUsuarios = asyncHandler(async (req: Request, res: Response) => {
  // Aplicar filtro multi-tenant si está disponible
  const tenantFilter = (req as any).tenantFilter;
  
  const usuarios = await prisma.usuario.findMany({
    where: tenantFilter ? {
      organizacion_id: tenantFilter.organizacion_id
    } : {},
    include: { consultorio: true }
  });
  res.json(usuarios);
});

export const getUsuarioById = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const usuario = await prisma.usuario.findUnique({ 
      where: { id },
      include: { consultorio: true }
    });
    
    if (!usuario) {
      throw createNotFoundError('Usuario no encontrado');
    }
    
    res.json(usuario);
  })
];

export const createUsuario = [
  validateBody(createUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = getValidatedBody(req);
    const organizacion_id = (req as any).user?.organizacion_id;

    if (!organizacion_id) {
      throw createNotFoundError('Usuario no tiene organización asignada');
    }

    // Verificar que el consultorio existe
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: validatedData.consultorio_id }
    });

    if (!consultorio) {
      throw createNotFoundError('El consultorio especificado no existe');
    }

    // Verificar que la organización existe
    const organizacion = await prisma.organizaciones.findUnique({
      where: { id: organizacion_id }
    });

    if (!organizacion) {
      throw createNotFoundError('La organización especificada no existe');
    }

    // Verificar que el email no esté duplicado
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: validatedData.email,
        organizacion_id: organizacion_id
      }
    });

    if (existingUser) {
      throw createConflictError('Ya existe un usuario con ese email en esta organización');
    }

    const usuario = await prisma.usuario.create({
      data: {
        ...validatedData,
        organizacion_id,
      },
      include: {
        consultorio: true,
        organizaciones: true
      }
    });

    // Aplicar permisos por defecto según el rol
    await PermisosService.aplicarPermisosPorDefecto(usuario.id, validatedData.rol);

    res.status(201).json(usuario);
  })
];

export const updateUsuario = [
  validateParams(usuarioIdSchema),
  validateBody(updateUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const organizacion_id = (req as any).user?.organizacion_id;

    // Verificar que el usuario existe
    const existingUsuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUsuario) {
      throw createNotFoundError('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no esté duplicado
    if (validatedData.email && validatedData.email !== existingUsuario.email) {
      const emailExists = await prisma.usuario.findFirst({
        where: {
          email: validatedData.email,
          organizacion_id: organizacion_id,
          id: { not: id }
        }
      });

      if (emailExists) {
        throw createConflictError('Ya existe un usuario con ese email en esta organización');
      }
    }

    // Si se está actualizando el consultorio, verificar que existe
    if (validatedData.consultorio_id) {
      const consultorio = await prisma.consultorio.findUnique({
        where: { id: validatedData.consultorio_id }
      });

      if (!consultorio) {
        throw createNotFoundError('El consultorio especificado no existe');
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: validatedData,
      include: {
        consultorio: true,
        organizaciones: true
      }
    });

    res.json(usuario);
  })
];

export const deleteUsuario = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw createNotFoundError('Usuario no encontrado');
    }

    await prisma.usuario.delete({
      where: { id }
    });

    res.status(204).send();
  })
];

export const getUsuariosByConsultorio = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: consultorioId } = getValidatedParams(req);

    // Verificar que el consultorio existe
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: consultorioId }
    });

    if (!consultorio) {
      throw createNotFoundError('Consultorio no encontrado');
    }

    const usuarios = await prisma.usuario.findMany({
      where: { consultorio_id: consultorioId },
      include: { consultorio: true }
    });

    res.json(usuarios);
  })
]; 