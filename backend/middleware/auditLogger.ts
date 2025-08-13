import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware de audit logging para GDPR compliance
 * Registra todas las actividades relacionadas con datos personales
 */

// Tipos de actividades que requieren audit log
export const AUDIT_ACTIVITIES = {
  // Acceso a datos
  DATA_ACCESS: 'data_accessed',
  DATA_VIEW: 'data_viewed',
  DATA_SEARCH: 'data_searched',
  
  // Modificación de datos
  DATA_CREATE: 'data_created',
  DATA_UPDATE: 'data_updated',
  DATA_DELETE: 'data_deleted',
  
  // Exportación y transferencia
  DATA_EXPORT: 'data_exported',
  DATA_DOWNLOAD: 'data_downloaded',
  DATA_TRANSFER: 'data_transferred',
  
  // Consentimiento
  CONSENT_GIVEN: 'consent_given',
  CONSENT_WITHDRAWN: 'consent_withdrawn',
  CONSENT_UPDATED: 'consent_updated',
  
  // Derechos del titular
  ACCESS_REQUEST: 'access_request_made',
  RECTIFICATION_REQUEST: 'rectification_request_made',
  ERASURE_REQUEST: 'erasure_request_made',
  PORTABILITY_REQUEST: 'portability_request_made',
  
  // Seguridad
  LOGIN_ATTEMPT: 'login_attempted',
  LOGIN_SUCCESS: 'login_successful',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PERMISSION_DENIED: 'permission_denied',
  
  // Violaciones
  BREACH_DETECTED: 'breach_detected',
  UNAUTHORIZED_ACCESS: 'unauthorized_access_attempted',
  
  // Procesamiento automático
  AUTOMATED_PROCESSING: 'automated_processing_performed',
  ALGORITHM_DECISION: 'algorithm_decision_made'
} as const;

// Categorías de datos personales bajo GDPR
export const DATA_CATEGORIES = {
  PERSONAL_IDENTIFIERS: 'personal_identifiers',
  MEDICAL_DATA: 'medical_data',
  FINANCIAL_DATA: 'financial_data',
  CONTACT_INFO: 'contact_information',
  DEMOGRAPHIC_DATA: 'demographic_data',
  BEHAVIORAL_DATA: 'behavioral_data',
  BIOMETRIC_DATA: 'biometric_data',
  LOCATION_DATA: 'location_data'
} as const;

// Bases legales bajo GDPR Art. 6
export const LEGAL_BASIS = {
  CONSENT: 'consent',
  CONTRACT: 'contract',
  LEGAL_OBLIGATION: 'legal_obligation',
  VITAL_INTERESTS: 'vital_interests',
  PUBLIC_TASK: 'public_task',
  LEGITIMATE_INTERESTS: 'legitimate_interests'
} as const;

// Interface para entrada de audit log
export interface AuditLogEntry {
  activity_id: string;
  timestamp: Date;
  user_id?: string;
  paciente_id?: string;
  organizacion_id?: string;
  
  // Actividad
  activity_type: string;
  description: string;
  legal_basis: string;
  purpose: string;
  
  // Contexto técnico
  ip_address: string;
  user_agent?: string;
  session_id?: string;
  endpoint: string;
  http_method: string;
  
  // Datos involucrados
  data_categories: string[];
  fields_accessed?: string[];
  records_affected?: number;
  
  // Resultado
  status: 'successful' | 'failed' | 'partial';
  error_message?: string;
  
  // Metadatos adicionales
  additional_context?: Record<string, any>;
}

// Almacenamiento en memoria (en producción usar base de datos)
class AuditLogStore {
  private logs: AuditLogEntry[] = [];
  private readonly maxLogs = 10000; // Mantener últimos 10K logs en memoria

  add(entry: AuditLogEntry) {
    this.logs.push(entry);
    
    // Mantener solo los logs más recientes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // En producción, también guardar en base de datos
    this.persistToDatabase(entry);
  }

