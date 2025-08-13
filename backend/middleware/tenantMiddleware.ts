import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

interface AuthenticatedRequest extends Request {
  user?: any;
  organizacion?: any;
  tenantFilter?: any;
}

/**
 * Middleware para autenticar usuarios y obtener información de la organización
 * Adaptado para nuestro sistema de permisos
 */
export async function authenticateMultiTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  console.log("🔍 Debug - authenticateMultiTenant ejecutándose");
  console.log("🔍 Debug - URL:", req.url);
  console.log("🔍 Debug - Method:", req.method);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log("❌ Error - Token no proporcionado");
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log("🔍 Debug - Token extraído:", token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  
  const secret = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_2024';
  console.log('🔍 Debug - Secret usado:', secret.substring(0, 10) + '...');
  
  try {
    const decoded = jwt.verify(token, secret) as any;
    console.log('✅ Token decodificado exitosamente:', decoded);
    
    try {
      // Obtener usuario con información de la organización y permisos
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        include: { 
          consultorio: true
        }
      });
      
      if (!usuario) {
        return res.status(403).json({ error: 'Usuario no encontrado' });
      }
      
      if (!usuario.organizacion_id) {
        return res.status(403).json({ error: 'Usuario no tiene organización asignada' });
      }
      
      // Obtener información de la organización
      const organizacion = await prisma.organizaciones.findUnique({
        where: { id: usuario.organizacion_id }
      });
      
      if (!organizacion) {
        return res.status(403).json({ error: 'Organización no encontrada' });
      }
      
      // Agregar información al request
      req.user = usuario;
      req.organizacion = organizacion;
      req.tenantFilter = { organizacion_id: usuario.organizacion_id };
      
      console.log("🔍 Debug - tenantFilter establecido:", req.tenantFilter);
      console.log("🔍 Debug - organizacion_id:", usuario.organizacion_id);
      console.log("🔍 Debug - usuario completo:", {
        id: usuario.id,
        email: usuario.email,
        organizacion_id: usuario.organizacion_id
      });
      
      next();
    } catch (error) {
      console.error('Error en autenticación multi-tenant:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  } catch (error: any) {
    console.log('❌ Error verificando token:', error.message);
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware para rutas que no requieren autenticación pero sí filtrado por organización
 * (ej: webhooks, endpoints públicos)
 */
export function filterByOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const organizacionId = req.headers['x-organizacion-id'] as string;
  
  if (!organizacionId) {
    return res.status(400).json({ error: 'ID de organización requerido' });
  }
  
  req.tenantFilter = { organizacion_id: organizacionId };
  next();
}

/**
 * Middleware para verificar que el usuario pertenece a la organización correcta
 */
export function verifyOrganizationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.user;
  const organizacionId = req.params.organizacionId || req.body.organizacion_id;
  
  if (!user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (organizacionId && user.organizacion_id !== organizacionId) {
    return res.status(403).json({ error: 'Acceso denegado a esta organización' });
  }
  
  next();
}

/**
 * Función helper para aplicar filtros de tenant a consultas Prisma
 */
export function applyTenantFilter(baseWhere: any = {}, tenantFilter: any) {
  return {
    ...baseWhere,
    ...tenantFilter
  };
}

/**
 * Función helper para validar que un recurso pertenece a la organización del usuario
 */
export async function validateResourceOwnership(
  model: any, 
  resourceId: string, 
  organizacionId: string
): Promise<boolean> {
  const resource = await model.findFirst({
    where: {
      id: resourceId,
      organizacion_id: organizacionId
    }
  });
  
  return !!resource;
}

/**
 * Middleware para verificar permisos específicos del usuario
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    // Verificar permisos específicos
    switch (permission) {
      case 'editar_cobros':
        if (!user.puede_editar_cobros) {
          return res.status(403).json({ error: 'No tienes permisos para editar cobros' });
        }
        break;
      case 'eliminar_cobros':
        if (!user.puede_eliminar_cobros) {
          return res.status(403).json({ error: 'No tienes permisos para eliminar cobros' });
        }
        break;
      case 'ver_historial':
        if (!user.puede_ver_historial) {
          return res.status(403).json({ error: 'No tienes permisos para ver el historial' });
        }
        break;
      case 'gestionar_usuarios':
        if (!user.puede_gestionar_usuarios) {
          return res.status(403).json({ error: 'No tienes permisos para gestionar usuarios' });
        }
        break;
      default:
        return res.status(403).json({ error: 'Permiso no válido' });
    }
    
    next();
  };
} 


