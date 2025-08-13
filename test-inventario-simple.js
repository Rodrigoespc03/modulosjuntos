const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';
const INVENTORY_API_BASE_URL = 'http://localhost:3000/api';

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

// Prueba 3: Obtener productos por categoría
async function testGetProductsByCategory(token) {
  console.log('\n🔍 **Prueba 3: Obtener productos por categoría**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/products/category/Test`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Productos por categoría obtenidos:', response.data.length, 'productos');
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 4: Verificar rutas de inventory
async function testInventoryRoutes(token) {
  console.log('\n🔍 **Prueba 4: Verificar rutas de inventory**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/inventory/exit/by-category?sedeId=test`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Rutas de inventory funcionando:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 **INICIANDO PRUEBAS SIMPLES DE INVENTARIO**');
  console.log('==============================================');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');

    // Ejecutar pruebas
    await testInventoryHealth();
    await testGetProducts(token);
    await testGetProductsByCategory(token);
    await testInventoryRoutes(token);

    console.log('\n🎉 **TODAS LAS PRUEBAS SIMPLES DE INVENTARIO COMPLETADAS**');
    console.log('\n📋 **RESUMEN:**');
    console.log('   ✅ Módulo de inventario funcionando');
    console.log('   ✅ Autenticación funcionando correctamente');
    console.log('   ✅ Rutas de productos disponibles');
    console.log('   ✅ Rutas de inventory disponibles');
    
  } catch (error) {
    console.error('\n💥 **ERROR EN LAS PRUEBAS:**', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 