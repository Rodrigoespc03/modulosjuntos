import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GdprAuditLogger, AUDIT_ACTIVITIES, DATA_CATEGORIES, LEGAL_BASIS } from './auditLogger';
import { medicalEncryption } from '../utils/encryption';

/**
 * Middleware de GDPR compliance para asegurar el cumplimiento legal
 * Implementa verificaciones automáticas y controles de acceso
 */

// Extender Request para incluir información GDPR
declare global {
  namespace Express {
    interface Request {
      gdprContext?: {
        hasValidConsent: boolean;
        consentTypes: string[];
        legalBasis: string;
        dataCategories: string[];
        purpose: string;
        retentionPeriod?: string;
      };
    }
  }
}

// Configuración GDPR por endpoint
interface GdprEndpointConfig {
  dataCategories: string[];
  legalBasis: string;
  purpose: string;
  consentRequired: boolean;
  sensitiveData: boolean;
  retentionPeriod?: string;
  internationalTransfer?: boolean;
  automatedDecisionMaking?: boolean;
}

// Configuraciones predefinidas para diferentes tipos de endpoints
export const GDPR_ENDPOINT_CONFIGS: Record<string, GdprEndpointConfig> = {
  // Endpoints de pacientes
  'GET:/api/pacientes': {
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
    purpose: 'Gestión de expedientes médicos',
    consentRequired: false,
    sensitiveData: true,
    retentionPeriod: '10 años'
  },
  
  'POST:/api/pacientes': {
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.CONTRACT,
    purpose: 'Registro de nuevo paciente',
    consentRequired: true,
    sensitiveData: true,
    retentionPeriod: '10 años'
  },
  
  'PUT:/api/pacientes': {
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.CONTRACT,
    purpose: 'Actualización de expediente médico',
    consentRequired: false,
    sensitiveData: true
  },
  
  // Endpoints de cobros
  'GET:/api/cobros': {
    dataCategories: [DATA_CATEGORIES.FINANCIAL_DATA, DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
    legalBasis: LEGAL_BASIS.CONTRACT,
    purpose: 'Gestión de facturación',
    consentRequired: false,
    sensitiveData: false,
    retentionPeriod: '7 años'
  },
  
  'POST:/api/cobros': {
    dataCategories: [DATA_CATEGORIES.FINANCIAL_DATA, DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
    legalBasis: LEGAL_BASIS.CONTRACT,
    purpose: 'Procesamiento de pagos',
    consentRequired: false,
    sensitiveData: false,
    retentionPeriod: '7 años'
  },
  
  // Endpoints de citas
  'POST:/api/citas': {
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.CONTRACT,
    purpose: 'Programación de citas médicas',
    consentRequired: false,
    sensitiveData: true
  },
  
  // Endpoints de exportación - requieren consentimiento explícito
  'GET:/api/pacientes/*/export': {
    dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS, DATA_CATEGORIES.MEDICAL_DATA],
    legalBasis: LEGAL_BASIS.CONSENT,
    purpose: 'Ejercicio del derecho de portabilidad',
    consentRequired: true,
    sensitiveData: true,
    internationalTransfer: true
  },
  
  // Endpoints de marketing - requieren consentimiento específico
  'POST:/api/marketing': {
    dataCategories: [DATA_CATEGORIES.CONTACT_INFO, DATA_CATEGORIES.BEHAVIORAL_DATA],
    legalBasis: LEGAL_BASIS.CONSENT,
    purpose: 'Comunicaciones de marketing',
    consentRequired: true,
    sensitiveData: false
  }
};

// Clase principal para verificación de GDPR compliance
export class GdprComplianceChecker {
  
  /**
   * Verifica si existe consentimiento válido para el procesamiento
   */
  static async checkConsent(pacienteId: string, requiredConsentTypes: string[]): Promise<boolean> {
    try {
      // TODO: Implementar verificación real contra base de datos
      // const consents = await prisma.gdpr_consents.findMany({
      //   where: {
      //     paciente_id: pacienteId,
      //     consent_withdrawn: false,
      //     consent_expiry: { gt: new Date() }
      //   }
      // });
      
      // Por ahora, simulamos que existe consentimiento
      return true;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }
  
  /**
   * Verifica si los datos están dentro del período de retención
   */
  static async checkRetentionPeriod(pacienteId: string, retentionPeriod: string): Promise<boolean> {
    try {
      // TODO: Implementar verificación real
      // const patient = await prisma.pacientes.findUnique({
      //   where: { id: pacienteId },
      //   select: { created_at: true }
      // });
      
      // Calcular si está dentro del período de retención
      // const retentionDays = this.parseRetentionPeriod(retentionPeriod);
      // const expiryDate = new Date(patient.created_at);
      // expiryDate.setDate(expiryDate.getDate() + retentionDays);
      
      // return new Date() <= expiryDate;
      return true;
    } catch (error) {
      console.error('Error checking retention period:', error);
      return false;
    }
  }
  
  /**
   * Verifica si el usuario tiene autorización para acceder a los datos
   */
  static async checkDataAccessAuthorization(userId: string, pacienteId: string, dataCategories: string[]): Promise<boolean> {
    try {
      // TODO: Implementar verificación real de permisos
      // const user = await prisma.usuarios.findUnique({
      //   where: { id: userId },
      //   include: { roles: true, permisos: true }
      // });
      
      // Verificar si el usuario tiene permisos para acceder a las categorías de datos
      return true;
    } catch (error) {
      console.error('Error checking data access authorization:', error);
      return false;
    }
  }
  
  /**
   * Convierte período de retención en días
   */
  static parseRetentionPeriod(period: string): number {
    const match = period.match(/(\d+)\s*(día|días|año|años|mes|meses)/i);
    if (!match) return 365; // Default 1 año
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'día':
      case 'días':
        return value;
      case 'mes':
      case 'meses':
        return value * 30;
      case 'año':
      case 'años':
        return value * 365;
      default:
        return 365;
    }
  }
}

/**
 * Middleware principal de GDPR compliance
 */
export const gdprCompliance = (config?: Partial<GdprEndpointConfig>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const endpoint = `${req.method}:${req.route?.path || req.path}`;
      const endpointConfig = config || GDPR_ENDPOINT_CONFIGS[endpoint] || {
        dataCategories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
        legalBasis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: 'Operación del sistema',
        consentRequired: false,
        sensitiveData: false
      };

      // Extraer ID del paciente si está disponible
      const pacienteId = req.params.id || req.body.paciente_id || req.query.paciente_id as string;
      const userId = (req as any).user?.id;

      // 1. Verificar consentimiento si es requerido
      if (endpointConfig.consentRequired && pacienteId) {
        const hasConsent = await GdprComplianceChecker.checkConsent(pacienteId, ['data_processing']);
        
        if (!hasConsent) {
          GdprAuditLogger.log({
            activity_type: AUDIT_ACTIVITIES.PERMISSION_DENIED,
            description: 'Acceso denegado por falta de consentimiento GDPR',
            legal_basis: endpointConfig.legalBasis,
            purpose: endpointConfig.purpose,
            req,
            user_id: userId,
            paciente_id: pacienteId,
            organizacion_id: (req as any).user?.organizacion_id,
            data_categories: endpointConfig.dataCategories,
            status: 'failed',
            error_message: 'Consentimiento GDPR requerido no encontrado'
          });

          return res.status(403).json({
            error: 'GDPR Compliance Error',
            message: 'Se requiere consentimiento explícito del paciente para esta operación',
            code: 'GDPR_CONSENT_REQUIRED',
            next_steps: [
              'Obtener consentimiento explícito del paciente',
              'Documentar base legal para el procesamiento',
              'Actualizar el registro de consentimientos'
            ]
          });
        }
      }

      // 2. Verificar período de retención
      if (endpointConfig.retentionPeriod && pacienteId) {
        const withinRetention = await GdprComplianceChecker.checkRetentionPeriod(pacienteId, endpointConfig.retentionPeriod);
        
        if (!withinRetention) {
          GdprAuditLogger.log({
            activity_type: AUDIT_ACTIVITIES.PERMISSION_DENIED,
            description: 'Acceso denegado por expiración del período de retención',
            legal_basis: endpointConfig.legalBasis,
            purpose: endpointConfig.purpose,
            req,
            user_id: userId,
            paciente_id: pacienteId,
            organizacion_id: (req as any).user?.organizacion_id,
            data_categories: endpointConfig.dataCategories,
            status: 'failed',
            error_message: 'Datos fuera del período de retención'
          });

          return res.status(410).json({
            error: 'Data Retention Violation',
            message: 'Los datos solicitados han excedido el período de retención legal',
            code: 'GDPR_RETENTION_EXPIRED',
            retention_period: endpointConfig.retentionPeriod
          });
        }
      }

      // 3. Verificar autorización de acceso a datos
      if (userId && pacienteId) {
        const hasAccess = await GdprComplianceChecker.checkDataAccessAuthorization(userId, pacienteId, endpointConfig.dataCategories);
        
        if (!hasAccess) {
          GdprAuditLogger.log({
            activity_type: AUDIT_ACTIVITIES.PERMISSION_DENIED,
            description: 'Acceso denegado por falta de autorización',
            legal_basis: endpointConfig.legalBasis,
            purpose: endpointConfig.purpose,
            req,
            user_id: userId,
            paciente_id: pacienteId,
            organizacion_id: (req as any).user?.organizacion_id,
            data_categories: endpointConfig.dataCategories,
            status: 'failed',
            error_message: 'Usuario no autorizado para acceder a esta categoría de datos'
          });

          return res.status(403).json({
            error: 'Authorization Error',
            message: 'No tiene autorización para acceder a esta categoría de datos',
            code: 'GDPR_ACCESS_DENIED'
          });
        }
      }

      // 4. Agregar contexto GDPR a la request
      req.gdprContext = {
        hasValidConsent: !endpointConfig.consentRequired || pacienteId ? await GdprComplianceChecker.checkConsent(pacienteId, ['data_processing']) : true,
        consentTypes: ['data_processing'], // TODO: obtener tipos reales
        legalBasis: endpointConfig.legalBasis,
        dataCategories: endpointConfig.dataCategories,
        purpose: endpointConfig.purpose,
        retentionPeriod: endpointConfig.retentionPeriod
      };

      // 5. Loggear acceso exitoso
      GdprAuditLogger.log({
        activity_type: AUDIT_ACTIVITIES.DATA_ACCESS,
        description: `Acceso autorizado a ${endpoint}`,
        legal_basis: endpointConfig.legalBasis,
        purpose: endpointConfig.purpose,
        req,
        user_id: userId,
        paciente_id: pacienteId,
        organizacion_id: (req as any).user?.organizacion_id,
        data_categories: endpointConfig.dataCategories
      });

      next();
    } catch (error) {
      console.error('GDPR Compliance check failed:', error);
      
      // En caso de error en verificación GDPR, denegar acceso por precaución
      return res.status(500).json({
        error: 'GDPR Compliance Check Failed',
        message: 'No se pudo verificar el cumplimiento de GDPR',
        code: 'GDPR_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware específico para datos médicos sensibles
 */
export const gdprMedicalData = gdprCompliance({
  dataCategories: [DATA_CATEGORIES.MEDICAL_DATA, DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
  legalBasis: LEGAL_BASIS.VITAL_INTERESTS,
  purpose: 'Provisión de atención médica',
  consentRequired: false,
  sensitiveData: true,
  retentionPeriod: '10 años'
});

/**
 * Middleware específico para datos financieros
 */
export const gdprFinancialData = gdprCompliance({
  dataCategories: [DATA_CATEGORIES.FINANCIAL_DATA, DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
  legalBasis: LEGAL_BASIS.CONTRACT,
  purpose: 'Gestión de facturación',
  consentRequired: false,
  sensitiveData: false,
  retentionPeriod: '7 años'
});

/**
 * Middleware específico para marketing y comunicaciones
 */
export const gdprMarketingData = gdprCompliance({
  dataCategories: [DATA_CATEGORIES.CONTACT_INFO, DATA_CATEGORIES.BEHAVIORAL_DATA],
  legalBasis: LEGAL_BASIS.CONSENT,
  purpose: 'Comunicaciones de marketing',
  consentRequired: true,
  sensitiveData: false,
  retentionPeriod: '2 años'
});

/**
 * Middleware para detectar transferencias internacionales
 */
export const gdprInternationalTransfer = (allowedCountries: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '';
    
    // TODO: Implementar geo-localización real
    // const country = getCountryFromIP(clientIP);
    const country = 'ES'; // Simular España
    
    if (!allowedCountries.includes(country) && country !== 'ES') {
      GdprAuditLogger.log({
        activity_type: AUDIT_ACTIVITIES.UNAUTHORIZED_ACCESS,
        description: `Intento de acceso desde país no autorizado: ${country}`,
        legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: 'Seguridad de datos',
        req,
        data_categories: [],
        status: 'failed',
        error_message: `Acceso desde ${country} no permitido`,
        additional_context: { client_ip: clientIP, detected_country: country }
      });

      return res.status(403).json({
        error: 'International Transfer Violation',
        message: 'Acceso desde este país no está permitido bajo GDPR',
        code: 'GDPR_INTERNATIONAL_TRANSFER_DENIED'
      });
    }

    next();
  };
};

/**
 * Función para verificar el estado de compliance de una organización
 */
export const checkOrganizationCompliance = async (organizacionId: string) => {
  const checks = {
    consent_management: true, // TODO: verificar si hay sistema de consentimientos
    data_encryption: true,    // TODO: verificar si datos sensibles están encriptados
    audit_logging: true,      // TODO: verificar si audit logs están funcionando
    breach_procedures: false, // TODO: verificar si hay procedimientos de breach
    dpo_appointed: false,     // TODO: verificar si hay DPO designado
    privacy_policy_updated: false, // TODO: verificar última actualización
    retention_policies: true, // TODO: verificar políticas de retención
    individual_rights: true   // TODO: verificar implementación de derechos
  };

  const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;

  return {
    organizacion_id: organizacionId,
    compliance_score: score,
    checks,
    recommendations: generateComplianceRecommendations(checks),
    last_assessment: new Date(),
    next_assessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días
  };
};

function generateComplianceRecommendations(checks: Record<string, boolean>): string[] {
  const recommendations = [];

  if (!checks.breach_procedures) {
    recommendations.push('Implementar procedimientos de notificación de violaciones de datos');
  }
  if (!checks.dpo_appointed) {
    recommendations.push('Designar un Delegado de Protección de Datos (DPO)');
  }
  if (!checks.privacy_policy_updated) {
    recommendations.push('Actualizar la política de privacidad conforme a GDPR');
  }

  return recommendations;
}