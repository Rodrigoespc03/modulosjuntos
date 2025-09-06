import axios from 'axios';

const COBROS_URL = '/api/cobros';
const CONCEPTOS_URL = '/api/cobro-conceptos';
const PACIENTES_URL = '/api/pacientes';
const USUARIOS_URL = '/api/usuarios';
const CONSULTORIOS_URL = '/api/consultorios';

// Configurar axios para que no redirija automáticamente en errores 401/403
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status < 300; // Solo acepta códigos de éxito
};

export async function crearCobro(data: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  try {
    const res = await axios.post(COBROS_URL, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
  }
}

export async function agregarConceptoACobro(data: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  try {
    const res = await axios.post(CONCEPTOS_URL, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
  }
}

export async function getPacientes() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  try {
    const res = await axios.get(PACIENTES_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // El backend devuelve {success: true, data: [...]}, necesitamos solo el array
    return res.data.data || res.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
  }
}

export async function getUsuarios() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
    }
  
  try {
    const res = await axios.get(USUARIOS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // El backend devuelve {success: true, data: [...]}, necesitamos solo el array
    return res.data.data || res.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
  }
}

export async function getConsultorios() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  try {
    const res = await axios.get(CONSULTORIOS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // El backend devuelve {success: true, data: [...]}, necesitamos solo el array
    return res.data.data || res.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
  }
}

export async function getCobros() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  try {
    const res = await axios.get(COBROS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // El backend devuelve {success: true, data: [...]}, necesitamos solo el array
    return res.data.data || res.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
  }
}

export async function eliminarCobro(id: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  console.log(`Eliminando cobro ${id}`);
  
  try {
    const res = await axios.delete(`${COBROS_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Respuesta de eliminación:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('Error al eliminar cobro:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    
    // Propagar el error con más información
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw error;
  }
}

export async function editarCobro(id: string, data: any) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  console.log(`Editando cobro ${id} con datos:`, data);
  
  try {
    const res = await axios.put(`${COBROS_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Respuesta de edición:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('Error al editar cobro:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    
    // Propagar el error con más información
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw error;
  }
} 