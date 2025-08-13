const API_BASE_URL = '/api';

// Función helper para obtener headers con autenticación
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  return { Authorization: `Bearer ${token}` };
}

export interface DisponibilidadMedico {
  id: string;
  usuario_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
  updated_at: string;
}

export async function getDisponibilidades(usuario_id?: string): Promise<DisponibilidadMedico[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${API_BASE_URL}/disponibilidad-medico?usuario_id=${usuario_id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  
  if (!response.ok) {
    throw new Error('Error al obtener disponibilidades');
  }
  return response.json();
}

export async function crearDisponibilidad(disponibilidad: Omit<DisponibilidadMedico, 'id' | 'created_at' | 'updated_at'>): Promise<DisponibilidadMedico> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${API_BASE_URL}/disponibilidad-medico`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(disponibilidad),
  });
  
  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  
  if (!response.ok) {
    throw new Error('Error al crear disponibilidad');
  }
  return response.json();
}

export async function actualizarDisponibilidad(id: string, disponibilidad: Partial<DisponibilidadMedico>): Promise<DisponibilidadMedico> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${API_BASE_URL}/disponibilidad-medico/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(disponibilidad),
  });
  
  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  
  if (!response.ok) {
    throw new Error('Error al actualizar disponibilidad');
  }
  return response.json();
}

export async function eliminarDisponibilidad(id: string): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${API_BASE_URL}/disponibilidad-medico/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  
  if (!response.ok) {
    throw new Error('Error al eliminar disponibilidad');
  }
} 