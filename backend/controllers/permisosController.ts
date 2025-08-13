import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { z } from 'zod';
import { 
  createUsuarioSchema,
  updateUsuarioSchema,
  usuarioIdSchema,
  createConfiguracionPermisosSchema,
  updateConfiguracionPermisosSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: any;
  organizacion?: any;
  tenantFilter?: any;
}

// Datos simulados para pruebas
const mockPermisos = {
  permisos: {
    puede_editar_cobros: true,
    puede_eliminar_cobros: true,
    puede_ver_historial: true,
    puede_gestionar_usuarios: true
  },
  modulosDisponibles: ['cobros', 'pacientes', 'citas', 'inventario', 'usuarios', 'historial'],
  rol: 'DOCTOR',
  organizacion: {
    id: 'org-123',
    nombre: 'Clínica ProCura',
    ruc: '12345678901',
    email: 'admin@procura.com',
    telefono: '+51 999 999 999',
    direccion: 'Av. Principal 123, Lima',
    color_primario: '#3B82F6',
    color_secundario: '#1F2937'
  }
};

// Obtener permisos del usuario actual
export const obtenerMisPermisos = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  console.log('🔍 Debug - obtenerMisPermisos llamado');
  console.log('🔍 Debug - Usuario del request:', req.user);
  
  // Si tenemos usuario del middleware, usar sus datos
  if (req.user) {
    const permisos = {
      permisos: {
        puede_editar_cobros: req.user.puede_editar_cobros || true,
        puede_eliminar_cobros: req.user.puede_eliminar_cobros || true,
        puede_ver_historial: req.user.puede_ver_historial || true,
        puede_gestionar_usuarios: req.user.puede_gestionar_usuarios || true
      },
      modulosDisponibles: ['cobros', 'pacientes', 'citas', 'inventario', 'usuarios', 'historial'],
      rol: req.user.rol || 'DOCTOR',
      organizacion: req.organizacion || mockPermisos.organizacion
    };
    
    console.log('🔍 Debug - Permisos devueltos:', permisos);
    res.json(permisos);
  } else {
    // Fallback a datos simulados
    console.log('🔍 Debug - Usando datos simulados');
    res.json(mockPermisos);
  }
});

// Verificar si el usuario tiene un permiso específico
export const verificarPermiso = [
  validateParams(z.object({
    permiso: z.string().min(1, 'El permiso es requerido')
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { permiso } = getValidatedParams(req);
    
    const tienePermiso = mockPermisos.permisos[permiso as keyof typeof mockPermisos.permisos] || false;
    
    res.json({ tienePermiso });
  })
];

// Obtener todos los usuarios del consultorio (solo doctores)
export const obtenerUsuariosConsultorio = asyncHandler(async (req: Request, res: Response) => {
  const mockUsuarios = [
    {
      id: 'user-1',
      nombre: 'Dr. Rodrigo',
      apellido: 'Espinosa',
      email: 'rodrigo@procura.com',
      telefono: '+51 999 999 999',
      rol: 'DOCTOR',
      puede_editar_cobros: true,
      puede_eliminar_cobros: true,
      puede_ver_historial: true,
      puede_gestionar_usuarios: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-2',
      nombre: 'María',
      apellido: 'García',
      email: 'maria@procura.com',
      telefono: '+51 888 888 888',
      rol: 'SECRETARIA',
      puede_editar_cobros: true,
      puede_eliminar_cobros: false,
      puede_ver_historial: false,
      puede_gestionar_usuarios: false,
      created_at: new Date().toISOString()
    }
  ];
  
  res.json(mockUsuarios);
});

// Crear nuevo usuario (solo doctores)
export const crearUsuario = [
  validateBody(createUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = getValidatedBody(req);
    const { nombre, apellido, email, telefono, rol } = validatedData;
    
    const nuevoUsuario = {
      id: `user-${Date.now()}`,
      nombre,
      apellido,
      email,
      telefono,
      rol,
      puede_editar_cobros: rol === 'DOCTOR',
      puede_eliminar_cobros: rol === 'DOCTOR',
      puede_ver_historial: rol === 'DOCTOR',
      puede_gestionar_usuarios: rol === 'DOCTOR',
      created_at: new Date().toISOString()
    };
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });
  })
];

// Actualizar usuario (solo doctores)
export const actualizarUsuario = [
  validateParams(usuarioIdSchema),
  validateBody(updateUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const { nombre, apellido, email, telefono, rol } = validatedData;
    
    const usuarioActualizado = {
      id,
      nombre: nombre || 'Dr. Rodrigo',
      apellido: apellido || 'Espinosa',
      email: email || 'rodrigo@procura.com',
      telefono: telefono || '+51 999 999 999',
      rol: rol || 'DOCTOR',
      puede_editar_cobros: true,
      puede_eliminar_cobros: true,
      puede_ver_historial: true,
      puede_gestionar_usuarios: true,
      created_at: new Date().toISOString()
    };
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  })
];

// Eliminar usuario (solo doctores)
export const eliminarUsuario = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    
    res.json({
      message: `Usuario ${id} eliminado exitosamente`
    });
  })
];

// Actualizar permisos de un usuario (solo doctores)
export const actualizarPermisosUsuario = [
  validateParams(usuarioIdSchema),
  validateBody(z.object({
    puede_editar_cobros: z.boolean().optional(),
    puede_eliminar_cobros: z.boolean().optional(),
    puede_ver_historial: z.boolean().optional(),
    puede_gestionar_usuarios: z.boolean().optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const permisos = getValidatedBody(req);
    
    const permisosActualizados = {
      puede_editar_cobros: permisos.puede_editar_cobros ?? true,
      puede_eliminar_cobros: permisos.puede_eliminar_cobros ?? true,
      puede_ver_historial: permisos.puede_ver_historial ?? true,
      puede_gestionar_usuarios: permisos.puede_gestionar_usuarios ?? true
    };
    
    res.json({
      message: 'Permisos actualizados exitosamente',
      permisos: permisosActualizados
    });
  })
];

// Obtener configuración de permisos del consultorio (solo doctores)
export const obtenerConfiguracionPermisos = asyncHandler(async (req: Request, res: Response) => {
  const configuracion = {
    secretaria_editar_cobros: true,
    secretaria_eliminar_cobros: false,
    enfermera_entradas_inventario: true,
    enfermera_salidas_inventario: true,
    secretaria_entradas_inventario: true,
    secretaria_salidas_inventario: false
  };
  
  res.json(configuracion);
});

// Actualizar configuración de permisos del consultorio (solo doctores)
export const actualizarConfiguracionPermisos = [
  validateBody(updateConfiguracionPermisosSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const configuracion = getValidatedBody(req);
    
    res.json({
      message: 'Configuración actualizada exitosamente',
      configuracion: {
        secretaria_editar_cobros: configuracion.secretaria_editar_cobros ?? true,
        secretaria_eliminar_cobros: configuracion.secretaria_eliminar_cobros ?? false,
        enfermera_entradas_inventario: configuracion.enfermera_entradas_inventario ?? true,
        enfermera_salidas_inventario: configuracion.enfermera_salidas_inventario ?? true,
        secretaria_entradas_inventario: configuracion.secretaria_entradas_inventario ?? true,
        secretaria_salidas_inventario: configuracion.secretaria_salidas_inventario ?? false
      }
    });
  })
]; 