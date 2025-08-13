import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Sistema de Multi-Factor Authentication (2FA/MFA) para Security Hardening
 * Implementa TOTP usando Google Authenticator/Authy con backup codes
 */

// Configuración del sistema 2FA
export const MFA_CONFIG = {
  SERVICE_NAME: 'Sistema Procura',
  ISSUER: 'Procura Medical',
  TOTP_WINDOW: 2, // Ventana de tolerancia (±2 = 60 segundos)
  BACKUP_CODES_COUNT: 8,
  BACKUP_CODE_LENGTH: 8,
  QR_ERROR_CORRECTION: 'M' as const,
  SECRET_LENGTH: 32
};

// Interfaces para 2FA
export interface MfaSecret {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  setup_url: string;
  issuer: string;
  account_name: string;
}

export interface MfaVerification {
  is_valid: boolean;
  used_backup_code?: string;
  remaining_backup_codes?: number;
  error_message?: string;
}

export interface MfaStatus {
  is_enabled: boolean;
  is_verified: boolean;
  backup_codes_remaining: number;
  last_used: Date | null;
  setup_date: Date | null;
}

export interface BackupCode {
  code: string;
  is_used: boolean;
  used_at: Date | null;
  used_ip: string | null;
}

// Store de información 2FA (en memoria para demo, usar base de datos en producción)
class MfaStore {
  private userMfaData: Map<string, {
    secret: string;
    is_enabled: boolean;
    is_verified: boolean;
    backup_codes: BackupCode[];
    setup_date: Date;
    last_used: Date | null;
  }> = new Map();

  setUserMfa(userId: string, data: {
    secret: string;
    backup_codes: string[];
  }) {
    this.userMfaData.set(userId, {
      secret: data.secret,
      is_enabled: false,
      is_verified: false,
      backup_codes: data.backup_codes.map(code => ({
        code,
        is_used: false,
        used_at: null,
        used_ip: null
      })),
      setup_date: new Date(),
      last_used: null
    });
  }

  getUserMfa(userId: string) {
    return this.userMfaData.get(userId);
  }

  enableMfa(userId: string) {
    const userData = this.userMfaData.get(userId);
    if (userData) {
      userData.is_enabled = true;
      userData.is_verified = true;
      this.userMfaData.set(userId, userData);
    }
  }

  disableMfa(userId: string) {
    const userData = this.userMfaData.get(userId);
    if (userData) {
      userData.is_enabled = false;
      userData.is_verified = false;
      userData.last_used = null;
      this.userMfaData.set(userId, userData);
    }
  }

  updateLastUsed(userId: string) {
    const userData = this.userMfaData.get(userId);
    if (userData) {
      userData.last_used = new Date();
      this.userMfaData.set(userId, userData);
    }
  }

  useBackupCode(userId: string, code: string, ipAddress: string): boolean {
    const userData = this.userMfaData.get(userId);
    if (!userData) return false;

    const backupCode = userData.backup_codes.find(
      bc => bc.code === code && !bc.is_used
    );

    if (backupCode) {
      backupCode.is_used = true;
      backupCode.used_at = new Date();
      backupCode.used_ip = ipAddress;
      this.userMfaData.set(userId, userData);
      return true;
    }

    return false;
  }

  regenerateBackupCodes(userId: string): string[] {
    const userData = this.userMfaData.get(userId);
    if (!userData) return [];

    const newCodes = MultiFactorAuth.generateBackupCodes();
    userData.backup_codes = newCodes.map(code => ({
      code,
      is_used: false,
      used_at: null,
      used_ip: null
    }));
    
    this.userMfaData.set(userId, userData);
    return newCodes;
  }

  getBackupCodesStatus(userId: string) {
    const userData = this.userMfaData.get(userId);
    if (!userData) return { total: 0, used: 0, remaining: 0 };

    const used = userData.backup_codes.filter(bc => bc.is_used).length;
    const total = userData.backup_codes.length;
    
    return {
      total,
      used,
      remaining: total - used
    };
  }

  getStats() {
    const stats = {
      total_users: this.userMfaData.size,
      enabled_count: 0,
      verified_count: 0,
      backup_codes_used: 0,
      total_backup_codes: 0
    };

    for (const userData of this.userMfaData.values()) {
      if (userData.is_enabled) stats.enabled_count++;
      if (userData.is_verified) stats.verified_count++;
      
      const usedCodes = userData.backup_codes.filter(bc => bc.is_used).length;
      stats.backup_codes_used += usedCodes;
      stats.total_backup_codes += userData.backup_codes.length;
    }

    return stats;
  }

