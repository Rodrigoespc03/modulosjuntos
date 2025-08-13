const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Función para obtener token de autenticación
async function getToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    return response.data.token;
  } catch (error) {
    console.error('Error obteniendo token:', error.response?.data || error.message);
    return null;
  }
}

// Función para crear un cobro de prueba
async function crearCobroPrueba(token) {
  try {
    const response = await axios.post(`${BASE_URL}/cobros`, {
      paciente_id: '66df11d1-33f9-4696-9683-af9169b55128', // ID de un paciente existente
      monto: 150.00,
      concepto: 'Consulta médica de prueba',
      estado: 'PENDIENTE',
      fecha_cobro: new Date().toISOString(),
      metodo_pago: 'EFECTIVO'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Cobro creado:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando cobro:', error.response?.data || error.message);
    return null;
  }
}

// Función para editar un cobro
async function editarCobro(token, cobroId) {
  try {
    const response = await axios.put(`${BASE_URL}/cobros/${cobroId}`, {
      monto: 200.00,
      concepto: 'Consulta médica actualizada',
      estado: 'COMPLETADO'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Cobro editado:', cobroId);
    return true;
  } catch (error) {
    console.error('❌ Error editando cobro:', error.response?.data || error.message);
    return false;
  }
}

// Función para eliminar un cobro
async function eliminarCobro(token, cobroId) {
  try {
    await axios.delete(`${BASE_URL}/cobros/${cobroId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Cobro eliminado:', cobroId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando cobro:', error.response?.data || error.message);
    return false;
  }
}

// Función para verificar el historial
async function verificarHistorial(token) {
  try {
    const response = await axios.get(`${BASE_URL}/historial/general`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('📊 Historial encontrado:', response.data.length, 'registros');
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error.response?.data || error.message);
    return [];
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando prueba del sistema de historial...\n');
  
  // Obtener token
  const token = await getToken();
  if (!token) {
    console.log('❌ No se pudo obtener el token. Saliendo...');
    return;
  }
  console.log('✅ Token obtenido correctamente\n');
  
  // Verificar historial inicial
  console.log('📋 Verificando historial inicial...');
  const historialInicial = await verificarHistorial(token);
  console.log('Registros iniciales:', historialInicial.length, '\n');
  
  // Crear cobro de prueba
  console.log('➕ Creando cobro de prueba...');
  const cobroId = await crearCobroPrueba(token);
  if (!cobroId) {
    console.log('❌ No se pudo crear el cobro. Saliendo...');
    return;
  }
  
  // Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar historial después de crear
  console.log('\n📋 Verificando historial después de crear...');
  const historialDespuesCrear = await verificarHistorial(token);
  console.log('Registros después de crear:', historialDespuesCrear.length, '\n');
  
  // Editar cobro
  console.log('✏️ Editando cobro...');
  await editarCobro(token, cobroId);
  
  // Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar historial después de editar
  console.log('\n📋 Verificando historial después de editar...');
  const historialDespuesEditar = await verificarHistorial(token);
  console.log('Registros después de editar:', historialDespuesEditar.length, '\n');
  
  // Eliminar cobro
  console.log('🗑️ Eliminando cobro...');
  await eliminarCobro(token, cobroId);
  
  // Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar historial final
  console.log('\n📋 Verificando historial final...');
  const historialFinal = await verificarHistorial(token);
  console.log('Registros finales:', historialFinal.length, '\n');
  
  // Mostrar resumen
  console.log('📊 RESUMEN:');
  console.log(`- Registros iniciales: ${historialInicial.length}`);
  console.log(`- Registros después de crear: ${historialDespuesCrear.length}`);
  console.log(`- Registros después de editar: ${historialDespuesEditar.length}`);
  console.log(`- Registros finales: ${historialFinal.length}`);
  
  if (historialFinal.length > historialInicial.length) {
    console.log('\n🎉 ¡El sistema de historial está funcionando correctamente!');
  } else {
    console.log('\n❌ El sistema de historial no está registrando cambios.');
  }
}

// Ejecutar el script
main().catch(console.error); 
 
 