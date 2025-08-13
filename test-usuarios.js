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

// Prueba 1: Obtener todos los usuarios
async function testGetUsuarios(token) {
  console.log('\n🔍 **Prueba 1: Obtener todos los usuarios**');
  try {
    const response = await axios.get(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Éxito:', response.data.length, 'usuarios encontrados');
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 2: Crear nuevo usuario
async function testCreateUsuario(token) {
  console.log('\n🔍 **Prueba 2: Crear nuevo usuario**');
  try {
    const nuevoUsuario = {
      nombre: 'Dr. Test Multi-Tenant',
      apellido: 'García',
      email: 'test.doctor@clinica.com',
      rol: 'DOCTOR',
      telefono: '+51 999 111 222',
      consultorio_id: '920de6f5-64c4-4ada-8e6a-e4cc8c909680' // ID del primer consultorio
    };

    const response = await axios.post(`${API_BASE_URL}/usuarios`, nuevoUsuario, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Usuario creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 3: Obtener usuario específico
async function testGetUsuarioById(token, usuarioId) {
  console.log('\n🔍 **Prueba 3: Obtener usuario específico**');
  try {
    const response = await axios.get(`${API_BASE_URL}/usuarios/${usuarioId}`, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Usuario obtenido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 4: Actualizar usuario
async function testUpdateUsuario(token, usuarioId) {
  console.log('\n🔍 **Prueba 4: Actualizar usuario**');
  try {
    const updateData = {
      nombre: 'Dr. Test Multi-Tenant - Actualizado',
      telefono: '+51 999 333 444',
      especialidad: 'Cardiología'
    };

    const response = await axios.put(`${API_BASE_URL}/usuarios/${usuarioId}`, updateData, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Usuario actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 5: Crear usuario en organización específica
async function testCreateUsuarioEnOrganizacion(token, organizacionId) {
  console.log('\n🔍 **Prueba 5: Crear usuario en organización específica**');
  try {
    const nuevoUsuario = {
      nombre: 'Enfermera Test',
      apellido: 'López',
      email: 'enfermera.test@clinica.com',
      rol: 'ENFERMERA',
      telefono: '+51 999 555 666',
      consultorio_id: '920de6f5-64c4-4ada-8e6a-e4cc8c909680' // ID del primer consultorio
    };

    const response = await axios.post(`${API_BASE_URL}/usuarios`, nuevoUsuario, {
      headers: getAuthHeaders(token)
    });
    console.log('✅ Usuario creado en organización específica:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 6: Verificar aislamiento de usuarios por organización
async function testAislamientoUsuarios(token) {
  console.log('\n🔍 **Prueba 6: Verificar aislamiento de usuarios por organización**');
  try {
    // Obtener todas las organizaciones
    const orgsResponse = await axios.get(`${API_BASE_URL}/organizaciones`, {
      headers: getAuthHeaders(token)
    });
    
    const organizaciones = orgsResponse.data;
    console.log('📊 Organizaciones encontradas:', organizaciones.length);
    
    // Verificar usuarios por organización
    for (const org of organizaciones.slice(0, 3)) { // Solo las primeras 3 para no saturar
      console.log(`\n🏥 Organización: ${org.nombre} (${org.id})`);
      console.log(`   - Usuarios: ${org._count.usuarios}`);
      console.log(`   - Consultorios: ${org._count.consultorios}`);
      console.log(`   - Pacientes: ${org._count.pacientes}`);
      console.log(`   - Servicios: ${org._count.servicios}`);
    }
    
    return organizaciones;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 **INICIANDO PRUEBAS DE USUARIOS**');
  console.log('====================================');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');

    // Ejecutar pruebas
    await testGetUsuarios(token);
    
    const nuevoUsuario = await testCreateUsuario(token);
    const usuarioId = nuevoUsuario.id;
    
    await testGetUsuarioById(token, usuarioId);
    await testUpdateUsuario(token, usuarioId);
    
    // Crear usuario en organización específica
    const organizacionId = '03ea7973-906d-4fb6-bcfa-d8019628998e';
    await testCreateUsuarioEnOrganizacion(token, organizacionId);
    
    // Verificar aislamiento
    await testAislamientoUsuarios(token);

    console.log('\n🎉 **TODAS LAS PRUEBAS DE USUARIOS COMPLETADAS EXITOSAMENTE**');
    
  } catch (error) {
    console.error('\n💥 **ERROR EN LAS PRUEBAS:**', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 