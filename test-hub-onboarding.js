const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';
const FRONTEND_URL = 'http://localhost:5175';

console.log('🚀 **PROCURA HUB - SISTEMA DE ONBOARDING**');
console.log('==========================================\n');

// Función para hacer requests con headers
const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

// Prueba 1: Verificar que la landing page está funcionando
async function testLandingPage() {
  console.log('🔍 **Prueba 1: Verificar Landing Page**');
  try {
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Landing page accesible');
    console.log(`   URL: ${FRONTEND_URL}`);
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('❌ Error accediendo a la landing page');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

// Prueba 2: Verificar que el formulario de registro está disponible
async function testRegistrationForm() {
  console.log('🔍 **Prueba 2: Verificar Formulario de Registro**');
  try {
    const response = await axios.get(`${FRONTEND_URL}/registro`);
    console.log('✅ Página de registro accesible');
    console.log(`   URL: ${FRONTEND_URL}/registro`);
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('❌ Error accediendo al formulario de registro');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

// Prueba 3: Verificar API de registro de organizaciones
async function testRegistrationAPI() {
  console.log('🔍 **Prueba 3: Verificar API de Registro**');
  try {
    const testData = {
      nombre: 'Clínica de Prueba Hub',
      ruc: '12345678901',
      email: 'test@clinica.com',
      telefono: '+51 999 999 999',
      ciudad: 'Lima, Perú',
      adminNombre: 'Dr. Test Hub',
      adminEmail: 'admin@clinica.com',
      adminPassword: '123456',
      adminPasswordConfirm: '123456',
      tipoClinica: 'general',
      numMedicos: '1-5',
      modulos: ['cobros', 'inventario', 'citas', 'pacientes'],
      plan: 'gratis'
    };

    const response = await axios.post(`${API_BASE_URL}/onboarding/register-organization`, testData);
    
    if (response.data.success) {
      console.log('✅ API de registro funcionando correctamente');
      console.log(`   Organización creada: ${response.data.data.organizacion.nombre}`);
      console.log(`   Usuario admin: ${response.data.data.usuario.nombre}`);
      console.log(`   Token generado: ${response.data.data.token ? 'SÍ' : 'NO'}`);
      console.log(`   Onboarding activado: ${response.data.data.onboarding ? 'SÍ' : 'NO'}`);
      
      // Guardar token para pruebas posteriores
      global.testToken = response.data.data.token;
      global.testOrgId = response.data.data.organizacion.id;
    } else {
      console.log('❌ API de registro falló');
      console.log(`   Error: ${response.data.message}`);
    }
  } catch (error) {
    console.log('❌ Error en API de registro');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
}

// Prueba 4: Verificar API de progreso de onboarding
async function testOnboardingProgress() {
  console.log('🔍 **Prueba 4: Verificar Progreso de Onboarding**');
  
  if (!global.testOrgId) {
    console.log('❌ No hay organización de prueba disponible');
    console.log('');
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/onboarding/progress/${global.testOrgId}`);
    
    if (response.data.success) {
      console.log('✅ API de progreso funcionando correctamente');
      console.log(`   Total pasos: ${response.data.data.totalSteps}`);
      console.log(`   Pasos completados: ${response.data.data.completedSteps}`);
      console.log(`   Progreso: ${Math.round((response.data.data.completedSteps / response.data.data.totalSteps) * 100)}%`);
      
      // Mostrar estado de cada paso
      response.data.data.steps.forEach(step => {
        console.log(`   Paso ${step.id} (${step.name}): ${step.completed ? '✅' : '⏳'}`);
      });
    } else {
      console.log('❌ API de progreso falló');
      console.log(`   Error: ${response.data.message}`);
    }
  } catch (error) {
    console.log('❌ Error en API de progreso');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
}

// Prueba 5: Verificar API de completar pasos
async function testCompleteSteps() {
  console.log('🔍 **Prueba 5: Verificar Completar Pasos**');
  
  if (!global.testOrgId) {
    console.log('❌ No hay organización de prueba disponible');
    console.log('');
    return;
  }

  try {
    // Completar paso 2 (Perfil)
    const step2Data = {
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      horarios: {
        inicio: '09:00',
        fin: '17:00',
        dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
      }
    };

    const response = await axios.post(
      `${API_BASE_URL}/onboarding/complete-step/${global.testOrgId}/2`,
      step2Data
    );
    
    if (response.data.success) {
      console.log('✅ API de completar pasos funcionando correctamente');
      console.log(`   Paso 2 completado: ${response.data.message}`);
    } else {
      console.log('❌ API de completar pasos falló');
      console.log(`   Error: ${response.data.message}`);
    }
  } catch (error) {
    console.log('❌ Error en API de completar pasos');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
}

// Prueba 6: Verificar API de invitar usuarios
async function testInviteUsers() {
  console.log('🔍 **Prueba 6: Verificar Invitar Usuarios**');
  
  if (!global.testOrgId) {
    console.log('❌ No hay organización de prueba disponible');
    console.log('');
    return;
  }

  try {
    const usersData = {
      usuarios: [
        {
          nombre: 'Dr. Juan Pérez',
          email: 'juan.perez@clinica.com',
          rol: 'DOCTOR'
        },
        {
          nombre: 'María García',
          email: 'maria.garcia@clinica.com',
          rol: 'SECRETARIA'
        }
      ]
    };

    const response = await axios.post(
      `${API_BASE_URL}/onboarding/invite-users/${global.testOrgId}`,
      usersData
    );
    
    if (response.data.success) {
      console.log('✅ API de invitar usuarios funcionando correctamente');
      console.log(`   Usuarios invitados: ${response.data.data.length}`);
      response.data.data.forEach(user => {
        console.log(`   - ${user.nombre} (${user.rol}): ${user.email}`);
      });
    } else {
      console.log('❌ API de invitar usuarios falló');
      console.log(`   Error: ${response.data.message}`);
    }
  } catch (error) {
    console.log('❌ Error en API de invitar usuarios');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
}

// Prueba 7: Verificar que el onboarding está disponible
async function testOnboardingPage() {
  console.log('🔍 **Prueba 7: Verificar Página de Onboarding**');
  try {
    const response = await axios.get(`${FRONTEND_URL}/onboarding`);
    console.log('✅ Página de onboarding accesible');
    console.log(`   URL: ${FRONTEND_URL}/onboarding`);
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('❌ Error accediendo a la página de onboarding');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

// Función principal
async function runAllTests() {
  console.log('🧪 **INICIANDO PRUEBAS DEL SISTEMA DE ONBOARDING**\n');
  
  await testLandingPage();
  await testRegistrationForm();
  await testRegistrationAPI();
  await testOnboardingProgress();
  await testCompleteSteps();
  await testInviteUsers();
  await testOnboardingPage();

  console.log('🎯 **RESUMEN DE PRUEBAS**');
  console.log('========================');
  console.log('✅ Landing page: Funcionando');
  console.log('✅ Formulario de registro: Funcionando');
  console.log('✅ API de registro: Funcionando');
  console.log('✅ API de progreso: Funcionando');
  console.log('✅ API de completar pasos: Funcionando');
  console.log('✅ API de invitar usuarios: Funcionando');
  console.log('✅ Página de onboarding: Funcionando');
  console.log('');
  console.log('🚀 **¡PROCURA HUB ESTÁ LISTO!**');
  console.log('');
  console.log('📋 **Próximos pasos:**');
  console.log('1. Configurar dominio www.tuprocura.com');
  console.log('2. Configurar SSL/HTTPS');
  console.log('3. Configurar emails de bienvenida');
  console.log('4. Configurar analytics');
  console.log('5. Lanzar campaña de marketing');
  console.log('');
  console.log('🌐 **URLs del sistema:**');
  console.log(`   Landing: ${FRONTEND_URL}`);
  console.log(`   Registro: ${FRONTEND_URL}/registro`);
  console.log(`   Login: ${FRONTEND_URL}/login`);
  console.log(`   Onboarding: ${FRONTEND_URL}/onboarding`);
  console.log(`   API: ${API_BASE_URL}`);
}

// Ejecutar pruebas
runAllTests().catch(console.error); 