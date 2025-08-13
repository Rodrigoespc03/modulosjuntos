import axios from 'axios'

const API_BASE_URL = '/api'
const BLOQUEO_URL = `${API_BASE_URL}/bloqueo-medico`

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

export async function getBloqueos(usuario_id?: string) {
  try {
    const res = await axios.get(BLOQUEO_URL, { 
      params: usuario_id ? { usuario_id } : {},
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function crearBloqueo(data: {
  usuario_id: string
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}) {
  try {
    const res = await axios.post(BLOQUEO_URL, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function actualizarBloqueo(id: string, data: {
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}) {
  try {
    const res = await axios.put(`${BLOQUEO_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function eliminarBloqueo(id: string) {
  try {
    const res = await axios.delete(`${BLOQUEO_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
} 