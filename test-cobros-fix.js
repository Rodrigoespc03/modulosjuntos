const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3002';
const API_URL = `${BASE_URL}/api`;

// Función para hacer peticiones con token
async function makeRequest(method, url, data = null, token = null) {
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Función para verificar el estado del servidor
async function checkServerStatus() {
  console.log('🔍 Verificando estado del servidor...');
  
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Servidor funcionando:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Error conectando al servidor:', error.message);
    return false;
  }
}

// Función para obtener cobros
async function getCobros() {
  console.log('\n📋 Obteniendo cobros...');
  const result = await makeRequest('GET', `${API_URL}/cobros`);
  
  if (result.success) {
    console.log(`✅ Se obtuvieron ${result.data.length} cobros`);
    if (result.data.length > 0) {
      console.log('Primer cobro:', {
        id: result.data[0].id,
        estado: result.data[0].estado,
        monto_total: result.data[0].monto_total,
        paciente: result.data[0].paciente?.nombre
      });
    }
    return result.data;
  } else {
    console.log('❌ Error obteniendo cobros:', result.error);
    return [];
  }
}

// Función para probar actualizar un cobro
async function testUpdateCobro(cobroId, token) {
  console.log(`\n🔄 Probando actualizar cobro ${cobroId}...`);
  
  const updateData = {
    estado: 'COMPLETADO'
  };
  
  const result = await makeRequest('PUT', `${API_URL}/cobros/${cobroId}`, updateData, token);
  
  if (result.success) {
    console.log('✅ Cobro actualizado exitosamente');
    console.log('Nuevo estado:', result.data.estado);
    return true;
  } else {
    console.log('❌ Error actualizando cobro:', result.error);
    console.log('Status:', result.status);
    return false;
  }
}

// Función para probar eliminar un cobro
async function testDeleteCobro(cobroId, token) {
  console.log(`\n🗑️ Probando eliminar cobro ${cobroId}...`);
  
  const result = await makeRequest('DELETE', `${API_URL}/cobros/${cobroId}`, null, token);
  
  if (result.success) {
    console.log('✅ Cobro eliminado exitosamente');
    console.log('Mensaje:', result.data.message);
    return true;
  } else {
    console.log('❌ Error eliminando cobro:', result.error);
    console.log('Status:', result.status);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🧪 Iniciando pruebas del módulo de cobros...\n');
  
  // Verificar servidor
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    console.log('❌ No se puede continuar sin el servidor');
    return;
  }
  
  // Obtener cobros
  const cobros = await getCobros();
  
  if (cobros.length === 0) {
    console.log('❌ No hay cobros para probar');
    return;
  }
  
  // Buscar un cobro pendiente para probar actualización
  const cobroPendiente = cobros.find(c => c.estado === 'PENDIENTE');
  const cobroParaEliminar = cobros.find(c => c.estado === 'CANCELADO' || c.estado === 'COMPLETADO');
  
  // Simular un token (en producción esto vendría del login)
  const mockToken = 'mock-token-for-testing';
  
  if (cobroPendiente) {
    console.log(`\n🎯 Probando actualizar cobro pendiente: ${cobroPendiente.id}`);
    await testUpdateCobro(cobroPendiente.id, mockToken);
  } else {
    console.log('\n⚠️ No hay cobros pendientes para probar actualización');
  }
  
  if (cobroParaEliminar) {
    console.log(`\n🎯 Probando eliminar cobro: ${cobroParaEliminar.id}`);
    await testDeleteCobro(cobroParaEliminar.id, mockToken);
  } else {
    console.log('\n⚠️ No hay cobros para probar eliminación');
  }
  
  console.log('\n✅ Pruebas completadas');
}

// Ejecutar pruebas
main().catch(console.error); 
 
 