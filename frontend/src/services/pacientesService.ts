import axios from 'axios';

const API_BASE_URL = '/api';
const PACIENTES_URL = `${API_BASE_URL}/pacientes`;

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

export async function getPacientes() {
  try {
    const res = await axios.get(PACIENTES_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function crearPaciente(paciente: {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
}) {
  try {
    const res = await axios.post(PACIENTES_URL, paciente, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function actualizarPaciente(id: string, paciente: {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
}) {
  try {
    const res = await axios.put(`${PACIENTES_URL}/${id}`, paciente, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function eliminarPaciente(id: string) {
  try {
    const res = await axios.delete(`${PACIENTES_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
}

export async function borrarPaciente(id: string) {
  try {
    const res = await axios.delete(`${PACIENTES_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error: any) {
    handleAuthError(error);
  }
} 