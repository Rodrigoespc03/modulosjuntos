import express from 'express';
import {
  testHuliConnection,
  getHuliPatients,
  getHuliPatientById,
  createHuliPatient,
  syncHuliPatient,
  getHuliAppointments,
  getHuliAppointmentById,
  syncHuliAppointment,
  getHuliMedicalRecords,
  getHuliMedicalRecordById,
  getHuliMedicalRecordsByPatient,
} from '../controllers/huliController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rutas de prueba y configuración
router.get('/test-connection', authenticateToken, testHuliConnection);

// Rutas de pacientes
router.get('/patients', authenticateToken, getHuliPatients);
router.get('/patients/:patientId', authenticateToken, getHuliPatientById);
router.post('/patients', authenticateToken, createHuliPatient);
router.post('/patients/:patientId/sync', authenticateToken, syncHuliPatient);

// Rutas de citas
router.get('/appointments', authenticateToken, getHuliAppointments);
router.get('/appointments/:appointmentId', authenticateToken, getHuliAppointmentById);
router.post('/appointments/:appointmentId/sync', authenticateToken, syncHuliAppointment);

// Rutas de expedientes médicos
router.get('/medical-records', authenticateToken, getHuliMedicalRecords);
router.get('/medical-records/:recordId', authenticateToken, getHuliMedicalRecordById);
router.get('/patients/:patientId/medical-records', authenticateToken, getHuliMedicalRecordsByPatient);

export default router; 