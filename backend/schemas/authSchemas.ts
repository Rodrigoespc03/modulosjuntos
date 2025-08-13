import { z } from 'zod';

/**
 * Schemas de validación para autenticación enterprise
 * Incluye validaciones para login, registro, 2FA y gestión de sesiones
 */

// Schema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  remember_me: z.boolean().optional(),
  mfa_token: z.string().optional(),
  device_info: z.object({
    user_agent: z.string().optional(),
    ip_address: z.string().optional(),
    device_id: z.string().optional()
  }).optional()
});

// Schema para registro
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  confirm_password: z.string(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  rol: z.enum(['DOCTOR', 'SECRETARIA', 'ADMINISTRADOR', 'ENFERMERA', 'PACIENTE']),
  organizacion_id: z.string().uuid('ID de organización inválido'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ip_address: z.string().optional(),
  device_info: z.object({
    user_agent: z.string().optional(),
    device_id: z.string().optional()
  }).optional()
}).refine((data) => data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"]
});

// Schema para cambio de contraseña
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'La contraseña actual es requerida'),
  new_password: z.string()
    .min(12, 'La nueva contraseña debe tener al menos 12 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  confirm_new_password: z.string(),
  ip_address: z.string().optional()
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Las nuevas contraseñas no coinciden",
  path: ["confirm_new_password"]
});

// Schema para solicitud de reset de contraseña
export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  ip_address: z.string().optional()
});

// Schema para confirmación de reset de contraseña
export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  new_password: z.string()
    .min(12, 'La nueva contraseña debe tener al menos 12 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  confirm_new_password: z.string(),
  ip_address: z.string().optional()
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Las nuevas contraseñas no coinciden",
  path: ["confirm_new_password"]
});

// Schema para configuración de 2FA
export const setup2FASchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  ip_address: z.string().optional()
});

// Schema para verificación de 2FA
export const verify2FASchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  token: z.string().length(6, 'El token debe tener 6 dígitos'),
  ip_address: z.string().optional()
});

// Schema para refresh token
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token requerido'),
  ip_address: z.string().optional()
});

// Schema para logout
export const logoutSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  session_id: z.string().optional(),
  ip_address: z.string().optional()
});

// Schema para gestión de sesiones
export const sessionManagementSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  action: z.enum(['list', 'terminate', 'terminate_all']),
  session_id: z.string().optional(),
  ip_address: z.string().optional()
});

// Schema para información de sesión
export const sessionInfoSchema = z.object({
  session_id: z.string().min(1, 'ID de sesión requerido'),
  ip_address: z.string().optional()
});

// Schema para verificación de identidad
export const identityVerificationSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  verification_type: z.enum(['email', 'phone', 'document']),
  verification_data: z.string().min(1, 'Datos de verificación requeridos'),
  ip_address: z.string().optional()
});

// Schema para configuración de seguridad
export const securitySettingsSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  mfa_enabled: z.boolean().optional(),
  password_history_enabled: z.boolean().optional(),
  session_timeout: z.number().min(300).max(86400).optional(), // 5 minutos a 24 horas
  max_concurrent_sessions: z.number().min(1).max(10).optional(),
  ip_address: z.string().optional()
});

// Tipos TypeScript exportados
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirm = z.infer<typeof resetPasswordConfirmSchema>;
export type Setup2FA = z.infer<typeof setup2FASchema>;
export type Verify2FA = z.infer<typeof verify2FASchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;
export type Logout = z.infer<typeof logoutSchema>;
export type SessionManagement = z.infer<typeof sessionManagementSchema>;
export type SessionInfo = z.infer<typeof sessionInfoSchema>;
export type IdentityVerification = z.infer<typeof identityVerificationSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;