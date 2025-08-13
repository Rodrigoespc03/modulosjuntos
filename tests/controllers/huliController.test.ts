import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';

// Mock del servicio Huli
jest.mock('../../backend/services/huliService', () => {
  return jest.fn().mockImplementation(() => ({
    testConnection: jest.fn().mockResolvedValue(true),
    getPatients: jest.fn().mockResolvedValue({
      patients: [
        { id: '1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@test.com' },
        { id: '2', firstName: 'María', lastName: 'López', email: 'maria@test.com' }
      ],
      total: 2,
      page: 1,
      limit: 20
    }),
    getPatientById: jest.fn().mockResolvedValue({
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
      phone: '1234567890'
    }),
    createPatient: jest.fn().mockResolvedValue({
      id: '3',
      firstName: 'Nuevo',
      lastName: 'Paciente',
      email: 'nuevo@test.com'
    }),
    syncPatientWithLocalSystem: jest.fn().mockResolvedValue({
      success: true,
      localPatientId: 'local-123'
    }),
    getAppointments: jest.fn().mockResolvedValue({
      appointments: [
        { id: '1', patientId: '1', doctorId: 'doc1', date: '2024-01-01T10:00:00Z' },
        { id: '2', patientId: '2', doctorId: 'doc2', date: '2024-01-02T11:00:00Z' }
      ],
      total: 2,
      page: 1,
      limit: 20
    }),
    getAppointmentById: jest.fn().mockResolvedValue({
      id: '1',
      patientId: '1',
      doctorId: 'doc1',
      date: '2024-01-01T10:00:00Z',
      status: 'scheduled'
    }),
    syncAppointmentWithLocalSystem: jest.fn().mockResolvedValue({
      success: true,
      localAppointmentId: 'local-app-123'
    }),
    getMedicalRecords: jest.fn().mockResolvedValue({
      medicalRecords: [
        { id: '1', patientId: '1', doctorId: 'doc1', date: '2024-01-01T10:00:00Z' },
        { id: '2', patientId: '2', doctorId: 'doc2', date: '2024-01-02T11:00:00Z' }
      ],
      total: 2,
      page: 1,
      limit: 20
    }),
    getMedicalRecordById: jest.fn().mockResolvedValue({
      id: '1',
      patientId: '1',
      doctorId: 'doc1',
      date: '2024-01-01T10:00:00Z',
      notes: 'Consulta de rutina'
    })
  }));
});

describe('Huli Controller - Migrated', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('testHuliConnection', () => {
    it('debe verificar conexión exitosa con Huli', async () => {
      const response = await request(app)
        .get('/api/huli/test-connection')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Conexión con Huli establecida');
      expect(response.body.config).toBeDefined();
    });
  });

  describe('getHuliPatients', () => {
    it('debe obtener pacientes con parámetros válidos', async () => {
      const response = await request(app)
        .get('/api/huli/patients?page=1&limit=20&search=juan')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('debe usar valores por defecto cuando no se proporcionan parámetros', async () => {
      const response = await request(app)
        .get('/api/huli/patients')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('debe rechazar parámetros inválidos', async () => {
      const response = await request(app)
        .get('/api/huli/patients?page=-1&limit=1000')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('getHuliPatientById', () => {
    it('debe obtener un paciente específico con ID válido', async () => {
      const response = await request(app)
        .get('/api/huli/patients/patient-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('1');
    });

    it('debe rechazar un ID vacío', async () => {
      const response = await request(app)
        .get('/api/huli/patients/')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('createHuliPatient', () => {
    const validPatient = {
      firstName: 'Nuevo',
      lastName: 'Paciente',
      email: 'nuevo@test.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      gender: 'M'
    };

    it('debe crear un paciente con datos válidos', async () => {
      const response = await request(app)
        .post('/api/huli/patients')
        .send(validPatient)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('creado exitosamente');
      expect(response.body.data).toBeDefined();
    });

    it('debe rechazar un paciente sin nombre', async () => {
      const invalidPatient = { ...validPatient, firstName: '' };
      
      const response = await request(app)
        .post('/api/huli/patients')
        .send(invalidPatient)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('al menos 2 caracteres');
    });

    it('debe rechazar un email inválido', async () => {
      const invalidPatient = { ...validPatient, email: 'email-invalido' };
      
      const response = await request(app)
        .post('/api/huli/patients')
        .send(invalidPatient)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('válido');
    });

    it('debe rechazar un teléfono inválido', async () => {
      const invalidPatient = { ...validPatient, phone: '123' };
      
      const response = await request(app)
        .post('/api/huli/patients')
        .send(invalidPatient)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.issues[0].message).toContain('al menos 7 dígitos');
    });
  });

  describe('syncHuliPatient', () => {
    it('debe sincronizar un paciente con ID válido', async () => {
      const response = await request(app)
        .post('/api/huli/patients/patient-123/sync')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sincronizado correctamente');
      expect(response.body.data).toBeDefined();
    });

    it('debe rechazar sincronización sin ID', async () => {
      const response = await request(app)
        .post('/api/huli/patients//sync')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('getHuliAppointments', () => {
    it('debe obtener citas con parámetros válidos', async () => {
      const response = await request(app)
        .get('/api/huli/appointments?page=1&limit=20&patientId=1&doctorId=doc1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('debe rechazar parámetros de fecha inválidos', async () => {
      const response = await request(app)
        .get('/api/huli/appointments?dateFrom=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('getHuliAppointmentById', () => {
    it('debe obtener una cita específica con ID válido', async () => {
      const response = await request(app)
        .get('/api/huli/appointments/appointment-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('1');
    });
  });

  describe('syncHuliAppointment', () => {
    it('debe sincronizar una cita con ID válido', async () => {
      const response = await request(app)
        .post('/api/huli/appointments/appointment-123/sync')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sincronizada correctamente');
      expect(response.body.data).toBeDefined();
    });
  });

  describe('getHuliMedicalRecords', () => {
    it('debe obtener expedientes médicos con parámetros válidos', async () => {
      const response = await request(app)
        .get('/api/huli/medical-records?page=1&limit=20&patientId=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('getHuliMedicalRecordById', () => {
    it('debe obtener un expediente médico específico con ID válido', async () => {
      const response = await request(app)
        .get('/api/huli/medical-records/record-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('1');
    });
  });

  describe('getHuliMedicalRecordsByPatient', () => {
    it('debe obtener expedientes médicos de un paciente específico', async () => {
      const response = await request(app)
        .get('/api/huli/patients/patient-123/medical-records?page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('debe manejar errores de validación consistentemente', async () => {
      const invalidData = { firstName: '' };
      
      const response = await request(app)
        .post('/api/huli/patients')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.issues).toBeDefined();
      expect(Array.isArray(response.body.error.issues)).toBe(true);
    });

    it('debe manejar errores de recursos no encontrados', async () => {
      const response = await request(app)
        .get('/api/huli/patients/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('no encontrado');
    });
  });

  describe('Performance Tests', () => {
    it('debe validar datos rápidamente', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/huli/patients')
        .send({
          firstName: 'Performance',
          lastName: 'Test',
          email: 'performance@test.com',
          phone: '1234567890'
        })
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // La validación no debe tomar más de 100ms
      expect(duration).toBeLessThan(100);
    });
  });
}); 