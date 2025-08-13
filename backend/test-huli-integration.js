const axios = require('axios');
require('dotenv').config();

// Configuración
const BASE_URL = 'http://localhost:3002';
const HULI_API_KEY = process.env.HULI_API_KEY || '_CgwYr2Mj69qy8d8-j1mbWbq9rMPiLBpaDbR8lRy-juZI';
const HULI_ORGANIZATION_ID = process.env.HULI_ORGANIZATION_ID || '106829';
const HULI_USER_ID = process.env.HULI_USER_ID || '112252';

// Token JWT de prueba (necesitarás obtener uno válido)
const JWT_TOKEN = process.env.JWT_TOKEN || 'your-jwt-token-here';

console.log('🧪 Iniciando pruebas de integración con HuliPractice...\n');

// Función para hacer peticiones con manejo de errores
async function makeRequest(method, endpoint, data = null, description) {
  try {
    console.log(`📡 ${description}...`);
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      ...(data && { data })
    };

    const response = await axios(config);
    
    console.log(`✅ ${description} - Éxito`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    console.log('');
    
    return response.data;
  } catch (error) {
    console.log(`❌ ${description} - Error`);
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    console.log('');
    
    return null;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🔧 Configuración:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Huli API Key: ${HULI_API_KEY.substring(0, 10)}...`);
  console.log(`   Organization ID: ${HULI_ORGANIZATION_ID}`);
  console.log(`   User ID: ${HULI_USER_ID}`);
  console.log('');

  // 1. Probar conexión con Huli
  await makeRequest(
    'GET',
    '/api/huli/test-connection',
    null,
    'Verificando conexión con HuliPractice'
  );

  // 2. Obtener lista de pacientes
  await makeRequest(
    'GET',
    '/api/huli/patients?page=1&limit=5',
    null,
    'Obteniendo lista de pacientes de Huli'
  );

  // 3. Obtener lista de citas
  await makeRequest(
    'GET',
    '/api/huli/appointments?page=1&limit=5',
    null,
    'Obteniendo lista de citas de Huli'
  );

  // 4. Obtener expedientes médicos
  await makeRequest(
    'GET',
    '/api/huli/medical-records?page=1&limit=5',
    null,
    'Obteniendo expedientes médicos de Huli'
  );

  // 5. Probar creación de paciente (si la API lo permite)
  const testPatient = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@test.com',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'M',
    address: 'Calle Test 123, Ciudad Test'
  };

  await makeRequest(
    'POST',
    '/api/huli/patients',
    testPatient,
    'Creando paciente de prueba en Huli'
  );

  console.log('🏁 Pruebas completadas');
  console.log('\n📝 Notas:');
  console.log('   - Si ves errores 401, necesitas un JWT token válido');
  console.log('   - Si ves errores 404, verifica que el servidor esté corriendo');
  console.log('   - Si ves errores de Huli, verifica las credenciales de la API');
  console.log('\n🔗 Para obtener un JWT token válido:');
  console.log('   1. Inicia sesión en tu aplicación');
  console.log('   2. Copia el token del localStorage o de la respuesta de login');
  console.log('   3. Configúralo como JWT_TOKEN en tu .env');
}

// Ejecutar pruebas si el archivo se ejecuta directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 