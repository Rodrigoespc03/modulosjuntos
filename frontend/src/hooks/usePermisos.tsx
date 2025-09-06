import { useState, useEffect, useContext, createContext } from 'react';
import { 
  obtenerMisPermisos, 
  verificarPermiso,
  PermisosUsuario, 
  PermisosResponse,
  tienePermiso as tienePermisoUtil,
  puedeAccederAModulo as puedeAccederAModuloUtil,
  ROLES,
  MODULOS,
  type Rol,
  type Modulo
} from '../services/permisosService';

// Contexto para permisos
interface PermisosContextType {
  permisos: PermisosUsuario | null;
  modulosDisponibles: string[];
  rol: string | null;
  organizacion: any | null;
  loading: boolean;
  error: string | null;
  tienePermiso: (permiso: keyof PermisosUsuario) => boolean;
  puedeAccederAModulo: (modulo: string) => boolean;
  esDoctor: boolean;
  esSecretaria: boolean;
  esEnfermera: boolean;
  esPaciente: boolean;
  recargarPermisos: () => Promise<void>;
}

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

// Hook principal para usar permisos
export const usePermisos = () => {
  const context = useContext(PermisosContext);
  if (context === undefined) {
    throw new Error('usePermisos debe ser usado dentro de un PermisosProvider');
  }
  return context;
};

// Hook para verificar permisos específicos
export const usePermiso = (permiso: keyof PermisosUsuario) => {
  const { permisos, tienePermiso } = usePermisos();
  return permisos ? tienePermiso(permiso) : false;
};

// Hook para verificar acceso a módulos
export const useModulo = (modulo: string) => {
  const { modulosDisponibles, puedeAccederAModulo } = usePermisos();
  return puedeAccederAModulo(modulo);
};

// Hook para verificar roles
export const useRol = (rol: Rol) => {
  const { rol: rolUsuario } = usePermisos();
  return rolUsuario === rol;
};

// Provider para el contexto de permisos
export const PermisosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permisos, setPermisos] = useState<PermisosUsuario | null>(null);
  const [modulosDisponibles, setModulosDisponibles] = useState<string[]>([]);
  const [rol, setRol] = useState<string | null>(null);
  const [organizacion, setOrganizacion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      const response: PermisosResponse = await obtenerMisPermisos();
      
      // Extraer datos de la respuesta del backend
      const data = response.data || response;
      
      setPermisos(data.permisos);
      setModulosDisponibles(data.modulosDisponibles);
      setRol(data.rol);
      setOrganizacion(data.organizacion || null);
    } catch (err: any) {
      console.error('Error cargando permisos:', err);
      setError(err.message || 'Error cargando permisos');
      
      // Si hay error de autenticación, redirigir al login
      if (err.message?.includes('autenticación') || err.message?.includes('401') || err.message?.includes('Token inválido')) {
        console.log('🔍 DEBUG - Error de autenticación detectado, removiendo token');
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        console.log('🔍 DEBUG - Error en permisos (no de autenticación):', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const recargarPermisos = async () => {
    await cargarPermisos();
  };

  const tienePermiso = (permiso: keyof PermisosUsuario): boolean => {
    if (!permisos) return false;
    return tienePermisoUtil(permisos, permiso);
  };

  const puedeAccederAModulo = (modulo: string): boolean => {
    return puedeAccederAModuloUtil(modulosDisponibles, modulo);
  };

  // Verificar permisos al montar el componente
  useEffect(() => {
    cargarPermisos();
  }, []);

  // Computed values para roles
  const esDoctor = rol === ROLES.DOCTOR;
  const esSecretaria = rol === ROLES.SECRETARIA;
  const esEnfermera = rol === ROLES.ENFERMERA;
  const esPaciente = rol === ROLES.PACIENTE;

  const value: PermisosContextType = {
    permisos,
    modulosDisponibles,
    rol,
    organizacion,
    loading,
    error,
    tienePermiso,
    puedeAccederAModulo,
    esDoctor,
    esSecretaria,
    esEnfermera,
    esPaciente,
    recargarPermisos
  };

  return (
    <PermisosContext.Provider value={value}>
      {children}
    </PermisosContext.Provider>
  );
};

// Componente de protección de rutas basado en permisos
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermiso?: keyof PermisosUsuario;
  requiredModulo?: string;
  requiredRol?: Rol;
  fallback?: React.ReactNode;
}> = ({ 
  children, 
  requiredPermiso, 
  requiredModulo, 
  requiredRol, 
  fallback = <div>Acceso denegado</div> 
}) => {
  const { loading, error, tienePermiso, puedeAccederAModulo, rol } = usePermisos();

  if (loading) {
    return <div>Cargando permisos...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Verificar permiso específico
  if (requiredPermiso && !tienePermiso(requiredPermiso)) {
    return <>{fallback}</>;
  }

  // Verificar módulo específico
  if (requiredModulo && !puedeAccederAModulo(requiredModulo)) {
    return <>{fallback}</>;
  }

  // Verificar rol específico
  if (requiredRol && rol !== requiredRol) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Componente para mostrar contenido condicionalmente
export const ConditionalRender: React.FC<{
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}> = ({ children, condition, fallback = null }) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

// Hooks específicos para permisos comunes
export const usePuedeEditarCobros = () => usePermiso('puede_editar_cobros');
export const usePuedeEliminarCobros = () => usePermiso('puede_eliminar_cobros');
export const usePuedeVerHistorial = () => usePermiso('puede_ver_historial');
export const usePuedeGestionarUsuarios = () => usePermiso('puede_gestionar_usuarios');

// Hooks específicos para módulos
export const usePuedeAccederACobros = () => useModulo(MODULOS.COBROS);
export const usePuedeAccederAPacientes = () => useModulo(MODULOS.PACIENTES);
export const usePuedeAccederACitas = () => useModulo(MODULOS.CITAS);
export const usePuedeAccederAInventario = () => useModulo(MODULOS.INVENTARIO);
export const usePuedeAccederAUsuarios = () => useModulo(MODULOS.USUARIOS);
export const usePuedeAccederAHistorial = () => useModulo(MODULOS.HISTORIAL);

// Hooks específicos para roles
export const useEsDoctor = () => useRol(ROLES.DOCTOR);
export const useEsSecretaria = () => useRol(ROLES.SECRETARIA);
export const useEsEnfermera = () => useRol(ROLES.ENFERMERA);
export const useEsPaciente = () => useRol(ROLES.PACIENTE); 