import axios from 'axios';

const API_BASE_URL = '/api';
const ORGANIZACIONES_URL = `${API_BASE_URL}/organizaciones`;

// Función helper para obtener headers con autenticación
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  return { Authorization: `Bearer ${token}` };
}

// Función helper para manejar errores de autenticación
function handleAuthError(error: any) {
  if (error.response?.status === 401 || error.response?.status === 403) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  throw error;
}

// Obtener todas las organizaciones (requiere autenticación)
export async function getOrganizaciones() {
  try {
    const res = await axios.get(ORGANIZACIONES_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

// Obtener organización por ID (requiere autenticación)
export async function getOrganizacionById(id: string) {
  try {
    const res = await axios.get(`${ORGANIZACIONES_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

// Crear nueva organización (ruta pública)
export async function crearOrganizacion(organizacion: {
  nombre: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
}) {
  try {
    const res = await axios.post(ORGANIZACIONES_URL, organizacion);
    return res.data;
  } catch (error: any) {
    throw error;
  }
}

// Actualizar organización (requiere autenticación)
export async function actualizarOrganizacion(id: string, organizacion: {
  nombre?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
}) {
  try {
    const res = await axios.put(`${ORGANIZACIONES_URL}/${id}`, organizacion, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

// Eliminar organización (requiere autenticación)
export async function eliminarOrganizacion(id: string) {
  try {
    const res = await axios.delete(`${ORGANIZACIONES_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

// Obtener estadísticas de la organización (requiere autenticación)
export async function getOrganizacionStats(id: string) {
  try {
    const res = await axios.get(`${ORGANIZACIONES_URL}/${id}/stats`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
} 
 
 