const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

// Función para obtener token de autenticación
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    return response.data.token;
  } catch (error) {
    console.error('Error obteniendo token:', error.response?.data || error.message);
    throw error;
  }
}

// Función helper para headers con autenticación
function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Prueba 1: Obtener todas las organizaciones
async function testGetOrganizaciones(token) {
  console.log('\n🔍 **Prueba 1: Obtener todas las organizaciones**');
  try {
    const response = await axios.get(`${API_BASE_URL}/organizaciones`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Éxito:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 2: Crear nueva organización
async function testCreateOrganizacion(token) {
  console.log('\n🔍 **Prueba 2: Crear nueva organización**');
  try {
    const nuevaOrg = {
      nombre: 'Clínica Test Multi-Tenant',
      ruc: '98765432100',
      email: 'test@clinica.com',
      telefono: '+51 999 888 777',
      direccion: 'Av. Test 456, Lima',
      color_primario: '#FF6B6B',
      color_secundario: '#4ECDC4'
    };

    const response = await axios.post(`${API_BASE_URL}/organizaciones`, nuevaOrg, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Organización creada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 3: Obtener organización específica
async function testGetOrganizacionById(token, orgId) {
  console.log('\n🔍 **Prueba 3: Obtener organización específica**');
  try {
    const response = await axios.get(`${API_BASE_URL}/organizaciones/${orgId}`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Organización obtenida:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 4: Actualizar organización
async function testUpdateOrganizacion(token, orgId) {
  console.log('\n🔍 **Prueba 4: Actualizar organización**');
  try {
    const updateData = {
      nombre: 'Clínica Test Multi-Tenant - Actualizada',
      telefono: '+51 999 777 666'
    };

    const response = await axios.put(`${API_BASE_URL}/organizaciones/${orgId}`, updateData, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Organización actualizada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 5: Obtener estadísticas de organización
async function testGetOrganizacionStats(token, orgId) {
  console.log('\n🔍 **Prueba 5: Obtener estadísticas de organización**');
  try {
    const response = await axios.get(`${API_BASE_URL}/organizaciones/${orgId}/stats`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Estadísticas obtenidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 **INICIANDO PRUEBAS DE ORGANIZACIONES**');
  console.log('==========================================');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');

    // Ejecutar pruebas
    await testGetOrganizaciones(token);
    
    const nuevaOrg = await testCreateOrganizacion(token);
    const orgId = nuevaOrg.id;
    
    await testGetOrganizacionById(token, orgId);
    await testUpdateOrganizacion(token, orgId);
    await testGetOrganizacionStats(token, orgId);

    console.log('\n🎉 **TODAS LAS PRUEBAS DE ORGANIZACIONES COMPLETADAS EXITOSAMENTE**');
    
  } catch (error) {
    console.error('\n💥 **ERROR EN LAS PRUEBAS:**', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 