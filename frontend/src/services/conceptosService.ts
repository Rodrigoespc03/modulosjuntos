import axios from 'axios';

const API_URL = '/api/servicios';

export interface Servicio {
  id: string;
  nombre: string;
  precio_base: number;
  descripcion?: string | null;
}

export async function getAllServicios(): Promise<Servicio[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function createServicio(data: Omit<Servicio, 'id'>): Promise<Servicio> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  const res = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function updateServicio(id: string, data: Omit<Servicio, 'id'>): Promise<Servicio> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function deleteServicio(id: string): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getUsosDeServicio(id: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }
  
  const res = await axios.get(`/api/servicios/${id}/usos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
} 