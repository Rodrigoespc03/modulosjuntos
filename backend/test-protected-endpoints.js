const axios = require('axios');

async function testProtectedEndpoints() {
  try {
    // 1. Hacer login para obtener token
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3002/api/login', {
      email: 'dr.garcia@clinica.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtenido:', token.substring(0, 50) + '...');
    
    // 2. Probar endpoint GET de cobros (público)
    console.log('\n2. Probando GET /api/cobros (público)...');
    const cobrosResponse = await axios.get('http://localhost:3002/api/cobros');
    console.log('Cobros obtenidos:', cobrosResponse.data.length);
    
    // 3. Probar endpoint PUT de cobros (protegido)
    console.log('\n3. Probando PUT /api/cobros (protegido)...');
    try {
      const updateResponse = await axios.put('http://localhost:3002/api/cobros/test-id', {
        estado: 'COMPLETADO'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('PUT exitoso:', updateResponse.status);
    } catch (error) {
      console.log('Error en PUT:', error.response?.status, error.response?.data?.error);
    }
    
    // 4. Probar endpoint DELETE de cobros (protegido)
    console.log('\n4. Probando DELETE /api/cobros (protegido)...');
    try {
      const deleteResponse = await axios.delete('http://localhost:3002/api/cobros/test-id', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('DELETE exitoso:', deleteResponse.status);
    } catch (error) {
      console.log('Error en DELETE:', error.response?.status, error.response?.data?.error);
    }
    
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

testProtectedEndpoints(); 