  clear() {
    this.userMfaData.clear();
  }
}

// Instancia global del MFA store
export const mfaStore = new MfaStore();

// Clase principal para Multi-Factor Authentication
export class MultiFactorAuth {

  /**
   * Genera un secreto 2FA y QR code para setup
   */
  static async generateMfaSecret(userId: string, userEmail: string): Promise<MfaSecret> {
    try {
      // Generar secreto usando speakeasy
      const secret = speakeasy.generateSecret({
        name: `${userEmail} (${MFA_CONFIG.SERVICE_NAME})`,
        issuer: MFA_CONFIG.ISSUER,
        length: MFA_CONFIG.SECRET_LENGTH
      });

      if (!secret.otpauth_url) {
        throw new Error('Failed to generate OTP auth URL');
      }

      // Generar códigos de respaldo
      const backupCodes = this.generateBackupCodes();

      // Generar QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url, {
        errorCorrectionLevel: MFA_CONFIG.QR_ERROR_CORRECTION,
        type: 'image/png' as const,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Guardar en store (sin habilitar aún)
      mfaStore.setUserMfa(userId, {
        secret: secret.base32,
        backup_codes: backupCodes
      });

      return {
        secret: secret.base32,
        qr_code: qrCode,
        backup_codes: backupCodes,
        setup_url: secret.otpauth_url,
        issuer: MFA_CONFIG.ISSUER,
        account_name: `${userEmail} (${MFA_CONFIG.SERVICE_NAME})`
      };
    } catch (error) {
      console.error('Error generating MFA secret:', error);
      throw new Error(`Failed to generate MFA secret: ${(error as Error).message}`);
    }
  }

