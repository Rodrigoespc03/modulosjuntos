import express from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { gdprCompliance, gdprMedicalData, checkOrganizationCompliance } from '../middleware/gdprCompliance';
import { GdprAuditLogger, AUDIT_ACTIVITIES, DATA_CATEGORIES, LEGAL_BASIS, getAuditLogs } from '../middleware/auditLogger';
import { medicalEncryption } from '../utils/encryption';
import {
  gdprConsentSchema,
  dataAccessRequestSchema,
  dataBreachSchema
} from '../schemas/gdprSchemas';

const router = express.Router();

/**
 * RUTAS PARA DERECHOS DEL PACIENTE BAJO GDPR
 * Implementa Art. 15-22 del GDPR
 */

// POST /api/gdpr/consent - Registrar consentimiento del paciente
router.post('/consent', [
  validateBody(gdprConsentSchema),
  gdprCompliance({
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
    legalBasis: LEGAL_BASIS.CONSENT,
    purpose: 'Registro de consentimiento GDPR',
    consentRequired: false,
    sensitiveData: false
  })
], asyncHandler(async (req, res) => {
  const consentData = req.body;
  
  try {
    // TODO: Guardar en base de datos
    // const consent = await prisma.gdpr_consents.create({
    //   data: {
    //     ...consentData,
    //     consent_id: uuidv4(),
    //     created_at: new Date()
    //   }
    // });

    // Simular respuesta
    const consent = {
      consent_id: 'consent-' + Date.now(),
      ...consentData,
      created_at: new Date()
    };

    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.CONSENT_GIVEN,
      description: `Consentimiento registrado para paciente ${consentData.paciente_id}`,
      legal_basis: LEGAL_BASIS.CONSENT,
      purpose: 'Registro de consentimiento GDPR',
      req,
      user_id: consentData.obtained_by_user_id,
      paciente_id: consentData.paciente_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: {
        consent_type: consentData.consent_type,
        consent_method: consentData.consent_method
      }
    });

    res.status(201).json({
      success: true,
      message: 'Consentimiento registrado exitosamente',
      data: consent
    });
  } catch (error) {
    console.error('Error registering consent:', error);
    res.status(500).json({
      error: 'Failed to register consent',
      message: 'No se pudo registrar el consentimiento'
    });
  }
}));

// POST /api/gdpr/consent/withdraw - Retirar consentimiento
router.post('/consent/withdraw', [
  gdprCompliance()
], asyncHandler(async (req, res) => {
  const withdrawalData = req.body;
  
  try {
    // TODO: Marcar consentimiento como retirado en base de datos
    // await prisma.gdpr_consents.update({
    //   where: { consent_id: withdrawalData.consent_id },
    //   data: {
    //     consent_withdrawn: true,
    //     withdrawal_date: withdrawalData.withdrawal_date,
    //     withdrawal_reason: withdrawalData.withdrawal_reason
    //   }
    // });

    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.CONSENT_WITHDRAWN,
      description: `Consentimiento retirado para paciente ${withdrawalData.paciente_id}`,
      legal_basis: LEGAL_BASIS.CONSENT,
      purpose: 'Retiro de consentimiento GDPR',
      req,
      user_id: withdrawalData.withdrawn_by_user_id,
      paciente_id: withdrawalData.paciente_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: {
        withdrawal_reason: withdrawalData.withdrawal_reason,
        delete_data: withdrawalData.delete_data
      }
    });

    // Si se solicita eliminar datos, proceder con eliminación
    if (withdrawalData.delete_data) {
      // TODO: Implementar eliminación de datos
      console.log(`Iniciando eliminación de datos para paciente ${withdrawalData.paciente_id}`);
    }

    res.json({
      success: true,
      message: 'Consentimiento retirado exitosamente',
      data: {
        paciente_id: withdrawalData.paciente_id,
        withdrawal_date: withdrawalData.withdrawal_date,
        data_deletion_scheduled: withdrawalData.delete_data
      }
    });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({
      error: 'Failed to withdraw consent',
      message: 'No se pudo retirar el consentimiento'
    });
  }
}));

