const HISTORIAL_URL = '/api/historial';

export async function getHistorialGeneral(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
  limit?: number;
  offset?: number;
}) {
  console.log('🔍 DEBUG - getHistorialGeneral llamado con filtros:', filtros);
  
  const token = localStorage.getItem('token');
  console.log('🔍 DEBUG - Token obtenido del localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);
  if (filtros?.limit) params.append('limit', filtros.limit.toString());
  if (filtros?.offset) params.append('offset', filtros.offset.toString());

  const url = `${HISTORIAL_URL}/general?${params}`;
  console.log('🔍 DEBUG - URL de la petición:', url);

  console.log('🔍 DEBUG - Headers de la petición:', {
    'Authorization': `Bearer ${token.substring(0, 20)}...`,
    'Content-Type': 'application/json'
  });
  
  console.log('🔍 DEBUG - Realizando petición a:', url);
  console.log('🔍 DEBUG - Headers completos:', {
    'Authorization': `Bearer ${token.substring(0, 20)}...`,
    'Content-Type': 'application/json'
  });
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('🔍 DEBUG - Status de la respuesta:', response.status);

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 503) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'La base de datos no está disponible en este momento');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial');
  }

  const data = await response.json();
  console.log('🔍 DEBUG - Datos recibidos del backend:', data);
  console.log('🔍 DEBUG - Cantidad de registros recibidos:', data.length);
  
  return data;
}

export async function getHistorialEstadisticas() {
  console.log('🔍 DEBUG - getHistorialEstadisticas llamado');
  
  const token = localStorage.getItem('token');
  console.log('🔍 DEBUG - Token obtenido del localStorage (estadísticas):', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${HISTORIAL_URL}/estadisticas`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar las estadísticas');
  }

  return response.json();
}

export async function buscarHistorial(termino: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${HISTORIAL_URL}/buscar?q=${encodeURIComponent(termino)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al buscar en el historial');
  }

  return response.json();
}

export async function exportarHistorial(formato: 'json' | 'csv', filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  params.append('formato', formato);
  
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);

  const response = await fetch(`${HISTORIAL_URL}/exportar?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al exportar el historial');
  }

  return response;
}

export async function getHistorialCobro(cobroId: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${HISTORIAL_URL}/cobro/${cobroId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial del cobro');
  }

  return response.json();
} 
 
 