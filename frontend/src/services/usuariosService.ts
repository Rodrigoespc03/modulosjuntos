import axios from 'axios';

const API_BASE_URL = '/api';
const USUARIOS_URL = `${API_BASE_URL}/usuarios`;

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

export async function getUsuarios() {
  try {
    const res = await axios.get(USUARIOS_URL, {
      headers: getAuthHeaders()
    });
    console.log('🔍 DEBUG - Respuesta completa de getUsuarios:', res.data);
    // El backend devuelve { success: true, data: usuarios }
    return res.data.data || res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function crearUsuario(usuario: {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  consultorio_id: string;
}) {
  try {
    const res = await axios.post(USUARIOS_URL, usuario, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function actualizarUsuario(id: string, usuario: {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  consultorio_id: string;
}) {
  try {
    const res = await axios.put(`${USUARIOS_URL}/${id}`, usuario, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function eliminarUsuario(id: string) {
  try {
    const res = await axios.delete(`${USUARIOS_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
} 