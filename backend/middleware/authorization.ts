import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Rol } from '@prisma/client';

const prisma = new PrismaClient();

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware para verificar si el usuario tiene un rol específico
export const requireRole = (roles: Rol[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const user = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: { consultorio: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      if (!roles.includes(user.rol)) {
        return res.status(403).json({ 
          error: 'Acceso denegado. No tienes permisos para realizar esta acción.' 
        });
      }

      // Agregar información del usuario a la request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error en middleware de autorización:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar permisos específicos
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const user = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: { 
          consultorio: {
            include: {
              configuracion_permisos: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      // Los doctores tienen acceso total
      if (user.rol === 'DOCTOR') {
        req.user = user;
        return next();
      }

      // Verificar permisos específicos según el rol
      let hasPermission = false;

      switch (permission) {
        case 'editar_cobros':
          hasPermission = user.puede_editar_cobros;
          break;
        case 'eliminar_cobros':
          hasPermission = user.puede_eliminar_cobros;
          break;
        case 'ver_historial':
          hasPermission = user.puede_ver_historial;
          break;
        case 'gestionar_usuarios':
          hasPermission = user.puede_gestionar_usuarios;
          break;
        case 'entradas_inventario':
          if (user.rol === 'ENFERMERA') {
            hasPermission = user.consultorio?.configuracion_permisos?.enfermera_entradas_inventario ?? true;
          } else if (user.rol === 'SECRETARIA') {
            hasPermission = user.consultorio?.configuracion_permisos?.secretaria_entradas_inventario ?? true;
          }
          break;
        case 'salidas_inventario':
          if (user.rol === 'ENFERMERA') {
            hasPermission = user.consultorio?.configuracion_permisos?.enfermera_salidas_inventario ?? true;
          } else if (user.rol === 'SECRETARIA') {
            hasPermission = user.consultorio?.configuracion_permisos?.secretaria_salidas_inventario ?? false;
          }
          break;
        default:
          hasPermission = false;
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Acceso denegado. No tienes permisos para realizar esta acción.' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar acceso a datos del consultorio
export const requireConsultorioAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const user = await prisma.usuario.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      // Los doctores pueden acceder a todos los datos de su consultorio
      if (user.rol === 'DOCTOR') {
        req.user = user;
        return next();
      }

      // Para otros roles, verificar que estén accediendo a datos de su consultorio
      const consultorioId = req.params.consultorioId || req.body.consultorio_id || req.query.consultorio_id;
      
      if (consultorioId && consultorioId !== user.consultorio_id) {
        return res.status(403).json({ 
          error: 'Acceso denegado. Solo puedes acceder a datos de tu consultorio.' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error en middleware de acceso al consultorio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

export default {
  requireRole,
  requirePermission,
  requireConsultorioAccess
}; 
 
 