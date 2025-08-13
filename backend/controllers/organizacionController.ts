import { Request, Response } from 'express';
import prisma from '../prisma';
import asyncHandler from '../utils/asyncHandler';
import { 
  createOrganizacionSchema,
  updateOrganizacionSchema,
  organizacionIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

export const getAllOrganizaciones = asyncHandler(async (req: Request, res: Response) => {
  const organizaciones = await prisma.organizaciones.findMany({
    include: {
      _count: {
        select: {
          usuarios: true,
          consultorios: true,
          pacientes: true,
          servicios: true
        }
      }
    }
  });
  res.json(organizaciones);
});

export const getOrganizacionById = [
  validateParams(organizacionIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    
    const organizacion = await prisma.organizaciones.findUnique({
      where: { id },
      include: {
        usuarios: {
          include: { consultorio: true }
        },
        consultorios: true,
        servicios: true,
        pacientes: {
          take: 10,
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: {
            usuarios: true,
            consultorios: true,
            pacientes: true,
            servicios: true
          }
        }
      }
    });
    
    if (!organizacion) {
      throw createNotFoundError('Organización no encontrada');
    }
    
    res.json(organizacion);
  })
];

export const createOrganizacion = [
  validateBody(createOrganizacionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { nombre, ruc, direccion, telefono, email, logo_url, color_primario, color_secundario } = getValidatedBody(req);
    
    const organizacion = await prisma.organizaciones.create({
      data: {
        nombre,
        ruc,
        direccion,
        telefono,
        email,
        logo_url,
        color_primario: color_primario || '#3B82F6',
        color_secundario: color_secundario || '#1F2937'
      }
    });
    
    res.json(organizacion);
  })
];

export const updateOrganizacion = [
  validateParams(organizacionIdSchema),
  validateBody(updateOrganizacionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const { nombre, ruc, direccion, telefono, email, logo_url, color_primario, color_secundario } = getValidatedBody(req);
    
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (ruc !== undefined) updateData.ruc = ruc;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (email !== undefined) updateData.email = email;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (color_primario) updateData.color_primario = color_primario;
    if (color_secundario) updateData.color_secundario = color_secundario;
    
    const organizacion = await prisma.organizaciones.update({
      where: { id },
      data: updateData
    });
    
    res.json(organizacion);
  })
];

export const deleteOrganizacion = [
  validateParams(organizacionIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    
    // Verificar que no tenga datos asociados
    const counts = await prisma.$transaction([
      prisma.usuario.count({ where: { organizacion_id: id } }),
      prisma.consultorio.count({ where: { organizacion_id: id } }),
      prisma.paciente.count({ where: { organizacion_id: id } }),
      prisma.servicio.count({ where: { organizacion_id: id } })
    ]);
    
    const [usuarios, consultorios, pacientes, servicios] = counts;
    
    if (usuarios > 0 || consultorios > 0 || pacientes > 0 || servicios > 0) {
      throw createConflictError('No se puede eliminar la organización porque tiene datos asociados');
    }
    
    await prisma.organizaciones.delete({ where: { id } });
    res.json({ message: 'Organización eliminada' });
  })
];

export const getOrganizacionStats = [
  validateParams(organizacionIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    
    const stats = await prisma.$transaction([
      prisma.usuario.count({ where: { organizacion_id: id } }),
      prisma.consultorio.count({ where: { organizacion_id: id } }),
      prisma.paciente.count({ where: { organizacion_id: id } }),
      prisma.servicio.count({ where: { organizacion_id: id } }),
      prisma.cobro.count({ 
        where: { 
          usuario: { organizacion_id: id } 
        } 
      }),
      prisma.citas.count({ 
        where: { 
          usuario: { organizacion_id: id } 
        } 
      })
    ]);
    
    const [usuarios, consultorios, pacientes, servicios, cobros, citas] = stats;
    
    res.json({
      usuarios,
      consultorios,
      pacientes,
      servicios,
      cobros,
      citas
    });
  })
]; 
 
 
 