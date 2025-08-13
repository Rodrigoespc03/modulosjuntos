import { z } from 'zod';
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  createPacienteSchema,
  createCobroSchema,
  createCitaSchema,
  createServicioSchema,
  registerOrganizationSchema,
  inventoryExitSchema,
  whatsappWebhookSchema,
  createOrganizacionSchema,
  createHistorialCobroSchema,
  createPrecioConsultorioSchema,
  createDisponibilidadMedicoSchema,
  createBloqueoMedicoSchema,
  createConfiguracionPermisosSchema,
  RolEnum,
  EstadoCobroEnum,
  MetodoPagoEnum,
  EstadoCitaEnum,
  TipoCambioEnum
} from '../../backend/schemas/validationSchemas';

describe('Validation Schemas - Zod Tests', () => {
  
  describe('Usuario Schemas', () => {
    const validUsuario = {
      nombre: 'Juan Pérez',
      apellido: 'García',
      email: 'juan@example.com',
      telefono: '1234567890',
      rol: 'DOCTOR' as const,
      consultorio_id: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('debe validar un usuario válido', () => {
      const result = createUsuarioSchema.safeParse(validUsuario);
      expect(result.success).toBe(true);
    });

    it('debe rechazar un usuario sin nombre', () => {
      const invalidUsuario = { ...validUsuario, nombre: '' };
      const result = createUsuarioSchema.safeParse(invalidUsuario);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 2 caracteres');
      }
    });

    it('debe rechazar un email inválido', () => {
      const invalidUsuario = { ...validUsuario, email: 'email-invalido' };
      const result = createUsuarioSchema.safeParse(invalidUsuario);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('formato válido');
      }
    });

    it('debe rechazar un rol inválido', () => {
      const invalidUsuario = { ...validUsuario, rol: 'ROL_INVALIDO' };
      const result = createUsuarioSchema.safeParse(invalidUsuario);
      expect(result.success).toBe(false);
    });

    it('debe permitir actualización parcial', () => {
      const partialUpdate = { nombre: 'Nuevo Nombre' };
      const result = updateUsuarioSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('Paciente Schemas', () => {
    const validPaciente = {
      nombre: 'María',
      apellido: 'López',
      fecha_nacimiento: '1990-01-01T00:00:00.000Z',
      genero: 'F',
      telefono: '1234567890',
      email: 'maria@example.com'
    };

    it('debe validar un paciente válido', () => {
      const result = createPacienteSchema.safeParse(validPaciente);
      expect(result.success).toBe(true);
    });

    it('debe rechazar un paciente sin género', () => {
      const invalidPaciente = { ...validPaciente, genero: '' };
      const result = createPacienteSchema.safeParse(invalidPaciente);
      expect(result.success).toBe(false);
    });
  });

  describe('Cobro Schemas', () => {
    const validCobro = {
      paciente_id: '123e4567-e89b-12d3-a456-426614174000',
      usuario_id: '123e4567-e89b-12d3-a456-426614174001',
      fecha_cobro: '2024-01-01T10:00:00.000Z',
      monto_total: 150.50,
      estado: 'PENDIENTE' as const,
      pagos: [
        { metodo: 'EFECTIVO' as const, monto: 100.50 },
        { metodo: 'TARJETA_DEBITO' as const, monto: 50.00 }
      ]
    };

    it('debe validar un cobro válido', () => {
      const result = createCobroSchema.safeParse(validCobro);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cuando la suma de pagos no coincide con el total', () => {
      const invalidCobro = {
        ...validCobro,
        monto_total: 200.00,
        pagos: [
          { metodo: 'EFECTIVO' as const, monto: 100.00 }
        ]
      };
      const result = createCobroSchema.safeParse(invalidCobro);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('suma de los métodos de pago');
      }
    });

    it('debe rechazar un monto negativo', () => {
      const invalidCobro = { ...validCobro, monto_total: -50 };
      const result = createCobroSchema.safeParse(invalidCobro);
      expect(result.success).toBe(false);
    });
  });

  describe('Cita Schemas', () => {
    const validCita = {
      titulo: 'Consulta General',
      descripcion: 'Consulta de rutina',
      estado: 'PROGRAMADA' as const,
      paciente_id: '123e4567-e89b-12d3-a456-426614174000',
      usuario_id: '123e4567-e89b-12d3-a456-426614174001',
      consultorio_id: '123e4567-e89b-12d3-a456-426614174002',
      fecha_inicio: '2024-01-01T10:00:00.000Z',
      fecha_fin: '2024-01-01T11:00:00.000Z'
    };

    it('debe validar una cita válida', () => {
      const result = createCitaSchema.safeParse(validCita);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cuando fecha_fin es anterior a fecha_inicio', () => {
      const invalidCita = {
        ...validCita,
        fecha_inicio: '2024-01-01T11:00:00.000Z',
        fecha_fin: '2024-01-01T10:00:00.000Z'
      };
      const result = createCitaSchema.safeParse(invalidCita);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('posterior a la fecha de inicio');
      }
    });
  });

  describe('Servicio Schemas', () => {
    const validServicio = {
      nombre: 'Consulta Médica',
      descripcion: 'Consulta general con el médico',
      precio_base: 50.00
    };

    it('debe validar un servicio válido', () => {
      const result = createServicioSchema.safeParse(validServicio);
      expect(result.success).toBe(true);
    });

    it('debe rechazar un precio negativo', () => {
      const invalidServicio = { ...validServicio, precio_base: -10 };
      const result = createServicioSchema.safeParse(invalidServicio);
      expect(result.success).toBe(false);
    });
  });

  describe('Onboarding Schemas', () => {
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

    it('debe validar un registro de organización válido', () => {
      const result = registerOrganizationSchema.safeParse(validOrganization);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cuando las contraseñas no coinciden', () => {
      const invalidOrganization = {
        ...validOrganization,
        adminPassword: 'password123',
        adminPasswordConfirm: 'differentpassword'
      };
      const result = registerOrganizationSchema.safeParse(invalidOrganization);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no coinciden');
      }
    });

    it('debe rechazar un RUC inválido', () => {
      const invalidOrganization = { ...validOrganization, ruc: '123' };
      const result = registerOrganizationSchema.safeParse(invalidOrganization);
      expect(result.success).toBe(false);
    });
  });

  describe('Inventory Schemas', () => {
    const validInventoryExit = {
      nombrePaciente: 'Juan Pérez',
      tipoTratamiento: 'Alergia',
      observaciones: 'Primera aplicación',
      tuvoReaccion: false,
      items: [
        {
          nombreProducto: 'Vacuna Antialérgica',
          cantidad: 1,
          doses: 2,
          subtipo: 'GLICERINADO_UNIDAD' as const
        }
      ]
    };

    it('debe validar una salida de inventario válida', () => {
      const result = inventoryExitSchema.safeParse(validInventoryExit);
      expect(result.success).toBe(true);
    });

    it('debe rechazar sin items', () => {
      const invalidExit = { ...validInventoryExit, items: [] };
      const result = inventoryExitSchema.safeParse(invalidExit);
      expect(result.success).toBe(false);
    });
  });

  describe('WhatsApp Schemas', () => {
    const validWebhook = {
      Body: 'Hola, necesito información',
      From: '+51987654321',
      To: '+51987654322'
    };

    it('debe validar un webhook válido', () => {
      const result = whatsappWebhookSchema.safeParse(validWebhook);
      expect(result.success).toBe(true);
    });

    it('debe rechazar un mensaje vacío', () => {
      const invalidWebhook = { ...validWebhook, Body: '' };
      const result = whatsappWebhookSchema.safeParse(invalidWebhook);
      expect(result.success).toBe(false);
    });
  });

  describe('Organización Schemas', () => {
    const validOrganizacion = {
      nombre: 'Clínica Test',
      ruc: '12345678901',
      direccion: 'Av. Test 123',
      telefono: '1234567890',
      email: 'test@clinica.com',
      logo_url: 'https://example.com/logo.png',
      color_primario: '#FF5733',
      color_secundario: '#33FF57'
    };

    it('debe validar una organización válida', () => {
      const result = createOrganizacionSchema.safeParse(validOrganizacion);
      expect(result.success).toBe(true);
    });

    it('debe rechazar un color primario inválido', () => {
      const invalidOrganizacion = { ...validOrganizacion, color_primario: 'invalid-color' };
      const result = createOrganizacionSchema.safeParse(invalidOrganizacion);
      expect(result.success).toBe(false);
    });
  });

  describe('Historial Cobro Schemas', () => {
    const validHistorial = {
      cobro_id: '123e4567-e89b-12d3-a456-426614174000',
      usuario_id: '123e4567-e89b-12d3-a456-426614174001',
      tipo_cambio: 'EDICION' as const,
      detalles_despues: { monto: 150.00, estado: 'COMPLETADO' }
    };

    it('debe validar un historial válido', () => {
      const result = createHistorialCobroSchema.safeParse(validHistorial);
      expect(result.success).toBe(true);
    });
  });

  describe('Precio Consultorio Schemas', () => {
    const validPrecio = {
      consultorio_id: '123e4567-e89b-12d3-a456-426614174000',
      concepto: 'Consulta General',
      precio: 50.00
    };

    it('debe validar un precio válido', () => {
      const result = createPrecioConsultorioSchema.safeParse(validPrecio);
      expect(result.success).toBe(true);
    });
  });

  describe('Disponibilidad Médico Schemas', () => {
    const validDisponibilidad = {
      usuario_id: '123e4567-e89b-12d3-a456-426614174000',
      dia_semana: 1,
      hora_inicio: '09:00',
      hora_fin: '17:00'
    };

    it('debe validar una disponibilidad válida', () => {
      const result = createDisponibilidadMedicoSchema.safeParse(validDisponibilidad);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cuando hora_fin es anterior a hora_inicio', () => {
      const invalidDisponibilidad = {
        ...validDisponibilidad,
        hora_inicio: '17:00',
        hora_fin: '09:00'
      };
      const result = createDisponibilidadMedicoSchema.safeParse(invalidDisponibilidad);
      expect(result.success).toBe(false);
    });
  });

  describe('Bloqueo Médico Schemas', () => {
    const validBloqueo = {
      usuario_id: '123e4567-e89b-12d3-a456-426614174000',
      fecha_inicio: '2024-01-01T00:00:00.000Z',
      fecha_fin: '2024-01-02T00:00:00.000Z',
      motivo: 'Vacaciones'
    };

    it('debe validar un bloqueo válido', () => {
      const result = createBloqueoMedicoSchema.safeParse(validBloqueo);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cuando fecha_fin es anterior a fecha_inicio', () => {
      const invalidBloqueo = {
        ...validBloqueo,
        fecha_inicio: '2024-01-02T00:00:00.000Z',
        fecha_fin: '2024-01-01T00:00:00.000Z'
      };
      const result = createBloqueoMedicoSchema.safeParse(invalidBloqueo);
      expect(result.success).toBe(false);
    });
  });

  describe('Configuración Permisos Schemas', () => {
    const validConfig = {
      consultorio_id: '123e4567-e89b-12d3-a456-426614174000',
      secretaria_editar_cobros: true,
      secretaria_eliminar_cobros: false,
      enfermera_entradas_inventario: true,
      enfermera_salidas_inventario: true,
      secretaria_entradas_inventario: true,
      secretaria_salidas_inventario: false
    };

    it('debe validar una configuración válida', () => {
      const result = createConfiguracionPermisosSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('Enums', () => {
    it('debe validar roles válidos', () => {
      expect(RolEnum.safeParse('DOCTOR').success).toBe(true);
      expect(RolEnum.safeParse('SECRETARIA').success).toBe(true);
      expect(RolEnum.safeParse('ROL_INVALIDO').success).toBe(false);
    });

    it('debe validar estados de cobro válidos', () => {
      expect(EstadoCobroEnum.safeParse('PENDIENTE').success).toBe(true);
      expect(EstadoCobroEnum.safeParse('COMPLETADO').success).toBe(true);
      expect(EstadoCobroEnum.safeParse('ESTADO_INVALIDO').success).toBe(false);
    });

    it('debe validar métodos de pago válidos', () => {
      expect(MetodoPagoEnum.safeParse('EFECTIVO').success).toBe(true);
      expect(MetodoPagoEnum.safeParse('TARJETA_CREDITO').success).toBe(true);
      expect(MetodoPagoEnum.safeParse('METODO_INVALIDO').success).toBe(false);
    });

    it('debe validar estados de cita válidos', () => {
      expect(EstadoCitaEnum.safeParse('PROGRAMADA').success).toBe(true);
      expect(EstadoCitaEnum.safeParse('COMPLETADA').success).toBe(true);
      expect(EstadoCitaEnum.safeParse('ESTADO_INVALIDO').success).toBe(false);
    });

    it('debe validar tipos de cambio válidos', () => {
      expect(TipoCambioEnum.safeParse('CREACION').success).toBe(true);
      expect(TipoCambioEnum.safeParse('EDICION').success).toBe(true);
      expect(TipoCambioEnum.safeParse('TIPO_INVALIDO').success).toBe(false);
    });
  });
}); 