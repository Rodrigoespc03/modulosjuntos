import { z } from 'zod';

/**
 * Schemas de validación para GDPR compliance
 * Implementa todos los requerimientos legales bajo GDPR
 */

// Schema para consentimiento GDPR
export const gdprConsentSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  consent_type: z.enum(['data_processing', 'marketing', 'third_party', 'cookies']),
  consent_given: z.boolean(),
  legal_basis: z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
  purpose: z.string().min(1, 'Propósito requerido'),
  data_categories: z.array(z.string()).min(1, 'Al menos una categoría de datos requerida'),
  retention_period: z.number().min(1, 'Período de retención requerido'),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  timestamp: z.date().default(() => new Date())
});

// Schema para solicitud de acceso a datos
export const dataAccessRequestSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  request_type: z.enum(['access', 'portability', 'summary']),
  data_categories: z.array(z.string()).optional(),
  date_range: z.object({
    from: z.date().optional(),
    to: z.date().optional()
  }).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  ip_address: z.string().optional(),
  reason: z.string().optional()
});

// Schema para solicitud de rectificación
export const rectificationRequestSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  field_name: z.string().min(1, 'Nombre del campo requerido'),
  current_value: z.string().optional(),
  new_value: z.string().min(1, 'Nuevo valor requerido'),
  reason: z.string().optional(),
  supporting_document: z.string().optional(), // URL o base64 del documento
  ip_address: z.string().optional()
});

// Schema para solicitud de eliminación de datos
export const dataDeletionRequestSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  deletion_type: z.enum(['account', 'specific_data', 'anonymization']),
  data_categories: z.array(z.string()).optional(),
  reason: z.enum(['withdraw_consent', 'data_no_longer_needed', 'objection', 'other']),
  reason_details: z.string().optional(),
  confirmation_required: z.boolean().default(true),
  ip_address: z.string().optional()
});

// Schema para portabilidad de datos
export const dataPortabilitySchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  data_categories: z.array(z.string()).min(1, 'Al menos una categoría requerida'),
  format: z.enum(['json', 'csv', 'xml']).default('json'),
  include_metadata: z.boolean().default(true),
  delivery_method: z.enum(['email', 'download', 'api']).default('email'),
  ip_address: z.string().optional()
});