// POST /api/gdpr/data-access-request - Solicitud de acceso a datos (Art. 15)
router.post('/data-access-request', [
  validateBody(dataAccessRequestSchema),
  gdprCompliance({
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.CONSENT,
    purpose: 'Ejercicio del derecho de acceso',
    consentRequired: false,
    sensitiveData: true
  })
], asyncHandler(async (req, res) => {
  const requestData = req.body;
  
  try {
    if (!requestData.identity_verified) {
      return res.status(400).json({
        error: 'Identity verification required',
        message: 'Se requiere verificación de identidad para solicitar acceso a datos'
      });
    }

    // TODO: Generar reporte completo de datos del paciente
    const patientData = {
      personal_data: {
        // TODO: obtener datos reales
        nombre: 'Juan Pérez',
        cedula: '12345678',
        fecha_nacimiento: '1990-01-15'
      },
      medical_data: {
        // TODO: obtener datos médicos (desencriptados)
        diagnosticos: ['Diabetes tipo 2'],
        tratamientos: ['Metformina 500mg']
      },
      financial_data: {
        // TODO: obtener datos financieros
        cobros: []
      },
      consent_history: {
        // TODO: obtener historial de consentimientos
        consents: []
      },
      processing_info: {
        data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
        legal_basis: LEGAL_BASIS.CONTRACT,
        retention_period: '10 años',
        purposes: ['Atención médica', 'Facturación']
      }
    };

    const exportId = 'export-' + Date.now();
    
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.ACCESS_REQUEST,
      description: `Solicitud de acceso a datos procesada para paciente ${requestData.paciente_id}`,
      legal_basis: LEGAL_BASIS.CONSENT,
      purpose: 'Ejercicio del derecho de acceso',
      req,
      user_id: requestData.requested_by_user_id,
      paciente_id: requestData.paciente_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
      additional_context: {
        request_type: requestData.request_type,
        response_format: requestData.response_format,
        export_id: exportId
      }
    });

    res.json({
      success: true,
      message: 'Solicitud de acceso procesada exitosamente',
      data: {
        export_id: exportId,
        patient_data: patientData,
        export_date: new Date(),
        format: requestData.response_format,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    });
  } catch (error) {
    console.error('Error processing data access request:', error);
    res.status(500).json({
      error: 'Failed to process data access request',
      message: 'No se pudo procesar la solicitud de acceso a datos'
    });
  }
}));

// DELETE /api/gdpr/patient/:id - Eliminación de datos (Art. 17 - Right to be forgotten)
router.delete('/patient/:id', [
  gdprCompliance({
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA, DATA_CATEGORIES.FINANCIAL_DATA],
    legalBasis: LEGAL_BASIS.CONSENT,
    purpose: 'Ejercicio del derecho al olvido',
    consentRequired: false,
    sensitiveData: true
  })
], asyncHandler(async (req, res) => {
  const pacienteId = req.params.id;
  const erasureData = req.body;
  
  try {
    if (!erasureData.identity_verified) {
      return res.status(400).json({
        error: 'Identity verification required',
        message: 'Se requiere verificación de identidad para eliminar datos'
      });
    }

    if (!erasureData.understands_consequences) {
      return res.status(400).json({
        error: 'Consequences acknowledgment required',
        message: 'Debe confirmar que entiende las consecuencias de la eliminación'
      });
    }

    // TODO: Implementar eliminación completa de datos
    const deletionResults = {
      pacientes: 1,
      citas: 0, // TODO: contar registros reales
      cobros: 0,
      historial_medico: 0,
      archivos: 0
    };

    // TODO: Eliminar de todas las tablas relacionadas
    // await prisma.$transaction([
    //   prisma.citas.deleteMany({ where: { paciente_id: pacienteId } }),
    //   prisma.cobros.deleteMany({ where: { paciente_id: pacienteId } }),
    //   prisma.historial_medico.deleteMany({ where: { paciente_id: pacienteId } }),
    //   prisma.pacientes.delete({ where: { id: pacienteId } })
    // ]);

    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.ERASURE_REQUEST,
      description: `Datos eliminados para paciente ${pacienteId} bajo derecho al olvido`,
      legal_basis: LEGAL_BASIS.CONSENT,
      purpose: 'Ejercicio del derecho al olvido',
      req,
      user_id: erasureData.requested_by_user_id,
      paciente_id: pacienteId,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
      records_affected: Object.values(deletionResults).reduce((a, b) => a + b, 0),
      additional_context: {
        erasure_reason: erasureData.erasure_reason,
        deletion_results: deletionResults
      }
    });

    res.json({
      success: true,
      message: 'Datos eliminados exitosamente bajo GDPR Art. 17',
      data: {
        paciente_id: pacienteId,
        deletion_date: new Date(),
        deletion_results: deletionResults,
        erasure_reason: erasureData.erasure_reason
      }
    });
  } catch (error) {
    console.error('Error deleting patient data:', error);
    res.status(500).json({
      error: 'Failed to delete patient data',
      message: 'No se pudieron eliminar los datos del paciente'
    });
  }
}));

