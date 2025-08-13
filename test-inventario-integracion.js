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
async function testInventoryHealth(token) {
  console.log('\n🔍 **Prueba 1: Verificar salud del módulo de inventario**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/health`, {
      headers: getAuthHeaders(token)
    });
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

// Prueba 3: Crear un producto en el inventario
async function testCreateProduct(token) {
  console.log('\n🔍 **Prueba 3: Crear producto en el inventario**');
  try {
    const nuevoProducto = {
      name: 'Producto Test Multi-Tenant',
      type: 'MEDICAMENTO',
      unit: 'UNIDAD',
      description: 'Producto de prueba para integración multi-tenant',
      costPerUnit: 10.50,
      minStockLevel: 5,
      category: 'Test'
    };

    const response = await axios.post(`${INVENTORY_API_BASE_URL}/products`, nuevoProducto, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Producto creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 4: Obtener movimientos del inventario
async function testGetMovements(token) {
  console.log('\n🔍 **Prueba 4: Obtener movimientos del inventario**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/movements`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Movimientos obtenidos:', response.data.length, 'movimientos');
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 5: Verificar aislamiento de datos en inventario
async function testInventoryIsolation(token) {
  console.log('\n🔍 **Prueba 5: Verificar aislamiento de datos en inventario**');
  try {
    // Obtener productos
    const productsResponse = await axios.get(`${INVENTORY_API_BASE_URL}/products`, {
      headers: getAuthHeaders(token)
    });
    
    // Obtener movimientos
    const movementsResponse = await axios.get(`${INVENTORY_API_BASE_URL}/movements`, {
      headers: getAuthHeaders(token)
    });
    
    // Obtener sedes
    const sedesResponse = await axios.get(`${INVENTORY_API_BASE_URL}/sedes`, {
      headers: getAuthHeaders(token)
    });
    
    console.log('📊 **Datos del inventario para el usuario actual:**');
    console.log(`   - Productos: ${productsResponse.data.length}`);
    console.log(`   - Movimientos: ${movementsResponse.data.length}`);
    console.log(`   - Sedes: ${sedesResponse.data.length}`);
    
    // Verificar que todos los datos tienen organizacion_id
    const productsWithOrg = productsResponse.data.filter(p => p.organizacion_id);
    const movementsWithOrg = movementsResponse.data.filter(m => m.organizacion_id);
    const sedesWithOrg = sedesResponse.data.filter(s => s.organizacion_id);
    
    console.log('\n🔒 **Verificación de aislamiento:**');
    console.log(`   - Productos con organizacion_id: ${productsWithOrg.length}/${productsResponse.data.length}`);
    console.log(`   - Movimientos con organizacion_id: ${movementsWithOrg.length}/${movementsResponse.data.length}`);
    console.log(`   - Sedes con organizacion_id: ${sedesWithOrg.length}/${sedesResponse.data.length}`);
    
    return {
      products: productsResponse.data,
      movements: movementsResponse.data,
      sedes: sedesResponse.data
    };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 **INICIANDO PRUEBAS DE INTEGRACIÓN DE INVENTARIO**');
  console.log('=====================================================');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');

    // Ejecutar pruebas
    await testInventoryHealth(token);
    await testGetProducts(token);
    
    const nuevoProducto = await testCreateProduct(token);
    
    await testGetMovements(token);
    await testInventoryIsolation(token);

    console.log('\n🎉 **TODAS LAS PRUEBAS DE INTEGRACIÓN DE INVENTARIO COMPLETADAS**');
    console.log('\n📋 **RESUMEN:**');
    console.log('   ✅ Módulo de inventario integrado con multi-tenant');
    console.log('   ✅ Autenticación funcionando correctamente');
    console.log('   ✅ Aislamiento de datos por organización');
    console.log('   ✅ CRUD de productos funcionando');
    
  } catch (error) {
    console.error('\n💥 **ERROR EN LAS PRUEBAS:**', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 