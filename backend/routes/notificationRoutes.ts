import express from 'express';
import { NotificationService } from '../services/notificationService';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateMultiTenant);

/**
 * POST /api/notifications/appointment-reminder
 * Envía recordatorio de cita por WhatsApp y/o Email
 */
router.post('/appointment-reminder', asyncHandler(async (req, res) => {
  const {
    pacienteNombre,
    pacienteEmail,
    pacienteTelefono,
    doctorNombre,
    consultorioNombre,
    fecha,
    citaId,
    pacienteId
  } = req.body;

  // Validaciones básicas
  if (!pacienteNombre || !pacienteEmail || !doctorNombre || !consultorioNombre || !fecha || !citaId || !pacienteId) {
    return res.status(400).json({
      success: false,
      error: 'Faltan campos requeridos'
    });
  }

  const data = {
    pacienteNombre,
    pacienteEmail,
    pacienteTelefono,
    doctorNombre,
    consultorioNombre,
    fecha: new Date(fecha),
    citaId,
    pacienteId,
    usuarioId: req.user.id
  };

  const result = await NotificationService.sendAppointmentReminder(data);

  res.json(result);
}));

/**
 * POST /api/notifications/treatment-reminder
 * Envía recordatorio de tratamiento por WhatsApp y/o Email
 */
router.post('/treatment-reminder', asyncHandler(async (req, res) => {
  const {
    pacienteNombre,
    pacienteEmail,
    pacienteTelefono,
    treatmentType,
    pacienteId
  } = req.body;

  // Validaciones básicas
  if (!pacienteNombre || !pacienteEmail || !treatmentType || !pacienteId) {
    return res.status(400).json({
      success: false,
      error: 'Faltan campos requeridos'
    });
  }

  const data = {
    pacienteNombre,
    pacienteEmail,
    pacienteTelefono,
    treatmentType,
    pacienteId,
    usuarioId: req.user.id
  };

  const result = await NotificationService.sendTreatmentReminder(data);

  res.json(result);
}));

/**
 * POST /api/notifications/payment-notification
 * Envía notificación de cobro por Email
 */
router.post('/payment-notification', asyncHandler(async (req, res) => {
  const {
    pacienteNombre,
    pacienteEmail,
    monto,
    concepto,
    fechaVencimiento,
    pacienteId,
    cobroId
  } = req.body;

  // Validaciones básicas
  if (!pacienteNombre || !pacienteEmail || !monto || !concepto || !pacienteId || !cobroId) {
    return res.status(400).json({
      success: false,
      error: 'Faltan campos requeridos'
    });
  }

  const data = {
    pacienteNombre,
    pacienteEmail,
    monto: parseFloat(monto),
    concepto,
    fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
    pacienteId,
    cobroId,
    usuarioId: req.user.id
  };

  const result = await NotificationService.sendPaymentNotification(data);

  res.json(result);
}));

/**
 * GET /api/notifications/available-methods
 * Verifica qué métodos de notificación están disponibles
 */
router.get('/available-methods', asyncHandler(async (req, res) => {
  const methods = await NotificationService.checkAvailableMethods();
  
  res.json({
    success: true,
    methods
  });
}));

/**
 * POST /api/notifications/test-email
 * Endpoint para probar el envío de emails
 */
router.post('/test-email', asyncHandler(async (req, res) => {
  const { email, nombre } = req.body;

  if (!email || !nombre) {
    return res.status(400).json({
      success: false,
      error: 'Email y nombre son requeridos'
    });
  }

  // Crear datos de prueba para recordatorio de cita
  const testData = {
    pacienteNombre: nombre,
    pacienteEmail: email,
    doctorNombre: 'Dr. Prueba',
    consultorioNombre: 'Consultorio de Prueba',
    fecha: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
    citaId: 'test-' + Date.now(),
    pacienteId: 'test-paciente',
    usuarioId: req.user.id
  };

  const result = await NotificationService.sendAppointmentReminder(testData);

  res.json({
    success: result.success,
    message: result.success ? 'Email de prueba enviado correctamente' : 'Error enviando email de prueba',
    method: result.method,
    emailMessageId: result.emailMessageId,
    error: result.error
  });
}));

export default router;