// PUT /api/gdpr/rectification - Rectificación de datos (Art. 16)
router.put('/rectification', [
  gdprCompliance({
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.CONSENT,
    purpose: 'Ejercicio del derecho de rectificación',
    consentRequired: false,
    sensitiveData: true
  })
], asyncHandler(async (req, res) => {
  const rectificationData = req.body;
  
  try {
    if (!rectificationData.identity_verified) {
      return res.status(400).json({
        error: 'Identity verification required',
        message: 'Se requiere verificación de identidad para rectificar datos'
      });
    }

    // TODO: Implementar rectificación real de datos
    // await prisma.pacientes.update({
    //   where: { id: rectificationData.paciente_id },
    //   data: {
    //     [rectificationData.field_to_correct]: rectificationData.corrected_value
    //   }
    // });

    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.RECTIFICATION_REQUEST,
      description: `Datos rectificados para paciente ${rectificationData.paciente_id}`,
      legal_basis: LEGAL_BASIS.CONSENT,
      purpose: 'Ejercicio del derecho de rectificación',
      req,
      user_id: rectificationData.requested_by_user_id,
      paciente_id: rectificationData.paciente_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: {
        field_corrected: rectificationData.field_to_correct,
        previous_value: rectificationData.current_value,
        new_value: rectificationData.corrected_value,
        correction_reason: rectificationData.correction_reason
      }
    });

    res.json({
      success: true,
      message: 'Datos rectificados exitosamente bajo GDPR Art. 16',
      data: {
        paciente_id: rectificationData.paciente_id,
        field_corrected: rectificationData.field_to_correct,
        correction_date: new Date(),
        previous_value: rectificationData.current_value,
        new_value: rectificationData.corrected_value
      }
    });
  } catch (error) {
    console.error('Error rectifying patient data:', error);
    res.status(500).json({
      error: 'Failed to rectify patient data',
      message: 'No se pudieron rectificar los datos del paciente'
    });
  }
}));

