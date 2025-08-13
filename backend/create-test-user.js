const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndCreateUser() {
  try {
    console.log('Verificando usuarios existentes...');
    
    // Verificar si existe alguna organización
    const organizaciones = await prisma.organizaciones.findMany();
    console.log('Organizaciones encontradas:', organizaciones.length);
    
    if (organizaciones.length === 0) {
      console.log('Creando organización de prueba...');
      const organizacion = await prisma.organizaciones.create({
        data: {
          nombre: 'Clínica de Prueba',
          direccion: 'Dirección de prueba',
          telefono: '123456789',
          email: 'test@clinica.com'
        }
      });
      console.log('Organización creada:', organizacion);
    }
    
    // Verificar si existe algún consultorio
    const consultorios = await prisma.consultorio.findMany();
    console.log('Consultorios encontrados:', consultorios.length);
    
    if (consultorios.length === 0) {
      console.log('Creando consultorio de prueba...');
      const consultorio = await prisma.consultorio.create({
        data: {
          nombre: 'Consultorio Principal',
          direccion: 'Dirección del consultorio',
          telefono: '123456789',
          organizacion_id: organizaciones[0]?.id || 1
        }
      });
      console.log('Consultorio creado:', consultorio);
    }
    
    // Verificar usuarios existentes
    const usuarios = await prisma.usuario.findMany();
    console.log('Usuarios encontrados:', usuarios.length);
    
    if (usuarios.length === 0) {
      console.log('Creando usuario de prueba...');
      const usuario = await prisma.usuario.create({
        data: {
          nombre: 'Dr. García',
          apellido: 'Test',
          email: 'dr.garcia@clinica.com',
          password: '123456',
          rol: 'ADMIN',
          telefono: '123456789',
          consultorio_id: consultorios[0]?.id || 1,
          organizacion_id: organizaciones[0]?.id || 1
        }
      });
      console.log('Usuario creado:', usuario);
    } else {
      console.log('Usuarios existentes:');
      usuarios.forEach(user => {
        console.log(`- ${user.nombre} ${user.apellido} (${user.email}) - Rol: ${user.rol}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateUser(); 