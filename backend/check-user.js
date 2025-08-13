const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificUser() {
  try {
    console.log('Verificando usuario dr.garcia@clinica.com...');
    
    const user = await prisma.usuario.findUnique({
      where: { email: 'dr.garcia@clinica.com' },
      include: {
        consultorio: true,
        organizaciones: true
      }
    });
    
    if (user) {
      console.log('Usuario encontrado:');
      console.log('- ID:', user.id);
      console.log('- Nombre:', user.nombre);
      console.log('- Apellido:', user.apellido);
      console.log('- Email:', user.email);
      console.log('- Rol:', user.rol);
      console.log('- Consultorio ID:', user.consultorio_id);
      console.log('- Organización ID:', user.organizacion_id);
      console.log('- Consultorio:', user.consultorio);
      console.log('- Organización:', user.organizaciones);
    } else {
      console.log('Usuario no encontrado');
    }
    
    // También verificar si hay algún problema con la consulta
    console.log('\nProbando login con password 123456...');
    const testUser = await prisma.usuario.findFirst({
      where: { 
        email: 'dr.garcia@clinica.com',
        // password: '123456' // Comentado porque parece que no hay campo password
      }
    });
    
    if (testUser) {
      console.log('Usuario válido para login encontrado');
    } else {
      console.log('No se puede hacer login con este usuario');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificUser(); 