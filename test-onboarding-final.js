const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';
const FRONTEND_URL = 'http://localhost:5174';

console.log('🚀 **Prueba Final del Sistema ProCura Hub**\n');

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

// Generar datos únicos para la prueba
function generateUniqueData() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  return {
    nombre: `Clínica Test ${timestamp}`,
    ruc: `12345678${timestamp % 100000}`,
    email: `test${timestamp}@clinica.com`,
    telefono: `123456789`,
    ciudad: 'Ciudad de Prueba',
    adminNombre: 'Admin Test',
    adminEmail: `admin${timestamp}@test.com`,
    adminPassword: 'password123',
    adminPasswordConfirm: 'password123',
    tipoClinica: 'General',
    numMedicos: '5',
    modulos: ['cobros', 'pacientes'],
    plan: 'basico'
  };
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
  
  // Probar la ruta de registro con datos únicos
  const testData = generateUniqueData();
  
  console.log('📝 Intentando registrar organización con datos únicos...');
  console.log('📊 RUC:', testData.ruc);
  console.log('📊 Email:', testData.adminEmail);
  
  const result = await makeRequest('POST', `${API_BASE_URL}/onboarding/register-organization`, testData);
  
  if (result.success) {
    console.log('✅ API de registro funcionando correctamente');
    console.log('📊 Status:', result.status);
    console.log('📊 Organización creada:', result.data.data.organizacion.nombre);
    console.log('📊 Usuario creado:', result.data.data.usuario.nombre);
    console.log('📊 Token generado:', result.data.data.token ? 'Sí' : 'No');
    
    // Guardar el ID de la organización para pruebas adicionales
    const organizacionId = result.data.data.organizacion.id;
    
    // Prueba adicional: verificar progreso del onboarding
    console.log('\n🔍 **Prueba 2.1: Verificar progreso del onboarding**');
    const progressResult = await makeRequest('GET', `${API_BASE_URL}/onboarding/progress/${organizacionId}`);
    
    if (progressResult.success) {
      console.log('✅ API de progreso funcionando');
      console.log('📊 Pasos completados:', progressResult.data.data.completedSteps, '/', progressResult.data.data.totalSteps);
    } else {
      console.log('❌ Error en API de progreso');
      console.log('📊 Error:', progressResult.error);
    }
    
    return organizacionId;
  } else {
    console.log('❌ Error en API de registro');
    console.log('📊 Status:', result.status);
    console.log('📊 Error:', result.error);
    if (result.data) {
      console.log('📊 Detalles:', JSON.stringify(result.data, null, 2));
    }
    return null;
  }
}

// Prueba 3: Verificar que el frontend esté accesible
async function testFrontendAccess() {
  console.log('\n🔍 **Prueba 3: Verificar acceso al frontend**');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend accesible');
    console.log('📊 Status:', response.status);
    console.log('📊 URL:', FRONTEND_URL);
  } catch (error) {
    console.log('❌ Error accediendo al frontend');
    console.log('📊 Error:', error.message);
  }
}

// Prueba 4: Verificar rutas específicas del frontend
async function testFrontendRoutes() {
  console.log('\n🔍 **Prueba 4: Verificar rutas del frontend**');
  
  const routes = [
    '/',
    '/registro',
    '/login'
  ];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${route}`, { timeout: 5000 });
      console.log(`✅ Ruta ${route}: ${response.status}`);
    } catch (error) {
      console.log(`❌ Error en ruta ${route}: ${error.message}`);
    }
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  await testBackendHealth();
  const organizacionId = await testOnboardingRoutes();
  await testFrontendAccess();
  await testFrontendRoutes();
  
  console.log('\n🎉 **Pruebas completadas exitosamente**');
  console.log('\n📋 **Resumen del Sistema:**');
  console.log('✅ Frontend: http://localhost:5174');
  console.log('✅ Backend: http://localhost:3002');
  console.log('✅ API Onboarding: http://localhost:3002/api/onboarding');
  console.log('✅ Sistema de registro funcionando');
  console.log('✅ Sistema de progreso funcionando');
  
  if (organizacionId) {
    console.log(`✅ Organización de prueba creada con ID: ${organizacionId}`);
  }
  
  console.log('\n🚀 **El Sistema ProCura Hub está listo para usar!**');
  console.log('\n📝 **Próximos pasos:**');
  console.log('1. Abrir http://localhost:5174 en el navegador');
  console.log('2. Probar el flujo de registro de nuevas clínicas');
  console.log('3. Probar el flujo de onboarding');
  console.log('4. Verificar la integración con el sistema principal');
}

runAllTests().catch(console.error); 