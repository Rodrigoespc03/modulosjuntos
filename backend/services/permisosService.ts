import { PrismaClient } from '@prisma/client';
import { Rol } from '@prisma/client';

const prisma = new PrismaClient();

export interface PermisosUsuario {
  puede_editar_cobros: boolean;
  puede_eliminar_cobros: boolean;
  puede_ver_historial: boolean;
  puede_gestionar_usuarios: boolean;
}

export interface ConfiguracionPermisosConsultorio {
  secretaria_editar_cobros: boolean;
  secretaria_eliminar_cobros: boolean;
  enfermera_entradas_inventario: boolean;
  enfermera_salidas_inventario: boolean;
  secretaria_entradas_inventario: boolean;
  secretaria_salidas_inventario: boolean;
}

export class PermisosService {
  // Obtener permisos de un usuario
  static async obtenerPermisosUsuario(usuarioId: string): Promise<PermisosUsuario> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        rol: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true,
        consultorio: {
          include: {
            configuracion_permisos: true
          }
        }
      }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Los doctores tienen acceso total
    if (usuario.rol === 'DOCTOR') {
      return {
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true
      };
    }

    return {
      puede_editar_cobros: usuario.puede_editar_cobros,
      puede_eliminar_cobros: usuario.puede_eliminar_cobros,
      puede_ver_historial: usuario.puede_ver_historial,
      puede_gestionar_usuarios: usuario.puede_gestionar_usuarios
    };
  }

  // Actualizar permisos de un usuario
  static async actualizarPermisosUsuario(
    usuarioId: string, 
    permisos: Partial<PermisosUsuario>
  ): Promise<PermisosUsuario> {
    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: permisos,
      select: {
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true
      }
    });

    return usuario;
  }

  // Obtener configuración de permisos de un consultorio
  static async obtenerConfiguracionPermisos(consultorioId: string): Promise<ConfiguracionPermisosConsultorio> {
    let configuracion = await prisma.configuracionPermisos.findUnique({
      where: { consultorio_id: consultorioId }
    });

    // Si no existe configuración, crear una por defecto
    if (!configuracion) {
      configuracion = await prisma.configuracionPermisos.create({
        data: {
          consultorio_id: consultorioId,
          secretaria_editar_cobros: false,
          secretaria_eliminar_cobros: false,
          enfermera_entradas_inventario: true,
          enfermera_salidas_inventario: true,
          secretaria_entradas_inventario: true,
          secretaria_salidas_inventario: false
        }
      });
    }

    return {
      secretaria_editar_cobros: configuracion.secretaria_editar_cobros,
      secretaria_eliminar_cobros: configuracion.secretaria_eliminar_cobros,
      enfermera_entradas_inventario: configuracion.enfermera_entradas_inventario,
      enfermera_salidas_inventario: configuracion.enfermera_salidas_inventario,
      secretaria_entradas_inventario: configuracion.secretaria_entradas_inventario,
      secretaria_salidas_inventario: configuracion.secretaria_salidas_inventario
    };
  }

  // Actualizar configuración de permisos de un consultorio
  static async actualizarConfiguracionPermisos(
    consultorioId: string,
    configuracion: Partial<ConfiguracionPermisosConsultorio>
  ): Promise<ConfiguracionPermisosConsultorio> {
    const configuracionActualizada = await prisma.configuracionPermisos.upsert({
      where: { consultorio_id: consultorioId },
      update: configuracion,
      create: {
        consultorio_id: consultorioId,
        secretaria_editar_cobros: false,
        secretaria_eliminar_cobros: false,
        enfermera_entradas_inventario: true,
        enfermera_salidas_inventario: true,
        secretaria_entradas_inventario: true,
        secretaria_salidas_inventario: false,
        ...configuracion
      }
    });

    return {
      secretaria_editar_cobros: configuracionActualizada.secretaria_editar_cobros,
      secretaria_eliminar_cobros: configuracionActualizada.secretaria_eliminar_cobros,
      enfermera_entradas_inventario: configuracionActualizada.enfermera_entradas_inventario,
      enfermera_salidas_inventario: configuracionActualizada.enfermera_salidas_inventario,
      secretaria_entradas_inventario: configuracionActualizada.secretaria_entradas_inventario,
      secretaria_salidas_inventario: configuracionActualizada.secretaria_salidas_inventario
    };
  }

  // Verificar si un usuario puede realizar una acción específica
  static async verificarPermiso(usuarioId: string, permiso: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        consultorio: {
          include: {
            configuracion_permisos: true
          }
        }
      }
    });

    if (!usuario) {
      return false;
    }

    // Los doctores tienen acceso total
    if (usuario.rol === 'DOCTOR') {
      return true;
    }

    switch (permiso) {
      case 'editar_cobros':
        return usuario.puede_editar_cobros;
      case 'eliminar_cobros':
        return usuario.puede_eliminar_cobros;
      case 'ver_historial':
        return usuario.puede_ver_historial;
      case 'gestionar_usuarios':
        return usuario.puede_gestionar_usuarios;
      case 'entradas_inventario':
        if (usuario.rol === 'ENFERMERA') {
          return usuario.consultorio?.configuracion_permisos?.enfermera_entradas_inventario ?? true;
        } else if (usuario.rol === 'SECRETARIA') {
          return usuario.consultorio?.configuracion_permisos?.secretaria_entradas_inventario ?? true;
        }
        return false;
      case 'salidas_inventario':
        if (usuario.rol === 'ENFERMERA') {
          return usuario.consultorio?.configuracion_permisos?.enfermera_salidas_inventario ?? true;
        } else if (usuario.rol === 'SECRETARIA') {
          return usuario.consultorio?.configuracion_permisos?.secretaria_salidas_inventario ?? false;
        }
        return false;
      default:
        return false;
    }
  }

  // Obtener módulos disponibles para un usuario según su rol
  static async obtenerModulosDisponibles(usuarioId: string): Promise<string[]> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        consultorio: {
          include: {
            configuracion_permisos: true
          }
        }
      }
    });

    if (!usuario) {
      return [];
    }

    const modulos: string[] = [];

    switch (usuario.rol) {
      case 'DOCTOR':
        modulos.push('cobros', 'pacientes', 'citas', 'inventario', 'usuarios', 'historial', 'consultorios');
        break;
      case 'SECRETARIA':
        modulos.push('cobros', 'pacientes', 'citas');
        if (usuario.consultorio?.configuracion_permisos?.secretaria_entradas_inventario) {
          modulos.push('inventario');
        }
        break;
      case 'ENFERMERA':
        if (usuario.consultorio?.configuracion_permisos?.enfermera_entradas_inventario || 
            usuario.consultorio?.configuracion_permisos?.enfermera_salidas_inventario) {
          modulos.push('inventario');
        }
        break;
      case 'PACIENTE':
        modulos.push('cuestionarios', 'facturacion');
        break;
    }

    return modulos;
  }

  // Aplicar permisos por defecto según el rol
  static async aplicarPermisosPorDefecto(usuarioId: string, rol: Rol): Promise<void> {
    const permisosPorDefecto: Partial<PermisosUsuario> = {};

    switch (rol) {
      case 'DOCTOR':
        permisosPorDefecto.puede_editar_cobros = true;
        permisosPorDefecto.puede_eliminar_cobros = true;
        permisosPorDefecto.puede_ver_historial = true;
        permisosPorDefecto.puede_gestionar_usuarios = true;
        break;
      case 'SECRETARIA':
        permisosPorDefecto.puede_editar_cobros = false;
        permisosPorDefecto.puede_eliminar_cobros = false;
        permisosPorDefecto.puede_ver_historial = false;
        permisosPorDefecto.puede_gestionar_usuarios = false;
        break;
      case 'ENFERMERA':
        permisosPorDefecto.puede_editar_cobros = false;
        permisosPorDefecto.puede_eliminar_cobros = false;
        permisosPorDefecto.puede_ver_historial = false;
        permisosPorDefecto.puede_gestionar_usuarios = false;
        break;
      case 'PACIENTE':
        permisosPorDefecto.puede_editar_cobros = false;
        permisosPorDefecto.puede_eliminar_cobros = false;
        permisosPorDefecto.puede_ver_historial = false;
        permisosPorDefecto.puede_gestionar_usuarios = false;
        break;
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: permisosPorDefecto
    });
  }
}

export default PermisosService; 
 
 