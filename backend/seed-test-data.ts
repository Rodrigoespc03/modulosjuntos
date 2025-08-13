import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Organización por defecto
  let organizacion = await prisma.organizaciones.findFirst({ where: { nombre: 'Organización Demo' } });
  if (!organizacion) {
    organizacion = await prisma.organizaciones.create({
      data: {
        nombre: 'Organización Demo',
        ruc: '12345678901',
        direccion: 'Dirección Demo',
        telefono: '555-0000',
        email: 'demo@organizacion.com',
      },
    });
  }

  // Consultorio
  let consultorio = await prisma.consultorio.findFirst({ where: { 
    nombre: 'Consultorio Demo' } });
  if (!consultorio) {
    consultorio = await prisma.consultorio.create({
      data: {
        nombre: 'Consultorio Demo',
        direccion: 'Calle Falsa 123',
        organizacion_id: organizacion.id,
      },
    });
  }

  // Usuario (tiene unique en email)
  const usuario = await prisma.usuario.upsert({
    where: { email: 'demo@procura.com' },
    update: {},
    create: {
      nombre: 'Demo',
      apellido: 'User',
      rol: 'ADMINISTRADOR',
      email: 'demo@procura.com',
      telefono: '555-1234',
      consultorio_id: consultorio.id,
      organizacion_id: organizacion.id,
    },
  });

  // Paciente (no tiene unique en email, buscar manualmente)
  let paciente = await prisma.paciente.findFirst({ where: { email: 'paciente@demo.com' } });
  if (!paciente) {
    paciente = await prisma.paciente.create({
      data: {
        nombre: 'Paciente',
        apellido: 'Demo',
        fecha_nacimiento: new Date('1990-01-01'),
        genero: 'Otro',
        direccion: 'Calle Paciente 456',
        telefono: '555-5678',
        email: 'paciente@demo.com',
        organizacion_id: organizacion.id,
      },
    });
  }

  console.log('Datos de prueba insertados:');
  console.log({ consultorio, usuario, paciente });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 