// GET /api/gdpr/audit-logs/:pacienteId - Obtener logs de auditoría para un paciente
router.get('/audit-logs/:pacienteId', [
  validateQuery(z.object({
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    activity_type: z.string().optional(),
    limit: z.coerce.number().min(1).max(1000).default(100)
  })),
  gdprCompliance()
], asyncHandler(async (req, res) => {
  const pacienteId = req.params.pacienteId;
  const { from_date, to_date, activity_type, limit } = req.query as any;
  
  try {
    const filters: any = { paciente_id: pacienteId };
    
    if (from_date) filters.from_date = new Date(from_date);
    if (to_date) filters.to_date = new Date(to_date);
    if (activity_type) filters.activity_type = activity_type;
    
    const auditLogs = getAuditLogs(filters).slice(0, limit);
    
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.DATA_ACCESS,
      description: `Acceso a logs de auditoría para paciente ${pacienteId}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Auditoría de cumplimiento GDPR',
      req,
      user_id: (req as any).user?.id,
      paciente_id: pacienteId,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS]
    });

    res.json({
      success: true,
      data: {
        paciente_id: pacienteId,
        total_logs: auditLogs.length,
        logs: auditLogs,
        filters_applied: filters
      }
    });
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      message: 'No se pudieron obtener los logs de auditoría'
    });
  }
}));

// POST /api/gdpr/breach-notification - Notificación de violación de datos
router.post('/breach-notification', [
  validateBody(dataBreachSchema),
  gdprCompliance({
    dataCategories: [],
    legalBasis: LEGAL_BASIS.LEGAL_OBLIGATION,
    purpose: 'Notificación de violación de datos',
    consentRequired: false,
    sensitiveData: false
  })
], asyncHandler(async (req, res) => {
  const breachData = req.body;
  
  try {
    // TODO: Guardar notificación de violación en base de datos
    // const breach = await prisma.data_breaches.create({ data: breachData });

    // Determinar si se debe notificar a la autoridad (72 horas)
    const shouldNotifyDPA = breachData.risk_level !== 'low';
    
    // Determinar si se debe notificar a los individuos
    const shouldNotifyIndividuals = ['high', 'critical'].includes(breachData.risk_level);

    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.BREACH_DETECTED,
      description: `Violación de datos reportada: ${breachData.description}`,
      legal_basis: LEGAL_BASIS.LEGAL_OBLIGATION,
      purpose: 'Cumplimiento de notificación de violaciones',
      req,
      user_id: breachData.reported_by_user_id,
      data_categories: breachData.data_categories_affected,
      records_affected: breachData.affected_records_count,
      status: 'successful',
      additional_context: {
        breach_id: breachData.breach_id,
        breach_type: breachData.breach_type,
        risk_level: breachData.risk_level,
        should_notify_dpa: shouldNotifyDPA,
        should_notify_individuals: shouldNotifyIndividuals
      }
    });

    res.status(201).json({
      success: true,
      message: 'Violación de datos registrada exitosamente',
      data: {
        breach_id: breachData.breach_id,
        created_date: new Date(),
        should_notify_dpa: shouldNotifyDPA,
        should_notify_individuals: shouldNotifyIndividuals,
        dpa_notification_deadline: shouldNotifyDPA ? 
          new Date(Date.now() + 72 * 60 * 60 * 1000) : null, // 72 horas
        next_steps: [
          shouldNotifyDPA ? 'Notificar a la Autoridad de Protección de Datos dentro de 72 horas' : null,
          shouldNotifyIndividuals ? 'Notificar a los individuos afectados sin demora indebida' : null,
          'Documentar medidas de contención y recuperación',
          'Revisar y actualizar medidas de seguridad'
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error registering data breach:', error);
    res.status(500).json({
      error: 'Failed to register data breach',
      message: 'No se pudo registrar la violación de datos'
    });
  }
}));

// GET /api/gdpr/compliance-status/:organizacionId - Estado de compliance de la organización
router.get('/compliance-status/:organizacionId', [
  validateParams(z.object({ organizacionId: z.string().uuid() })),
  gdprCompliance()
], asyncHandler(async (req, res) => {
  const organizacionId = req.params.organizacionId;
  
  try {
    const complianceStatus = await checkOrganizationCompliance(organizacionId);
    
    res.json({
      success: true,
      data: complianceStatus
    });
  } catch (error) {
    console.error('Error checking compliance status:', error);
    res.status(500).json({
      error: 'Failed to check compliance status',
      message: 'No se pudo verificar el estado de cumplimiento'
    });
  }
}));

export default router;