// Schema para registro de actividades de procesamiento
export const processingActivitySchema = z.object({
  activity_name: z.string().min(1, 'Nombre de actividad requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  legal_basis: z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
  purpose: z.string().min(1, 'Propósito requerido'),
  data_categories: z.array(z.string()).min(1, 'Al menos una categoría requerida'),
  data_subjects: z.array(z.string()).min(1, 'Al menos un sujeto de datos requerido'),
  retention_period: z.number().min(1, 'Período de retención requerido'),
  security_measures: z.array(z.string()).optional(),
  third_party_sharing: z.boolean().default(false),
  third_parties: z.array(z.string()).optional(),
  cross_border_transfer: z.boolean().default(false),
  transfer_countries: z.array(z.string()).optional(),
  risk_assessment: z.enum(['low', 'medium', 'high']).default('low'),
  dpo_contact: z.string().email('Email de DPO inválido').optional()
});

// Schema para registro de violaciones de datos
export const dataBreachSchema = z.object({
  breach_type: z.enum(['unauthorized_access', 'data_loss', 'system_breach', 'human_error', 'other']),
  description: z.string().min(1, 'Descripción requerida'),
  affected_data_categories: z.array(z.string()).min(1, 'Al menos una categoría requerida'),
  affected_data_subjects: z.number().min(1, 'Número de sujetos afectados requerido'),
  breach_date: z.date(),
  detection_date: z.date(),
  notification_date: z.date().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  measures_taken: z.array(z.string()).optional(),
  legal_obligations: z.array(z.string()).optional(),
  reported_to_authority: z.boolean().default(false),
  authority_notification_date: z.date().optional(),
  affected_users_notified: z.boolean().default(false),
  user_notification_date: z.date().optional()
});

// Schema para auditoría GDPR
export const gdprAuditSchema = z.object({
  audit_type: z.enum(['compliance', 'data_processing', 'security', 'consent']),
  scope: z.string().min(1, 'Alcance requerido'),
  auditor: z.string().min(1, 'Auditor requerido'),
  audit_date: z.date(),
  findings: z.array(z.object({
    finding: z.string().min(1, 'Hallazgo requerido'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    recommendation: z.string().optional(),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open')
  })),
  compliance_score: z.number().min(0).max(100),
  next_audit_date: z.date().optional(),
  notes: z.string().optional()
});

// Schema para configuración de GDPR
export const gdprConfigSchema = z.object({
  organization_id: z.string().uuid('ID de organización inválido'),
  dpo_name: z.string().min(1, 'Nombre del DPO requerido'),
  dpo_email: z.string().email('Email del DPO inválido'),
  dpo_phone: z.string().optional(),
  data_retention_policy: z.object({
    default_retention_days: z.number().min(1, 'Período de retención requerido'),
    categories: z.record(z.string(), z.number().min(1)).optional()
  }),
  consent_management: z.object({
    require_explicit_consent: z.boolean().default(true),
    consent_expiry_days: z.number().min(1).default(365),
    allow_withdrawal: z.boolean().default(true),
    withdrawal_grace_period_days: z.number().min(0).default(30)
  }),
  data_subject_rights: z.object({
    enable_access_requests: z.boolean().default(true),
    enable_rectification: z.boolean().default(true),
    enable_erasure: z.boolean().default(true),
    enable_portability: z.boolean().default(true),
    enable_objection: z.boolean().default(true),
    response_time_days: z.number().min(1).max(30).default(30)
  }),
  breach_notification: z.object({
    notification_timeframe_hours: z.number().min(24).max(168).default(72),
    require_dpo_approval: z.boolean().default(true),
    auto_notify_authority: z.boolean().default(false),
    auto_notify_users: z.boolean().default(false)
  })
});

// Schema para configuración de privacidad por organización
export const privacyConfigurationSchema = z.object({
  organizacion_id: z.string().uuid(),
  
  // Configuraciones de retención
  default_retention_period: z.string(),
  automatic_deletion_enabled: z.boolean().default(false),
  
  // Configuraciones de consentimiento
  explicit_consent_required: z.boolean().default(true),
  consent_renewal_period: z.string().optional(),
  
  // Configuraciones de encriptación
  encryption_enabled: z.boolean().default(true),
  pseudonymization_enabled: z.boolean().default(false),
  
  // Configuraciones de transferencia
  international_transfers_allowed: z.boolean().default(false),
  approved_countries: z.array(z.string()).optional(),
  
  // Data Protection Officer
  dpo_name: z.string().optional(),
  dpo_email: z.string().email('Email del DPO inválido').optional(),
  dpo_phone: z.string().optional(),
  
  // Configuraciones de notificación
  breach_notification_email: z.string().email('Email de notificación inválido'),
  auto_notify_individuals: z.boolean().default(false),
  notification_template: z.string().optional(),
  
  created_by_user_id: z.string().uuid(),
  updated_date: z.date()
});

// Schemas para endpoints de respuesta
export const gdprExportResponseSchema = z.object({
  export_id: z.string().uuid(),
  paciente_id: z.string().uuid(),
  exported_data: z.record(z.string(), z.unknown()),
  export_date: z.date(),
  format: z.enum(['json', 'pdf', 'csv', 'xml']),
  file_size: z.number(),
  expires_at: z.date(),
  download_url: z.string().url()
});

export const gdprComplianceStatusSchema = z.object({
  organizacion_id: z.string().uuid(),
  compliance_score: z.number().min(0).max(100),
  
  checks: z.object({
    consent_management: z.boolean(),
    data_encryption: z.boolean(),
    audit_logging: z.boolean(),
    breach_procedures: z.boolean(),
    dpo_appointed: z.boolean(),
    privacy_policy_updated: z.boolean(),
    retention_policies: z.boolean(),
    individual_rights: z.boolean()
  }),
  
  recommendations: z.array(z.string()),
  last_assessment: z.date(),
  next_assessment: z.date()
});

// Tipos TypeScript exportados
export type GdprConsent = z.infer<typeof gdprConsentSchema>;
export type DataAccessRequest = z.infer<typeof dataAccessRequestSchema>;
export type RectificationRequest = z.infer<typeof rectificationRequestSchema>;
export type DataDeletionRequest = z.infer<typeof dataDeletionRequestSchema>;
export type DataPortability = z.infer<typeof dataPortabilitySchema>;
export type ProcessingActivity = z.infer<typeof processingActivitySchema>;
export type DataBreach = z.infer<typeof dataBreachSchema>;
export type GdprAudit = z.infer<typeof gdprAuditSchema>;
export type GdprConfig = z.infer<typeof gdprConfigSchema>;
export type PrivacyConfiguration = z.infer<typeof privacyConfigurationSchema>;
export type GdprExportResponse = z.infer<typeof gdprExportResponseSchema>;
export type GdprComplianceStatus = z.infer<typeof gdprComplianceStatusSchema>;