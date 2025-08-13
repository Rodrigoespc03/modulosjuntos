import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';

describe('Migrated Controllers Integration Tests', () => {
  
  let testConsultorio: any;
  let testUsuario: any;
  let testPaciente: any;
  let testServicio: any;

  beforeAll(async () => {
    // Crear datos de prueba necesarios
    testConsultorio = await prisma.consultorio.create({
      data: {
        nombre: 'Consultorio Test',
        direccion: 'Dirección Test'
      }
    });

    testUsuario = await prisma.usuario.create({
      data: {
        nombre: 'Usuario Test',
        apellido: 'Apellido Test',
        email: 'usuario@test.com',
        telefono: '1234567890',
        rol: 'DOCTOR',
        consultorio_id: testConsultorio.id
      }
    });

    testPaciente = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Test',
        apellido: 'Apellido Test',
        fecha_nacimiento: new Date('1990-01-01'),
        genero: 'M',
        telefono: '1234567890',
        email: 'paciente@test.com'
      }
    });

    testServicio = await prisma.servicio.create({
      data: {
        nombre: 'Servicio Test',
        descripcion: 'Descripción del servicio',
        precio_base: 100.00
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Usuario Controller - Validaciones Migradas', () => {
    const validUsuario = {
      nombre: 'Nuevo Usuario',
      apellido: 'Nuevo Apellido',
      email: 'nuevo@test.com',
      telefono: '9876543210',
      rol: 'SECRETARIA',
      consultorio_id: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('debe crear un usuario con datos válidos', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send(validUsuario)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe(validUsuario.nombre);
      expect(response.body.email).toBe(validUsuario.email);
    });

    it('debe rechazar un usuario con email inválido', async () => {
      const invalidUsuario = { ...validUsuario, email: 'email-invalido' };
      
      const response = await request(app)
        .post('/api/usuarios')
        .send(invalidUsuario)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('formato válido');
    });

    it('debe rechazar un usuario sin nombre', async () => {
      const invalidUsuario = { ...validUsuario, nombre: '' };
      
      const response = await request(app)
        .post('/api/usuarios')
        .send(invalidUsuario)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('al menos 2 caracteres');
    });

    it('debe actualizar un usuario con datos válidos', async () => {
      const updateData = { nombre: 'Usuario Actualizado' };
      
      const response = await request(app)
        .put(`/api/usuarios/${testUsuario.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.nombre).toBe(updateData.nombre);
    });

    it('debe obtener un usuario por ID válido', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${testUsuario.id}`)
        .expect(200);

      expect(response.body.id).toBe(testUsuario.id);
      expect(response.body.nombre).toBe(testUsuario.nombre);
    });

    it('debe rechazar un ID inválido', async () => {
      const response = await request(app)
        .get('/api/usuarios/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('UUID válido');
    });
  });

  describe('Paciente Controller - Validaciones Migradas', () => {
    const validPaciente = {
      nombre: 'Nuevo Paciente',
      apellido: 'Nuevo Apellido',
      fecha_nacimiento: '1995-05-15T00:00:00.000Z',
      genero: 'F',
      telefono: '9876543210',
      email: 'nuevo@paciente.com'
    };

    it('debe crear un paciente con datos válidos', async () => {
      const response = await request(app)
        .post('/api/pacientes')
        .send(validPaciente)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe(validPaciente.nombre);
    });

    it('debe rechazar un paciente con teléfono inválido', async () => {
      const invalidPaciente = { ...validPaciente, telefono: '123' };
      
      const response = await request(app)
        .post('/api/pacientes')
        .send(invalidPaciente)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('al menos 7 dígitos');
    });
  });

  describe('Cobro Controller - Validaciones Migradas', () => {
    const validCobro = {
      paciente_id: testPaciente.id,
      usuario_id: testUsuario.id,
      fecha_cobro: new Date().toISOString(),
      monto_total: 150.50,
      estado: 'PENDIENTE',
      pagos: [
        { metodo: 'EFECTIVO', monto: 100.50 },
        { metodo: 'TARJETA_DEBITO', monto: 50.00 }
      ]
    };

    it('debe crear un cobro con datos válidos', async () => {
      const response = await request(app)
        .post('/api/cobros')
        .send(validCobro)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.monto_total).toBe(validCobro.monto_total);
    });

    it('debe rechazar un cobro cuando la suma de pagos no coincide', async () => {
      const invalidCobro = {
        ...validCobro,
        monto_total: 200.00,
        pagos: [{ metodo: 'EFECTIVO', monto: 100.00 }]
      };
      
      const response = await request(app)
        .post('/api/cobros')
        .send(invalidCobro)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('suma de los métodos de pago');
    });

    it('debe rechazar un cobro con monto negativo', async () => {
      const invalidCobro = { ...validCobro, monto_total: -50 };
      
      const response = await request(app)
        .post('/api/cobros')
        .send(invalidCobro)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('positivo');
    });
  });

  describe('Cita Controller - Validaciones Migradas', () => {
    const validCita = {
      titulo: 'Consulta Test',
      descripcion: 'Descripción de la consulta',
      estado: 'PROGRAMADA',
      paciente_id: testPaciente.id,
      usuario_id: testUsuario.id,
      consultorio_id: testConsultorio.id,
      fecha_inicio: new Date(Date.now() + 86400000).toISOString(), // Mañana
      fecha_fin: new Date(Date.now() + 86400000 + 3600000).toISOString() // Mañana + 1 hora
    };

    it('debe crear una cita con datos válidos', async () => {
      const response = await request(app)
        .post('/api/citas')
        .send(validCita)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.titulo).toBe(validCita.titulo);
    });

    it('debe rechazar una cita con fecha_fin anterior a fecha_inicio', async () => {
      const invalidCita = {
        ...validCita,
        fecha_inicio: new Date(Date.now() + 86400000).toISOString(),
        fecha_fin: new Date(Date.now() + 86400000 - 3600000).toISOString()
      };
      
      const response = await request(app)
        .post('/api/citas')
        .send(invalidCita)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('posterior a la fecha de inicio');
    });
  });

  describe('Servicio Controller - Validaciones Migradas', () => {
    const validServicio = {
      nombre: 'Nuevo Servicio',
      descripcion: 'Descripción del nuevo servicio',
      precio_base: 75.00
    };

    it('debe crear un servicio con datos válidos', async () => {
      const response = await request(app)
        .post('/api/servicios')
        .send(validServicio)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe(validServicio.nombre);
      expect(response.body.precio_base).toBe(validServicio.precio_base);
    });

    it('debe rechazar un servicio con precio negativo', async () => {
      const invalidServicio = { ...validServicio, precio_base: -10 };
      
      const response = await request(app)
        .post('/api/servicios')
        .send(invalidServicio)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('positivo');
    });
  });

  describe('Onboarding Controller - Validaciones Migradas', () => {
    const validOrganization = {
      nombre: 'Clínica Test',
      ruc: '12345678901',
      email: 'clinica@test.com',
      telefono: '1234567890',
      ciudad: 'Lima',
      adminNombre: 'Admin Test',
      adminEmail: 'admin@test.com',
      adminPassword: 'password123',
      adminPasswordConfirm: 'password123'
    };

    it('debe registrar una organización con datos válidos', async () => {
      const response = await request(app)
        .post('/api/onboarding/register')
        .send(validOrganization)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('debe rechazar cuando las contraseñas no coinciden', async () => {
      const invalidOrganization = {
        ...validOrganization,
        adminPassword: 'password123',
        adminPasswordConfirm: 'differentpassword'
      };
      
      const response = await request(app)
        .post('/api/onboarding/register')
        .send(invalidOrganization)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('no coinciden');
    });

    it('debe rechazar un RUC inválido', async () => {
      const invalidOrganization = { ...validOrganization, ruc: '123' };
      
      const response = await request(app)
        .post('/api/onboarding/register')
        .send(invalidOrganization)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('11 dígitos');
    });
  });

  describe('Inventory Controller - Validaciones Migradas', () => {
    const validInventoryExit = {
      nombrePaciente: 'Paciente Inventario',
      tipoTratamiento: 'Alergia',
      observaciones: 'Primera aplicación',
      tuvoReaccion: false,
      items: [
        {
          nombreProducto: 'Vacuna Antialérgica',
          cantidad: 1,
          doses: 2,
          subtipo: 'GLICERINADO_UNIDAD'
        }
      ]
    };

    it('debe registrar una salida de inventario válida', async () => {
      const response = await request(app)
        .post('/api/inventory/exit')
        .send(validInventoryExit)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('debe rechazar sin items', async () => {
      const invalidExit = { ...validInventoryExit, items: [] };
      
      const response = await request(app)
        .post('/api/inventory/exit')
        .send(invalidExit)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('al menos un item');
    });
  });

  describe('WhatsApp Controller - Validaciones Migradas', () => {
    const validWebhook = {
      Body: 'Hola, necesito información sobre mi cita',
      From: '+51987654321',
      To: '+51987654322'
    };

    it('debe procesar un webhook válido', async () => {
      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send(validWebhook)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('debe rechazar un webhook sin mensaje', async () => {
      const invalidWebhook = { ...validWebhook, Body: '' };
      
      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send(invalidWebhook)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('requerido');
    });
  });

  describe('Organización Controller - Validaciones Migradas', () => {
    const validOrganizacion = {
      nombre: 'Organización Test',
      ruc: '12345678901',
      direccion: 'Av. Test 123',
      telefono: '1234567890',
      email: 'test@organizacion.com',
      logo_url: 'https://example.com/logo.png',
      color_primario: '#FF5733',
      color_secundario: '#33FF57'
    };

    it('debe crear una organización válida', async () => {
      const response = await request(app)
        .post('/api/organizaciones')
        .send(validOrganizacion)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe(validOrganizacion.nombre);
    });

    it('debe rechazar un color primario inválido', async () => {
      const invalidOrganizacion = { ...validOrganizacion, color_primario: 'invalid-color' };
      
      const response = await request(app)
        .post('/api/organizaciones')
        .send(invalidOrganizacion)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('hexadecimal válido');
    });
  });

  describe('Error Handling Integration', () => {
    it('debe manejar errores de validación consistentemente', async () => {
      const invalidData = { nombre: '' };
      
      const response = await request(app)
        .post('/api/usuarios')
        .send(invalidData)
        .expect(400);

      // Verificar estructura consistente de error
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('issues');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.error.issues)).toBe(true);
    });

    it('debe manejar errores de recursos no encontrados', async () => {
      const response = await request(app)
        .get('/api/usuarios/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('no encontrado');
    });
  });

  describe('Performance Tests', () => {
    it('debe validar datos rápidamente', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Performance Test',
          apellido: 'User',
          email: 'performance@test.com',
          telefono: '1234567890',
          rol: 'DOCTOR',
          consultorio_id: testConsultorio.id
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // La validación no debe tomar más de 100ms
      expect(duration).toBeLessThan(100);
    });
  });
}); 