  private async persistToDatabase(entry: AuditLogEntry) {
    try {
      // TODO: Implementar persistencia en base de datos
      // await prisma.gdpr_audit_logs.create({ data: entry });
      console.log('📋 Audit Log:', entry.activity_type, '-', entry.description);
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  }

  getLogs(filters?: {
    user_id?: string;
    paciente_id?: string;
    activity_type?: string;
    from_date?: Date;
    to_date?: Date;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.user_id) {
        filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id);
      }
      if (filters.paciente_id) {
        filteredLogs = filteredLogs.filter(log => log.paciente_id === filters.paciente_id);
      }
      if (filters.activity_type) {
        filteredLogs = filteredLogs.filter(log => log.activity_type === filters.activity_type);
      }
      if (filters.from_date) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.from_date!);
      }
      if (filters.to_date) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.to_date!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getStats() {
    const totalLogs = this.logs.length;
    const last24h = this.logs.filter(log => 
      log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    
    const activitiesByType = this.logs.reduce((acc, log) => {
      acc[log.activity_type] = (acc[log.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      last24h,
      activitiesByType
    };
  }
}

// Instancia global del audit store
export const auditStore = new AuditLogStore();

// Clase principal del audit logger
export class GdprAuditLogger {
  
  static log(params: {
    activity_type: string;
    description: string;
    legal_basis: string;
    purpose: string;
    req: Request;
    user_id?: string;
    paciente_id?: string;
    organizacion_id?: string;
    data_categories: string[];
    fields_accessed?: string[];
    records_affected?: number;
    status?: 'successful' | 'failed' | 'partial';
    error_message?: string;
    additional_context?: Record<string, any>;
  }) {
    const entry: AuditLogEntry = {
      activity_id: uuidv4(),
      timestamp: new Date(),
      
      // IDs
      user_id: params.user_id,
      paciente_id: params.paciente_id,
      organizacion_id: params.organizacion_id,
      
      // Actividad
      activity_type: params.activity_type,
      description: params.description,
      legal_basis: params.legal_basis,
      purpose: params.purpose,
      
      // Contexto técnico
      ip_address: this.getClientIP(params.req),
      user_agent: params.req.get('User-Agent'),
      session_id: params.req.sessionID,
      endpoint: params.req.originalUrl,
      http_method: params.req.method,
      
      // Datos
      data_categories: params.data_categories,
      fields_accessed: params.fields_accessed,
      records_affected: params.records_affected,
      
      // Resultado
      status: params.status || 'successful',
      error_message: params.error_message,
      
      // Contexto adicional
      additional_context: params.additional_context
    };

    auditStore.add(entry);
  }

  private static getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  // Método para loggear acceso a datos de paciente
  static logPatientDataAccess(req: Request, pacienteId: string, fieldsAccessed: string[]) {
    this.log({
      activity_type: AUDIT_ACTIVITIES.DATA_ACCESS,
      description: `Acceso a datos del paciente ${pacienteId}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Provisión de atención médica',
      req,
      user_id: (req as any).user?.id,
      paciente_id: pacienteId,
      organizacion_id: (req as any).user?.organizacion_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
      fields_accessed: fieldsAccessed
    });
  }

  // Método para loggear modificación de datos
  static logDataModification(req: Request, pacienteId: string, operation: 'create' | 'update' | 'delete', fieldsModified: string[]) {
    const activityType = operation === 'create' ? AUDIT_ACTIVITIES.DATA_CREATE :
                        operation === 'update' ? AUDIT_ACTIVITIES.DATA_UPDATE :
                        AUDIT_ACTIVITIES.DATA_DELETE;

    this.log({
      activity_type: activityType,
      description: `${operation.toUpperCase()} de datos del paciente ${pacienteId}`,
      legal_basis: LEGAL_BASIS.CONTRACT,
      purpose: 'Gestión de expediente médico',
      req,
      user_id: (req as any).user?.id,
      paciente_id: pacienteId,
      organizacion_id: (req as any).user?.organizacion_id,
      data_categories: [DATA_CATEGORIES.MEDICAL_DATA],
      fields_accessed: fieldsModified,
      records_affected: 1
    });
  }

  // Método para loggear exportación de datos
  static logDataExport(req: Request, pacienteId: string, format: string, fieldsExported: string[]) {
    this.log({
      activity_type: AUDIT_ACTIVITIES.DATA_EXPORT,
      description: `Exportación de datos del paciente ${pacienteId} en formato ${format}`,
      legal_basis: LEGAL_BASIS.CONSENT,
      purpose: 'Ejercicio del derecho de portabilidad de datos',
      req,
      user_id: (req as any).user?.id,
      paciente_id: pacienteId,
      organizacion_id: (req as any).user?.organizacion_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
      fields_accessed: fieldsExported,
      additional_context: { export_format: format }
    });
  }

  // Método para loggear intento de acceso denegado
  static logAccessDenied(req: Request, reason: string, attemptedResource?: string) {
    this.log({
      activity_type: AUDIT_ACTIVITIES.PERMISSION_DENIED,
      description: `Acceso denegado: ${reason}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Seguridad del sistema',
      req,
      user_id: (req as any).user?.id,
      organizacion_id: (req as any).user?.organizacion_id,
      data_categories: [],
      status: 'failed',
      error_message: reason,
      additional_context: { attempted_resource: attemptedResource }
    });
  }
}

// Middleware para audit logging automático
export const auditMiddleware = (options: {
  activity_type: string;
  description: string;
  legal_basis?: string;
  purpose?: string;
  data_categories?: string[];
  extract_patient_id?: (req: Request) => string | undefined;
  extract_fields?: (req: Request) => string[];
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Interceptar la respuesta para loggear el resultado
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'successful' : 'failed';
      const error_message = status === 'failed' ? `HTTP ${res.statusCode}` : undefined;
      
      GdprAuditLogger.log({
        activity_type: options.activity_type,
        description: options.description,
        legal_basis: options.legal_basis || LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: options.purpose || 'Operación del sistema',
        req,
        user_id: (req as any).user?.id,
        paciente_id: options.extract_patient_id?.(req),
        organizacion_id: (req as any).user?.organizacion_id,
        data_categories: options.data_categories || [],
        fields_accessed: options.extract_fields?.(req),
        status,
        error_message
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware específico para endpoints de pacientes
export const auditPatientAccess = auditMiddleware({
  activity_type: AUDIT_ACTIVITIES.DATA_ACCESS,
  description: 'Acceso a datos de paciente',
  legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
  purpose: 'Provisión de atención médica',
  data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
  extract_patient_id: (req) => req.params.id || req.body.paciente_id,
  extract_fields: (req) => Object.keys(req.body || {})
});

// Middleware específico para endpoints de cobros
export const auditFinancialAccess = auditMiddleware({
  activity_type: AUDIT_ACTIVITIES.DATA_ACCESS,
  description: 'Acceso a datos financieros',
  legal_basis: LEGAL_BASIS.CONTRACT,
  purpose: 'Gestión de facturación médica',
  data_categories: [DATA_CATEGORIES.FINANCIAL_DATA, DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
  extract_patient_id: (req) => req.body.paciente_id,
  extract_fields: (req) => ['monto', 'metodo_pago', 'fecha']
});

// Funciones de utilidad para obtener estadísticas de audit
export const getAuditStats = () => auditStore.getStats();

export const getAuditLogs = (filters?: {
  user_id?: string;
  paciente_id?: string;
  activity_type?: string;
  from_date?: Date;
  to_date?: Date;
}) => auditStore.getLogs(filters);

// Función para detectar patrones sospechosos
export const detectSuspiciousActivity = () => {
  const logs = auditStore.getLogs({
    from_date: new Date(Date.now() - 60 * 60 * 1000) // Última hora
  });

  const suspiciousPatterns = [];

  // Detectar muchos accesos fallidos
  const failedAttempts = logs.filter(log => log.status === 'failed').length;
  if (failedAttempts > 10) {
    suspiciousPatterns.push(`${failedAttempts} intentos fallidos en la última hora`);
  }

  // Detectar acceso a muchos pacientes diferentes por mismo usuario
  const accessesByUser = logs.reduce((acc, log) => {
    if (log.user_id && log.paciente_id) {
      if (!acc[log.user_id]) acc[log.user_id] = new Set();
      acc[log.user_id].add(log.paciente_id);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  Object.entries(accessesByUser).forEach(([userId, patients]) => {
    if (patients.size > 20) {
      suspiciousPatterns.push(`Usuario ${userId} accedió a ${patients.size} pacientes diferentes en una hora`);
    }
  });

  return suspiciousPatterns;
};