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

// Obtener consultorios
async function getConsultorios(token) {
  console.log('\n🔍 **Obteniendo consultorios disponibles**');
  try {
    const response = await axios.get(`${API_BASE_URL}/consultorios`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Consultorios encontrados:', response.data.length);
    response.data.forEach(consultorio => {
      console.log(`   - ID: ${consultorio.id}, Nombre: ${consultorio.nombre}`);
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal
async function runTest() {
  console.log('🚀 **OBTENIENDO CONSULTORIOS**');
  console.log('==============================');

  try {
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');
    
    const consultorios = await getConsultorios(token);
    
    if (consultorios.length > 0) {
      console.log('\n🎯 **ID del primer consultorio para usar en pruebas:**', consultorios[0].id);
    }
    
  } catch (error) {
    console.error('\n💥 **ERROR:**', error.message);
  }
}

runTest(); 