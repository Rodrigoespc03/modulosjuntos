import { Request, Response } from 'express';
import HuliService, { HuliConfig } from '../services/huliService';
import asyncHandler from '../utils/asyncHandler';
import { 
  huliPatientIdSchema,
  huliAppointmentIdSchema,
  huliRecordIdSchema,
  huliPatientsQuerySchema,
  huliAppointmentsQuerySchema,
  huliMedicalRecordsQuerySchema,
  createHuliPatientSchema
} from '../schemas/validationSchemas';
import { 
  validateParams, 
  validateQuery, 
  validateBody,
  getValidatedParams,
  getValidatedQuery,
  getValidatedBody
} from '../middleware/validation';
import { 
  createNotFoundError, 
  createBadRequestError,
  createInternalServerError 
} from '../middleware/errorHandler';

// Configuración de Huli desde variables de entorno
const huliConfig: HuliConfig = {
  apiKey: process.env.HULI_API_KEY || '',
  organizationId: process.env.HULI_ORGANIZATION_ID || '',
  userId: process.env.HULI_USER_ID || '',
  baseURL: process.env.HULI_BASE_URL || 'https://api.hulipractice.com/v1',
};

// Instancia del servicio Huli
const huliService = new HuliService(huliConfig);

// Verificar conexión con Huli
export const testHuliConnection = asyncHandler(async (req: Request, res: Response) => {
  try {
    const isConnected = await huliService.testConnection();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Conexión con Huli establecida correctamente',
        config: {
          organizationId: huliConfig.organizationId,
          userId: huliConfig.userId,
          baseURL: huliConfig.baseURL,
        }
      });
    } else {
      throw createInternalServerError('No se pudo establecer conexión con Huli');
    }
  } catch (error) {
    throw createInternalServerError('Error verificando conexión con Huli');
  }
});

// Obtener pacientes de Huli
export const getHuliPatients = [
  validateQuery(huliPatientsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = getValidatedQuery(req);
    
    const result = await huliService.getPatients({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
    });
    
    res.status(200).json({
      success: true,
      data: result.patients,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      }
    });
  })
];

// Obtener paciente específico de Huli
export const getHuliPatientById = [
  validateParams(huliPatientIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = getValidatedParams(req);
    
    const patient = await huliService.getPatientById(patientId);
    
    res.status(200).json({
      success: true,
      data: patient
    });
  })
];

// Crear paciente en Huli
export const createHuliPatient = [
  validateBody(createHuliPatientSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const patientData = getValidatedBody(req);
    
    const newPatient = await huliService.createPatient(patientData);
    
    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente en Huli',
      data: newPatient
    });
  })
];

// Sincronizar paciente de Huli con sistema local
export const syncHuliPatient = [
  validateParams(huliPatientIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = getValidatedParams(req);
    
    // Primero obtener el paciente de Huli
    const huliPatient = await huliService.getPatientById(patientId);
    
    // Luego sincronizar con sistema local
    const syncResult = await huliService.syncPatientWithLocalSystem(huliPatient);
    
    res.status(200).json({
      success: true,
      message: 'Paciente sincronizado correctamente',
      data: {
        huliPatient,
        syncResult
      }
    });
  })
];

// Obtener citas de Huli
export const getHuliAppointments = [
  validateQuery(huliAppointmentsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = getValidatedQuery(req);
    
    const result = await huliService.getAppointments({
      page: query.page,
      limit: query.limit,
      patientId: query.patientId,
      doctorId: query.doctorId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      status: query.status,
    });
    
    res.status(200).json({
      success: true,
      data: result.appointments,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      }
    });
  })
];

// Obtener cita específica de Huli
export const getHuliAppointmentById = [
  validateParams(huliAppointmentIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId } = getValidatedParams(req);
    
    const appointment = await huliService.getAppointmentById(appointmentId);
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  })
];

// Sincronizar cita de Huli con sistema local
export const syncHuliAppointment = [
  validateParams(huliAppointmentIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId } = getValidatedParams(req);
    
    // Primero obtener la cita de Huli
    const huliAppointment = await huliService.getAppointmentById(appointmentId);
    
    // Luego sincronizar con sistema local
    const syncResult = await huliService.syncAppointmentWithLocalSystem(huliAppointment);
    
    res.status(200).json({
      success: true,
      message: 'Cita sincronizada correctamente',
      data: {
        huliAppointment,
        syncResult
      }
    });
  })
];

// Obtener expedientes médicos de Huli
export const getHuliMedicalRecords = [
  validateQuery(huliMedicalRecordsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = getValidatedQuery(req);
    
    const result = await huliService.getMedicalRecords({
      page: query.page,
      limit: query.limit,
      patientId: query.patientId,
      doctorId: query.doctorId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    
    res.status(200).json({
      success: true,
      data: result.medicalRecords,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      }
    });
  })
];

// Obtener expediente médico específico de Huli
export const getHuliMedicalRecordById = [
  validateParams(huliRecordIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = getValidatedParams(req);
    
    const medicalRecord = await huliService.getMedicalRecordById(recordId);
    
    res.status(200).json({
      success: true,
      data: medicalRecord
    });
  })
];

// Obtener expedientes médicos de un paciente específico
export const getHuliMedicalRecordsByPatient = [
  validateParams(huliPatientIdSchema),
  validateQuery(huliMedicalRecordsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = getValidatedParams(req);
    const query = getValidatedQuery(req);
    
    const result = await huliService.getMedicalRecords({
      page: query.page,
      limit: query.limit,
      patientId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    
    res.status(200).json({
      success: true,
      data: result.medicalRecords,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      }
    });
  })
]; 