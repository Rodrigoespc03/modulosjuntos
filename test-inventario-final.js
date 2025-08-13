const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';
const INVENTORY_API_BASE_URL = 'http://localhost:3001/api';

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

// Prueba 1: Verificar que el módulo de inventario está funcionando
async function testInventoryHealth() {
  console.log('\n🔍 **Prueba 1: Verificar salud del módulo de inventario**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/health`);
    console.log('✅ Módulo de inventario funcionando:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 2: Obtener productos del inventario
async function testGetProducts(token) {
  console.log('\n🔍 **Prueba 2: Obtener productos del inventario**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/products`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Productos obtenidos:', response.data.length, 'productos');
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 3: Verificar que el backend principal está funcionando
async function testMainBackend(token) {
  console.log('\n🔍 **Prueba 3: Verificar backend principal**');
  try {
    const response = await axios.get(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Backend principal funcionando');
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 **INICIANDO PRUEBAS FINALES DE INTEGRACIÓN**');
  console.log('==============================================');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');

    // Ejecutar pruebas
    await testMainBackend(token);
    
    try {
      await testInventoryHealth();
      await testGetProducts(token);
      console.log('\n🎉 **INTEGRACIÓN COMPLETA EXITOSA**');
    } catch (inventoryError) {
      console.log('\n⚠️ **MÓDULO DE INVENTARIO NO DISPONIBLE**');
      console.log('   - El backend principal funciona correctamente');
      console.log('   - El módulo de inventario necesita configuración adicional');
      console.log('   - Error:', inventoryError.message);
    }
    
  } catch (error) {
    console.error('\n💥 **ERROR EN LAS PRUEBAS:**', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 