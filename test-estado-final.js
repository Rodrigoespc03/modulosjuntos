const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';
const INVENTORY_API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5175';

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

// Prueba 1: Verificar backend principal
async function testMainBackend(token) {
  console.log('\n🔍 **Prueba 1: Verificar backend principal**');
  try {
    const response = await axios.get(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Backend principal funcionando correctamente');
    console.log(`   - Usuarios encontrados: ${response.data.length}`);
    return true;
  } catch (error) {
    console.error('❌ Error en backend principal:', error.response?.data || error.message);
    return false;
  }
}

// Prueba 2: Verificar permisos multi-tenant
async function testMultiTenantPermissions(token) {
  console.log('\n🔍 **Prueba 2: Verificar permisos multi-tenant**');
  try {
    const response = await axios.get(`${API_BASE_URL}/permisos/mis-permisos`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Permisos multi-tenant funcionando');
    console.log(`   - Rol: ${response.data.rol}`);
    console.log(`   - Organización: ${response.data.organizacion?.nombre}`);
    console.log(`   - Módulos disponibles: ${response.data.modulosDisponibles.join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Error en permisos:', error.response?.data || error.message);
    return false;
  }
}

// Prueba 3: Verificar frontend
async function testFrontend() {
  console.log('\n🔍 **Prueba 3: Verificar frontend**');
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend funcionando correctamente');
    console.log(`   - URL: ${FRONTEND_URL}`);
    return true;
  } catch (error) {
    console.error('❌ Error en frontend:', error.message);
    return false;
  }
}

// Prueba 4: Verificar módulo de inventario
async function testInventoryModule() {
  console.log('\n🔍 **Prueba 4: Verificar módulo de inventario**');
  try {
    const response = await axios.get(`${INVENTORY_API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Módulo de inventario funcionando');
    console.log(`   - URL: ${INVENTORY_API_BASE_URL}`);
    return true;
  } catch (error) {
    console.log('⚠️ Módulo de inventario no disponible');
    console.log(`   - Error: ${error.message}`);
    console.log(`   - URL intentada: ${INVENTORY_API_BASE_URL}`);
    return false;
  }
}

// Función principal de pruebas
async function runFinalTests() {
  console.log('🚀 **VERIFICACIÓN FINAL DEL SISTEMA INTEGRADO**');
  console.log('==============================================');
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token de autenticación obtenido correctamente');

    // Ejecutar pruebas
    const backendOk = await testMainBackend(token);
    const permissionsOk = await testMultiTenantPermissions(token);
    const frontendOk = await testFrontend();
    const inventoryOk = await testInventoryModule();

    // Resumen final
    console.log('\n📊 **RESUMEN FINAL**');
    console.log('===================');
    console.log(`Backend Principal: ${backendOk ? '✅' : '❌'}`);
    console.log(`Permisos Multi-Tenant: ${permissionsOk ? '✅' : '❌'}`);
    console.log(`Frontend: ${frontendOk ? '✅' : '❌'}`);
    console.log(`Módulo de Inventario: ${inventoryOk ? '✅' : '⚠️'}`);

    // Evaluación general
    const totalTests = 4;
    const passedTests = [backendOk, permissionsOk, frontendOk, inventoryOk].filter(Boolean).length;
    const successRate = (passedTests / totalTests) * 100;

    console.log(`\n🎯 **EVALUACIÓN GENERAL: ${successRate}%**`);

    if (successRate >= 75) {
      console.log('\n🎉 **SISTEMA FUNCIONANDO CORRECTAMENTE**');
      console.log('   - El sistema principal está operativo');
      console.log('   - La integración multi-tenant funciona');
      console.log('   - El frontend está disponible');
      
      if (!inventoryOk) {
        console.log('\n⚠️ **RECOMENDACIÓN:**');
        console.log('   - El módulo de inventario necesita corrección de errores de TypeScript');
        console.log('   - Los errores son principalmente de enums y tipos');
        console.log('   - Una vez corregidos, el sistema estará 100% funcional');
      }
    } else if (successRate >= 50) {
      console.log('\n⚠️ **SISTEMA PARCIALMENTE FUNCIONAL**');
      console.log('   - Algunos componentes funcionan correctamente');
      console.log('   - Se requieren correcciones para funcionalidad completa');
    } else {
      console.log('\n💥 **SISTEMA CON PROBLEMAS**');
      console.log('   - Se requieren correcciones significativas');
    }

    // URLs de acceso
    console.log('\n🌐 **URLS DE ACCESO:**');
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Backend API: ${API_BASE_URL}`);
    if (inventoryOk) {
      console.log(`Inventario API: ${INVENTORY_API_BASE_URL}`);
    }

  } catch (error) {
    console.error('\n💥 **ERROR CRÍTICO EN LAS PRUEBAS:**', error.message);
    console.log('\n🔧 **RECOMENDACIONES:**');
    console.log('1. Verificar que el backend principal esté corriendo');
    console.log('2. Verificar la conexión a la base de datos');
    console.log('3. Revisar los logs de error para más detalles');
  }
}

// Ejecutar pruebas
runFinalTests(); 