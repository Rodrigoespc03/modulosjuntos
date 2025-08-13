const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Función para obtener token de autenticación
async function getAuthToken() {
  try {
    console.log('🔐 Intentando login...');
    const response = await axios.post(`${BASE_URL}/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    
    console.log('✅ Login exitoso');
    console.log('📋 Token recibido:', response.data.token ? 'SÍ' : 'NO');
    console.log('🔑 Token completo:', response.data.token);
    console.log('👤 Usuario:', response.data.user?.nombre, response.data.user?.apellido);
    console.log('🏢 Organización ID:', response.data.user?.organizacion_id);
    return response.data.token;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return null;
  }
}

// Función para probar una sola ruta protegida
async function testSingleProtectedRoute(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n🧪 Probando ruta protegida...');
  console.log('🔑 Token usado:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

  // Probar obtener pacientes
  try {
    console.log('📡 Haciendo request a /api/pacientes...');
    const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`, { headers });
    console.log('✅ Pacientes obtenidos:', pacientesResponse.data.length, 'pacientes');
    console.log('📋 Datos:', pacientesResponse.data);
  } catch (error) {
    console.error('❌ Error obteniendo pacientes:', error.response?.data || error.message);
    console.error('📋 Status:', error.response?.status);
    console.error('📋 Headers:', error.response?.headers);
  }
}

// Función para probar rutas sin autenticación
async function testUnauthenticatedRoutes() {
  console.log('\n🧪 Probando rutas sin autenticación...');

  // Probar crear organización (ruta pública)
  try {
    const orgData = {
      nombre: 'Organización de Prueba',
      ruc: '12345678901',
      direccion: 'Dirección de prueba',
      telefono: '123456789',
      email: 'test@organizacion.com'
    };
    
    const response = await axios.post(`${BASE_URL}/organizaciones`, orgData);
    console.log('✅ Organización creada:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando organización:', error.response?.data || error.message);
    return null;
  }
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando pruebas de Multi-Tenant...\n');

  // Probar ruta pública
  const orgId = await testUnauthenticatedRoutes();

  // Obtener token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ No se pudo obtener token. Deteniendo pruebas.');
    return;
  }

  // Probar ruta protegida
  await testSingleProtectedRoute(token);

  console.log('\n✅ Pruebas completadas!');
}

// Ejecutar pruebas
runTests().catch(console.error); 
 
 