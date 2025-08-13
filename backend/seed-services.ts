import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  // Crear organización por defecto si no existe
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

  const services = [
    {
      nombre: 'Consulta General',
      descripcion: 'Consulta médica general',
      precio_base: 50.00,
      organizacion_id: organizacion.id
    },
    {
      nombre: 'Consulta Especializada',
      descripcion: 'Consulta con especialista',
      precio_base: 80.00,
      organizacion_id: organizacion.id
    },
    {
      nombre: 'Examen de Laboratorio',
      descripcion: 'Análisis de sangre básico',
      precio_base: 25.00,
      organizacion_id: organizacion.id
    },
    {
      nombre: 'Radiografía',
      descripcion: 'Radiografía simple',
      precio_base: 45.00,
      organizacion_id: organizacion.id
    },
    {
      nombre: 'Ecografía',
      descripcion: 'Ecografía abdominal',
      precio_base: 120.00,
      organizacion_id: organizacion.id
    }
  ];

  for (const service of services) {
    // Verificar si el servicio ya existe
    const existingService = await prisma.servicio.findFirst({
      where: { nombre: service.nombre }
    });
    
    if (!existingService) {
      await prisma.servicio.create({
        data: service
      });
    }
  }

  console.log('Servicios insertados correctamente');
}

seedServices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 