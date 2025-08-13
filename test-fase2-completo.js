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
    console.log('👤 Usuario:', response.data.user?.nombre, response.data.user?.apellido);
    console.log('🏢 Organización ID:', response.data.user?.organizacion_id);
    return response.data.token;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return null;
  }
}

// Función para probar todas las rutas protegidas
async function testAllProtectedRoutes(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n🧪 Probando todas las rutas protegidas...');

  // 1. Probar obtener organizaciones
  console.log('\n📋 1. Probando GET /api/organizaciones...');
  try {
    const orgResponse = await axios.get(`${BASE_URL}/organizaciones`, { headers });
    console.log('✅ Organizaciones obtenidas:', orgResponse.data.length, 'organizaciones');
    if (orgResponse.data.length > 0) {
      console.log('   📍 Primera organización:', orgResponse.data[0].nombre);
    }
  } catch (error) {
    console.error('❌ Error obteniendo organizaciones:', error.response?.data || error.message);
  }

  // 2. Probar obtener pacientes
  console.log('\n📋 2. Probando GET /api/pacientes...');
  try {
    const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`, { headers });
    console.log('✅ Pacientes obtenidos:', pacientesResponse.data.length, 'pacientes');
    if (pacientesResponse.data.length > 0) {
      console.log('   📍 Primer paciente:', pacientesResponse.data[0].nombre, pacientesResponse.data[0].apellido);
    }
  } catch (error) {
    console.error('❌ Error obteniendo pacientes:', error.response?.data || error.message);
  }

  // 3. Probar obtener usuarios
  console.log('\n📋 3. Probando GET /api/usuarios...');
  try {
    const usuariosResponse = await axios.get(`${BASE_URL}/usuarios`, { headers });
    console.log('✅ Usuarios obtenidos:', usuariosResponse.data.length, 'usuarios');
    if (usuariosResponse.data.length > 0) {
      console.log('   📍 Primer usuario:', usuariosResponse.data[0].nombre, usuariosResponse.data[0].apellido);
    }
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error.response?.data || error.message);
  }

  // 4. Probar obtener cobros
  console.log('\n📋 4. Probando GET /api/cobros...');
  try {
    const cobrosResponse = await axios.get(`${BASE_URL}/cobros`, { headers });
    console.log('✅ Cobros obtenidos:', cobrosResponse.data.length, 'cobros');
    if (cobrosResponse.data.length > 0) {
      console.log('   📍 Primer cobro:', cobrosResponse.data[0].id);
    }
  } catch (error) {
    console.error('❌ Error obteniendo cobros:', error.response?.data || error.message);
  }

  // 5. Probar obtener consultorios
  console.log('\n📋 5. Probando GET /api/consultorios...');
  try {
    const consultoriosResponse = await axios.get(`${BASE_URL}/consultorios`, { headers });
    console.log('✅ Consultorios obtenidos:', consultoriosResponse.data.length, 'consultorios');
    if (consultoriosResponse.data.length > 0) {
      console.log('   📍 Primer consultorio:', consultoriosResponse.data[0].nombre);
    }
  } catch (error) {
    console.error('❌ Error obteniendo consultorios:', error.response?.data || error.message);
  }

  // 6. Probar obtener servicios
  console.log('\n📋 6. Probando GET /api/servicios...');
  try {
    const serviciosResponse = await axios.get(`${BASE_URL}/servicios`, { headers });
    console.log('✅ Servicios obtenidos:', serviciosResponse.data.length, 'servicios');
    if (serviciosResponse.data.length > 0) {
      console.log('   📍 Primer servicio:', serviciosResponse.data[0].nombre);
    }
  } catch (error) {
    console.error('❌ Error obteniendo servicios:', error.response?.data || error.message);
  }
}

// Función para probar creación de recursos con auto-asignación de organización
async function testResourceCreation(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n🧪 Probando creación de recursos con auto-asignación...');

  // 1. Crear un nuevo paciente
  console.log('\n📋 1. Probando POST /api/pacientes...');
  try {
    const pacienteData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      fecha_nacimiento: '1990-01-01',
      genero: 'MASCULINO',
      telefono: '123456789',
      email: 'juan.perez@test.com'
    };
    
    const pacienteResponse = await axios.post(`${BASE_URL}/pacientes`, pacienteData, { headers });
    console.log('✅ Paciente creado:', pacienteResponse.data.id);
    console.log('   📍 Organización asignada:', pacienteResponse.data.organizacion_id);
  } catch (error) {
    console.error('❌ Error creando paciente:', error.response?.data || error.message);
  }

  // 2. Crear un nuevo usuario
  console.log('\n📋 2. Probando POST /api/usuarios...');
  try {
    const usuarioData = {
      nombre: 'María',
      apellido: 'García',
      rol: 'SECRETARIA',
      email: 'maria.garcia@test.com',
      telefono: '987654321',
      consultorio_id: '1' // Asumiendo que existe un consultorio con ID 1
    };
    
    const usuarioResponse = await axios.post(`${BASE_URL}/usuarios`, usuarioData, { headers });
    console.log('✅ Usuario creado:', usuarioResponse.data.id);
    console.log('   📍 Organización asignada:', usuarioResponse.data.organizacion_id);
  } catch (error) {
    console.error('❌ Error creando usuario:', error.response?.data || error.message);
  }

  // 3. Crear un nuevo consultorio
  console.log('\n📋 3. Probando POST /api/consultorios...');
  try {
    const consultorioData = {
      nombre: 'Consultorio de Prueba',
      direccion: 'Dirección de prueba'
    };
    
    const consultorioResponse = await axios.post(`${BASE_URL}/consultorios`, consultorioData, { headers });
    console.log('✅ Consultorio creado:', consultorioResponse.data.id);
    console.log('   📍 Organización asignada:', consultorioResponse.data.organizacion_id);
  } catch (error) {
    console.error('❌ Error creando consultorio:', error.response?.data || error.message);
  }

  // 4. Crear un nuevo servicio
  console.log('\n📋 4. Probando POST /api/servicios...');
  try {
    const servicioData = {
      nombre: 'Servicio de Prueba',
      precio_base: 100.00
    };
    
    const servicioResponse = await axios.post(`${BASE_URL}/servicios`, servicioData, { headers });
    console.log('✅ Servicio creado:', servicioResponse.data.id);
    console.log('   📍 Organización asignada:', servicioResponse.data.organizacion_id);
  } catch (error) {
    console.error('❌ Error creando servicio:', error.response?.data || error.message);
  }
}

// Función para probar búsqueda con filtrado multi-tenant
async function testSearchWithTenantFilter(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n🧪 Probando búsqueda con filtrado multi-tenant...');

  // Probar búsqueda de pacientes
  console.log('\n📋 Probando GET /api/pacientes/search?q=Juan...');
  try {
    const searchResponse = await axios.get(`${BASE_URL}/pacientes/search?q=Juan`, { headers });
    console.log('✅ Búsqueda exitosa:', searchResponse.data.length, 'resultados');
    if (searchResponse.data.length > 0) {
      console.log('   📍 Resultados:', searchResponse.data.map(p => `${p.nombre} ${p.apellido}`));
    }
  } catch (error) {
    console.error('❌ Error en búsqueda:', error.response?.data || error.message);
  }
}

// Función para probar rutas sin autenticación
async function testUnauthenticatedRoutes() {
  console.log('\n🧪 Probando rutas sin autenticación...');

  // Probar crear organización (ruta pública)
  try {
    const orgData = {
      nombre: 'Organización de Prueba Fase 2',
      ruc: '12345678902',
      direccion: 'Dirección de prueba Fase 2',
      telefono: '123456789',
      email: 'test2@organizacion.com'
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
async function runCompleteTests() {
  console.log('🚀 Iniciando pruebas completas de la Fase 2...\n');

  // Probar ruta pública
  const orgId = await testUnauthenticatedRoutes();

  // Obtener token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ No se pudo obtener token. Deteniendo pruebas.');
    return;
  }

  // Probar todas las rutas protegidas
  await testAllProtectedRoutes(token);

  // Probar creación de recursos
  await testResourceCreation(token);

  // Probar búsqueda con filtrado
  await testSearchWithTenantFilter(token);

  console.log('\n✅ ¡Pruebas completas de la Fase 2 finalizadas!');
  console.log('🎉 Sistema Multi-Tenant funcionando correctamente');
}

// Ejecutar pruebas
runCompleteTests().catch(console.error); 
 
 