const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';
const FRONTEND_URL = 'http://localhost:5178';

console.log('🚀 **Prueba del Sistema ProCura Hub**\n');

// Función para hacer peticiones HTTP
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    };
  }
}

// Prueba 1: Verificar que el backend esté funcionando
async function testBackendHealth() {
  console.log('🔍 **Prueba 1: Verificar salud del backend**');
  const result = await makeRequest('GET', `${API_BASE_URL}/health`);
  
  if (result.success) {
    console.log('✅ Backend funcionando correctamente');
    console.log('📊 Estado:', result.data);
  } else {
    console.log('❌ Error en el backend');
    console.log('📊 Error:', result.error);
  }
}

// Prueba 2: Verificar que las rutas de onboarding estén disponibles
async function testOnboardingRoutes() {
  console.log('\n🔍 **Prueba 2: Verificar rutas de onboarding**');
  
  // Probar la ruta de registro
  const testData = {
    nombre: 'Clínica de Prueba',
    ruc: '12345678901',
    email: 'test@clinica.com',
    telefono: '123456789',
    ciudad: 'Ciudad de Prueba',
    adminNombre: 'Admin Test',
    adminEmail: 'admin@test.com',
    adminPassword: 'password123',
    adminPasswordConfirm: 'password123',
    tipoClinica: 'General',
    numMedicos: '5',
    modulos: ['cobros', 'pacientes'],
    plan: 'basico'
  };
  
  const result = await makeRequest('POST', `${API_BASE_URL}/onboarding/register-organization`, testData);
  
  if (result.success) {
    console.log('✅ API de registro funcionando');
    console.log('📊 Respuesta:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ Error en API de registro');
    console.log('📊 Status:', result.status);
    console.log('📊 Error:', result.error);
    if (result.data) {
      console.log('📊 Detalles:', JSON.stringify(result.data, null, 2));
    }
  }
}

// Prueba 3: Verificar que el frontend esté accesible
async function testFrontendAccess() {
  console.log('\n🔍 **Prueba 3: Verificar acceso al frontend**');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend accesible');
    console.log('📊 Status:', response.status);
  } catch (error) {
    console.log('❌ Error accediendo al frontend');
    console.log('📊 Error:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  await testBackendHealth();
  await testOnboardingRoutes();
  await testFrontendAccess();
  
  console.log('\n🎉 **Pruebas completadas**');
  console.log('\n📋 **Resumen:**');
  console.log('- Frontend: http://localhost:5178');
  console.log('- Backend: http://localhost:3002');
  console.log('- API Onboarding: http://localhost:3002/api/onboarding');
}

runAllTests().catch(console.error); 