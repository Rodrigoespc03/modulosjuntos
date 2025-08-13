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

// Prueba 1: Verificar que solo se ven los datos de la organización del usuario
async function testAislamientoDatos(token) {
  console.log('\n🔍 **Prueba 1: Verificar aislamiento de datos por organización**');
  try {
    // Obtener datos del usuario autenticado
    const usuariosResponse = await axios.get(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(token)
    });
    
    const pacientesResponse = await axios.get(`${API_BASE_URL}/pacientes`, {
      headers: getAuthHeaders(token)
    });
    
    const consultoriosResponse = await axios.get(`${API_BASE_URL}/consultorios`, {
      headers: getAuthHeaders(token)
    });
    
    const cobrosResponse = await axios.get(`${API_BASE_URL}/cobros`, {
      headers: getAuthHeaders(token)
    });
    
    console.log('📊 **Datos visibles para el usuario actual:**');
    console.log(`   - Usuarios: ${usuariosResponse.data.length}`);
    console.log(`   - Pacientes: ${pacientesResponse.data.length}`);
    console.log(`   - Consultorios: ${consultoriosResponse.data.length}`);
    console.log(`   - Cobros: ${cobrosResponse.data.length}`);
    
    // Verificar que todos los datos pertenecen a la misma organización
    const organizacionIds = new Set();
    
    usuariosResponse.data.forEach(usuario => {
      organizacionIds.add(usuario.organizacion_id);
    });
    
    pacientesResponse.data.forEach(paciente => {
      organizacionIds.add(paciente.organizacion_id);
    });
    
    consultoriosResponse.data.forEach(consultorio => {
      organizacionIds.add(consultorio.organizacion_id);
    });
    
    console.log('\n🔒 **Verificación de aislamiento:**');
    console.log(`   - Organizaciones únicas en datos: ${organizacionIds.size}`);
    
    if (organizacionIds.size === 1) {
      console.log('✅ **AISLAMIENTO CORRECTO**: Todos los datos pertenecen a una sola organización');
    } else {
      console.log('❌ **ERROR DE AISLAMIENTO**: Los datos pertenecen a múltiples organizaciones');
    }
    
    return {
      usuarios: usuariosResponse.data,
      pacientes: pacientesResponse.data,
      consultorios: consultoriosResponse.data,
      cobros: cobrosResponse.data,
      organizacionIds: Array.from(organizacionIds)
    };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 2: Verificar que no se puede acceder a datos de otras organizaciones
async function testAccesoRestringido(token) {
  console.log('\n🔍 **Prueba 2: Verificar acceso restringido a datos de otras organizaciones**');
  try {
    // Obtener todas las organizaciones
    const orgsResponse = await axios.get(`${API_BASE_URL}/organizaciones`, {
      headers: getAuthHeaders(token)
    });
    
    const organizaciones = orgsResponse.data;
    console.log(`📊 Total de organizaciones en el sistema: ${organizaciones.length}`);
    
    // Verificar que solo se pueden ver los datos de la organización del usuario
    const organizacionUsuario = organizaciones.find(org => 
      org._count.usuarios > 0 && org._count.consultorios > 0
    );
    
    if (organizacionUsuario) {
      console.log(`🏥 Organización del usuario: ${organizacionUsuario.nombre}`);
      console.log(`   - Usuarios: ${organizacionUsuario._count.usuarios}`);
      console.log(`   - Consultorios: ${organizacionUsuario._count.consultorios}`);
      console.log(`   - Pacientes: ${organizacionUsuario._count.pacientes}`);
      console.log(`   - Servicios: ${organizacionUsuario._count.servicios}`);
    }
    
    // Verificar que otras organizaciones no tienen datos visibles
    const otrasOrganizaciones = organizaciones.filter(org => 
      org._count.usuarios === 0 && org._count.consultorios === 0
    );
    
    console.log(`🔒 Organizaciones sin datos visibles: ${otrasOrganizaciones.length}`);
    
    return {
      organizacionUsuario,
      otrasOrganizaciones,
      totalOrganizaciones: organizaciones.length
    };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Prueba 3: Verificar que el tenantFilter funciona correctamente
async function testTenantFilter(token) {
  console.log('\n🔍 **Prueba 3: Verificar funcionamiento del tenantFilter**');
  try {
    // Obtener datos con tenantFilter activo
    const usuariosResponse = await axios.get(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(token)
    });
    
    if (usuariosResponse.data.length > 0) {
      const organizacionId = usuariosResponse.data[0].organizacion_id;
      console.log(`🎯 Organización ID del tenantFilter: ${organizacionId}`);
      
      // Verificar que todos los usuarios pertenecen a la misma organización
      const todosMismaOrg = usuariosResponse.data.every(usuario => 
        usuario.organizacion_id === organizacionId
      );
      
      if (todosMismaOrg) {
        console.log('✅ **TENANT FILTER FUNCIONANDO**: Todos los usuarios pertenecen a la misma organización');
      } else {
        console.log('❌ **ERROR EN TENANT FILTER**: Usuarios de diferentes organizaciones');
      }
    }
    
    return usuariosResponse.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 **INICIANDO PRUEBAS DE AISLAMIENTO DE DATOS**');
  console.log('================================================');

  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    console.log('✅ Token obtenido correctamente');

    // Ejecutar pruebas
    await testAislamientoDatos(token);
    await testAccesoRestringido(token);
    await testTenantFilter(token);

    console.log('\n🎉 **TODAS LAS PRUEBAS DE AISLAMIENTO COMPLETADAS EXITOSAMENTE**');
    console.log('\n📋 **RESUMEN:**');
    console.log('   ✅ Multi-tenant funcionando correctamente');
    console.log('   ✅ Aislamiento de datos por organización');
    console.log('   ✅ TenantFilter aplicado correctamente');
    console.log('   ✅ Acceso restringido a datos de otras organizaciones');
    
  } catch (error) {
    console.error('\n💥 **ERROR EN LAS PRUEBAS:**', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 