  /**
   * Verifica un código TOTP o código de respaldo
   */
  static verifyMfaCode(
    userId: string, 
    code: string, 
    ipAddress: string = 'unknown'
  ): MfaVerification {
    try {
      const userData = mfaStore.getUserMfa(userId);
      
      if (!userData || !userData.is_enabled) {
        return {
          is_valid: false,
          error_message: 'MFA not enabled for this user'
        };
      }

      // Limpiar código de entrada
      const cleanCode = code.replace(/\s+/g, '').trim();

      // Intentar verificar como código TOTP
      if (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode)) {
        const isValidTotp = speakeasy.totp.verify({
          secret: userData.secret,
          encoding: 'base32',
          token: cleanCode,
          window: MFA_CONFIG.TOTP_WINDOW
        });

        if (isValidTotp) {
          mfaStore.updateLastUsed(userId);
          const backupStatus = mfaStore.getBackupCodesStatus(userId);
          
          return {
            is_valid: true,
            remaining_backup_codes: backupStatus.remaining
          };
        }
      }

      // Intentar verificar como código de respaldo
      if (cleanCode.length === MFA_CONFIG.BACKUP_CODE_LENGTH && /^[A-Z0-9]+$/.test(cleanCode.toUpperCase())) {
        const backupCodeUsed = mfaStore.useBackupCode(userId, cleanCode.toUpperCase(), ipAddress);
        
        if (backupCodeUsed) {
          mfaStore.updateLastUsed(userId);
          const backupStatus = mfaStore.getBackupCodesStatus(userId);
          
          console.log(`🔐 Backup code used by user ${userId} from IP ${ipAddress}`);
          
          return {
            is_valid: true,
            used_backup_code: cleanCode.toUpperCase(),
            remaining_backup_codes: backupStatus.remaining
          };
        }
      }

      return {
        is_valid: false,
        error_message: 'Invalid verification code'
      };
    } catch (error) {
      console.error('Error verifying MFA code:', error);
      return {
        is_valid: false,
        error_message: 'Verification failed due to internal error'
      };
    }
  }

  /**
   * Habilita 2FA después de verificar el setup inicial
   */
  static enableMfa(userId: string, setupCode: string): MfaVerification {
    try {
      const userData = mfaStore.getUserMfa(userId);
      
      if (!userData) {
        return {
          is_valid: false,
          error_message: 'No MFA setup found for user'
        };
      }

      if (userData.is_enabled) {
        return {
          is_valid: false,
          error_message: 'MFA is already enabled'
        };
      }

      // Verificar código de setup
      const isValidSetup = speakeasy.totp.verify({
        secret: userData.secret,
        encoding: 'base32',
        token: setupCode.replace(/\s+/g, '').trim(),
        window: MFA_CONFIG.TOTP_WINDOW
      });

      if (isValidSetup) {
        mfaStore.enableMfa(userId);
        console.log(`🔐 MFA enabled for user ${userId}`);
        
        const backupStatus = mfaStore.getBackupCodesStatus(userId);
        
        return {
          is_valid: true,
          remaining_backup_codes: backupStatus.remaining
        };
      }

      return {
        is_valid: false,
        error_message: 'Invalid setup code'
      };
    } catch (error) {
      console.error('Error enabling MFA:', error);
      return {
        is_valid: false,
        error_message: 'Failed to enable MFA due to internal error'
      };
    }
  }

  /**
   * Deshabilita 2FA (requiere verificación)
   */
  static disableMfa(userId: string, verificationCode: string): MfaVerification {
    try {
      // Verificar código antes de deshabilitar
      const verification = this.verifyMfaCode(userId, verificationCode);
      
      if (verification.is_valid) {
        mfaStore.disableMfa(userId);
        console.log(`🔓 MFA disabled for user ${userId}`);
        
        return {
          is_valid: true,
          remaining_backup_codes: 0
        };
      }

      return verification;
    } catch (error) {
      console.error('Error disabling MFA:', error);
      return {
        is_valid: false,
        error_message: 'Failed to disable MFA due to internal error'
      };
    }
  }

  /**
   * Obtiene el estado actual del 2FA para un usuario
   */
  static getMfaStatus(userId: string): MfaStatus {
    const userData = mfaStore.getUserMfa(userId);
    
    if (!userData) {
      return {
        is_enabled: false,
        is_verified: false,
        backup_codes_remaining: 0,
        last_used: null,
        setup_date: null
      };
    }

    const backupStatus = mfaStore.getBackupCodesStatus(userId);

    return {
      is_enabled: userData.is_enabled,
      is_verified: userData.is_verified,
      backup_codes_remaining: backupStatus.remaining,
      last_used: userData.last_used,
      setup_date: userData.setup_date
    };
  }

  /**
   * Regenera códigos de respaldo
   */
  static regenerateBackupCodes(userId: string, verificationCode: string): { 
    success: boolean; 
    backup_codes?: string[]; 
    error_message?: string 
  } {
    try {
      // Verificar código antes de regenerar
      const verification = this.verifyMfaCode(userId, verificationCode);
      
      if (!verification.is_valid) {
        return {
          success: false,
          error_message: verification.error_message || 'Invalid verification code'
        };
      }

      const newCodes = mfaStore.regenerateBackupCodes(userId);
      
      if (newCodes.length === 0) {
        return {
          success: false,
          error_message: 'User not found or MFA not set up'
        };
      }

      console.log(`🔄 Backup codes regenerated for user ${userId}`);

      return {
        success: true,
        backup_codes: newCodes
      };
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      return {
        success: false,
        error_message: 'Failed to regenerate backup codes'
      };
    }
  }

  /**
   * Genera códigos de respaldo seguros
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < MFA_CONFIG.BACKUP_CODES_COUNT; i++) {
      // Generar código alfanumérico de 8 caracteres
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .substring(0, MFA_CONFIG.BACKUP_CODE_LENGTH);
      
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Verifica si el usuario requiere 2FA basado en su rol
   */
  static requiresMfa(userRole: string): boolean {
    // Roles que requieren 2FA obligatorio
    const mfaRequiredRoles = ['ADMINISTRADOR'];
    return mfaRequiredRoles.includes(userRole);
  }

  /**
   * Obtiene estadísticas del sistema 2FA
   */
  static getMfaSystemStats() {
    return {
      ...mfaStore.getStats(),
      config: {
        service_name: MFA_CONFIG.SERVICE_NAME,
        issuer: MFA_CONFIG.ISSUER,
        totp_window: MFA_CONFIG.TOTP_WINDOW,
        backup_codes_count: MFA_CONFIG.BACKUP_CODES_COUNT,
        backup_code_length: MFA_CONFIG.BACKUP_CODE_LENGTH
      }
    };
  }

  /**
   * Limpia todos los datos 2FA (solo para testing/demo)
   */
  static clearAllMfaData() {
    mfaStore.clear();
    console.log('🧹 All MFA data cleared');
  }
}

// Utilidades para generar códigos temporales de testing
export const generateTestTotpCode = (secret: string): string => {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });
};

// Cleanup al cerrar la aplicación
process.on('SIGINT', () => {
  console.log('🔐 MFA system shutting down...');
});

process.on('SIGTERM', () => {
  console.log('🔐 MFA system shutting down...');
});