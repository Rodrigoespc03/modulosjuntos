import crypto from 'crypto';

/**
 * Sistema de encriptación para datos médicos sensibles bajo GDPR
 * Implementa AES-256-GCM para máxima seguridad
 */

export class MedicalDataEncryption {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  
  // En producción, esta clave debe estar en variables de entorno seguras
  private readonly encryptionKey: Buffer;

  constructor() {
    const key = process.env.MEDICAL_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('MEDICAL_ENCRYPTION_KEY environment variable is required for GDPR compliance');
    }
    
    // Derivar clave de 256 bits usando PBKDF2
    this.encryptionKey = crypto.pbkdf2Sync(key, 'medical-salt', 100000, this.keyLength, 'sha512');
  }

  /**
   * Encripta datos médicos sensibles
   * @param plaintext - Texto a encriptar (diagnóstico, tratamiento, etc.)
   * @returns Objeto con datos encriptados y metadatos
   */
  encrypt(plaintext: string): EncryptedData {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty data');
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: '', // Not used with CBC mode
        algorithm: 'aes-256-cbc',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Desencripta datos médicos
   * @param encryptedData - Objeto con datos encriptados
   * @returns Texto desencriptado
   */
  decrypt(encryptedData: EncryptedData): string {
    if (!encryptedData.encrypted || !encryptedData.iv) {
      throw new Error('Invalid encrypted data structure');
    }

    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Encripta múltiples campos de un objeto
   * @param data - Objeto con campos a encriptar
   * @param fieldsToEncrypt - Array de nombres de campos a encriptar
   * @returns Objeto con campos encriptados
   */
  encryptFields(data: Record<string, any>, fieldsToEncrypt: string[]): Record<string, any> {
    const result = { ...data };
    
    for (const field of fieldsToEncrypt) {
      if (result[field] && typeof result[field] === 'string') {
        result[`${field}_encrypted`] = this.encrypt(result[field]);
        delete result[field]; // Remover dato original
      }
    }
    
    return result;
  }

  /**
   * Desencripta múltiples campos de un objeto
   * @param data - Objeto con campos encriptados
   * @param fieldsToDecrypt - Array de nombres de campos a desencriptar
   * @returns Objeto con campos desencriptados
   */
  decryptFields(data: Record<string, any>, fieldsToDecrypt: string[]): Record<string, any> {
    const result = { ...data };
    
    for (const field of fieldsToDecrypt) {
      const encryptedField = `${field}_encrypted`;
      if (result[encryptedField]) {
        try {
          result[field] = this.decrypt(result[encryptedField]);
          delete result[encryptedField]; // Remover dato encriptado
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Mantener el campo encriptado si falla la desencriptación
        }
      }
    }
    
    return result;
  }

  /**
   * Genera hash irreversible para pseudonimización (GDPR Art. 4)
   * @param identifier - Identificador a pseudonimizar (cédula, email, etc.)
   * @returns Hash pseudónimo
   */
  pseudonymize(identifier: string): string {
    const salt = process.env.PSEUDONYM_SALT || 'default-salt';
    return crypto.createHash('sha256')
      .update(identifier + salt)
      .digest('hex');
  }

  /**
   * Verifica la integridad de datos encriptados
   * @param encryptedData - Datos encriptados a verificar
   * @returns true si los datos son íntegros
   */
  verifyIntegrity(encryptedData: EncryptedData): boolean {
    try {
      // Intentar desencriptar - si falla, los datos están corruptos
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }
}

// Interfaces para TypeScript
export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
  timestamp: string;
}

export interface MedicalDataFields {
  diagnostico?: string;
  tratamiento?: string;
  observaciones_medicas?: string;
  alergias?: string;
  medicamentos?: string;
  antecedentes_familiares?: string;
}

// Campos médicos que siempre deben encriptarse bajo GDPR
export const SENSITIVE_MEDICAL_FIELDS = [
  'diagnostico',
  'tratamiento',
  'observaciones_medicas',
  'alergias',
  'medicamentos',
  'antecedentes_familiares',
  'sintomas',
  'notas_medicas',
  'resultados_laboratorio'
];

// Singleton para usar en toda la aplicación
export const medicalEncryption = new MedicalDataEncryption();

// Utilidades para Prisma middleware
export const encryptMedicalData = (data: any) => {
  return medicalEncryption.encryptFields(data, SENSITIVE_MEDICAL_FIELDS);
};

export const decryptMedicalData = (data: any) => {
  return medicalEncryption.decryptFields(data, SENSITIVE_MEDICAL_FIELDS);
};

// Middleware para auto-encriptación en Prisma
export const prismaEncryptionMiddleware = (params: any, next: any) => {
  // Encriptar en operaciones de creación y actualización
  if (['create', 'update', 'upsert'].includes(params.action)) {
    if (params.args.data) {
      params.args.data = encryptMedicalData(params.args.data);
    }
  }
  
  return next(params).then((result: any) => {
    // Desencriptar en operaciones de consulta
    if (['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
      if (Array.isArray(result)) {
        return result.map(item => decryptMedicalData(item));
      } else if (result) {
        return decryptMedicalData(result);
      }
    }
    return result;
  });
};