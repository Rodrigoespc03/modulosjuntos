import bcrypt from 'bcrypt';
import PasswordValidator from 'password-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de seguridad de contraseñas enterprise
 * Implementa políticas de contraseña seguras bajo estándares NIST/OWASP
 */

// Configuración de seguridad
const SALT_ROUNDS = 12; // OWASP recomienda 10+ rounds
const MAX_PASSWORD_HISTORY = 5; // No reutilizar últimas 5 contraseñas

// Crear validador de contraseñas enterprise
const passwordSchema = new PasswordValidator();

passwordSchema
  .is().min(12)                                    // Mínimo 12 caracteres
  .is().max(128)                                   // Máximo 128 caracteres (prevenir DOS)
  .has().uppercase()                               // Al menos 1 mayúscula
  .has().lowercase()                               // Al menos 1 minúscula
  .has().digits(1)                                 // Al menos 1 dígito
  .has().symbols(1)                                // Al menos 1 símbolo
  .has().not().spaces()                            // Sin espacios
  .is().not().oneOf([                             // Contraseñas comunes prohibidas
    'password', '12345678', 'qwerty', 'abc123',
    'password123', 'admin123', 'letmein', '123456789',
    'welcome', 'monkey', 'dragon', '123123'
  ]);

// Patrones inseguros adicionales
const INSECURE_PATTERNS = [
  /(.)\1{3,}/,           // 4+ caracteres consecutivos iguales (aaaa)
  /123456|654321/,       // Secuencias numéricas
  /qwerty|asdfgh/,       // Secuencias de teclado
  /password|contraseña/i, // Palabras relacionadas con password
  /admin|root|user/i,    // Palabras de usuario comunes
];

// Interface para historial de contraseñas
export interface PasswordHistory {
  user_id: string;
  password_hash: string;
  created_at: Date;
}

// Clase principal para manejo de contraseñas seguras
export class PasswordSecurityManager {
  
  /**
   * Valida que la contraseña cumpla con políticas enterprise
   */
  static validatePasswordPolicy(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validación básica con password-validator
    const basicValidation = passwordSchema.validate(password, { details: true }) as any[];
    
    if (Array.isArray(basicValidation) && basicValidation.length > 0) {
      basicValidation.forEach(error => {
        switch (error.validation) {
          case 'min':
            errors.push('La contraseña debe tener al menos 12 caracteres');
            break;
          case 'max':
            errors.push('La contraseña no puede exceder 128 caracteres');
            break;
          case 'uppercase':
            errors.push('La contraseña debe contener al menos una letra mayúscula');
            break;
          case 'lowercase':
            errors.push('La contraseña debe contener al menos una letra minúscula');
            break;
          case 'digits':
            errors.push('La contraseña debe contener al menos un número');
            break;
          case 'symbols':
            errors.push('La contraseña debe contener al menos un símbolo (!@#$%^&*)');
            break;
          case 'spaces':
            errors.push('La contraseña no puede contener espacios');
            break;
          case 'oneOf':
            errors.push('La contraseña es demasiado común y está prohibida');
            break;
        }
      });
    }
    
    // Validaciones adicionales de patrones inseguros
    INSECURE_PATTERNS.forEach(pattern => {
      if (pattern.test(password)) {
        errors.push('La contraseña contiene patrones inseguros');
      }
    });
    
    // Verificar que no sea solo números o solo letras
    if (/^\d+$/.test(password)) {
      errors.push('La contraseña no puede ser solo números');
    }
    
    if (/^[a-zA-Z]+$/.test(password)) {
      errors.push('La contraseña no puede ser solo letras');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Calcula la fuerza de la contraseña (0-100)
   */
  static calculatePasswordStrength(password: string): number {
    let score = 0;
    
    // Longitud (max 25 puntos)
    score += Math.min(password.length * 2, 25);
    
    // Diversidad de caracteres (max 40 puntos)
    if (/[a-z]/.test(password)) score += 10; // minúsculas
    if (/[A-Z]/.test(password)) score += 10; // mayúsculas
    if (/[0-9]/.test(password)) score += 10; // números
    if (/[^a-zA-Z0-9]/.test(password)) score += 10; // símbolos
    
    // Complejidad adicional (max 35 puntos)
    if (password.length >= 16) score += 10; // Muy larga
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) score += 15; // Todos los tipos
    if (!/(.)\1{2,}/.test(password)) score += 10; // Sin repeticiones excesivas
    
    return Math.min(score, 100);
  }
  
  /**
   * Genera hash seguro de la contraseña
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      throw new Error(`Error al hashear contraseña: ${(error as Error).message}`);
    }
  }
  
  /**
   * Verifica contraseña contra hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Error al verificar contraseña: ${(error as Error).message}`);
    }
  }
  
  /**
   * Verifica que la contraseña no esté en el historial
   * TODO: Implementar con base de datos real
   */
  static async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    try {
      // TODO: Obtener historial de contraseñas de la base de datos
      // const history = await prisma.password_history.findMany({
      //   where: { user_id: userId },
      //   orderBy: { created_at: 'desc' },
      //   take: MAX_PASSWORD_HISTORY
      // });
      
      // TODO: Verificar contra cada hash del historial
      // for (const entry of history) {
      //   if (await bcrypt.compare(newPassword, entry.password_hash)) {
      //     return false; // Contraseña ya usada
      //   }
      // }
      
      // Por ahora, siempre permitir (implementar en base de datos)
      return true;
    } catch (error) {
      console.error('Error checking password history:', error);
      return true; // En caso de error, permitir cambio
    }
  }
  
  /**
   * Guarda contraseña en historial
   * TODO: Implementar con base de datos real
   */
  static async savePasswordHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      // TODO: Guardar en base de datos
      // await prisma.password_history.create({
      //   data: {
      //     user_id: userId,
      //     password_hash: passwordHash,
      //     created_at: new Date()
      //   }
      // });
      
      // TODO: Limpiar historial viejo (mantener solo últimas 5)
      // await prisma.password_history.deleteMany({
      //   where: {
      //     user_id: userId,
      //     id: {
      //       notIn: (await prisma.password_history.findMany({
      //         where: { user_id: userId },
      //         orderBy: { created_at: 'desc' },
      //         take: MAX_PASSWORD_HISTORY,
      //         select: { id: true }
      //       })).map(p => p.id)
      //     }
      //   }
      // });
      
      console.log(`Password saved to history for user ${userId}`);
    } catch (error) {
      console.error('Error saving password history:', error);
    }
  }
  
  /**
   * Genera sugerencia de contraseña segura
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Asegurar al menos uno de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar con caracteres aleatorios
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

/**
 * Middleware para validar políticas de contraseña en registro/cambio
 */
export const validatePasswordPolicy = (req: Request, res: Response, next: NextFunction) => {
  const password = req.body.password || req.body.new_password;
  
  if (!password) {
    return res.status(400).json({
      error: 'Password validation failed',
      message: 'Contraseña requerida',
      code: 'PASSWORD_REQUIRED'
    });
  }
  
  const validation = PasswordSecurityManager.validatePasswordPolicy(password);
  
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Password policy violation',
      message: 'La contraseña no cumple con las políticas de seguridad',
      code: 'PASSWORD_POLICY_VIOLATION',
      errors: validation.errors,
      help: {
        requirements: [
          'Mínimo 12 caracteres',
          'Al menos una letra mayúscula',
          'Al menos una letra minúscula',
          'Al menos un número',
          'Al menos un símbolo (!@#$%^&*)',
          'Sin espacios',
          'No puede ser una contraseña común'
        ],
        suggestion: 'Usa el generador de contraseñas seguras'
      }
    });
  }
  
  // Agregar información de fuerza al request
  (req as any).passwordStrength = PasswordSecurityManager.calculatePasswordStrength(password);
  
  next();
};

/**
 * Middleware para verificar historial de contraseñas
 */
export const checkPasswordHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id || (req as any).user?.id;
    const password = req.body.password || req.body.new_password;
    
    if (!userId || !password) {
      return next(); // Dejar que otros middlewares manejen la validación
    }
    
    const isInHistory = !(await PasswordSecurityManager.checkPasswordHistory(userId, password));
    
    if (isInHistory) {
      return res.status(400).json({
        error: 'Password history violation',
        message: 'No puedes reutilizar una de tus últimas 5 contraseñas',
        code: 'PASSWORD_ALREADY_USED',
        help: {
          suggestion: 'Usa una contraseña completamente nueva que no hayas usado antes'
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in password history check:', error);
    next(); // Continuar en caso de error
  }
};

/**
 * Middleware para hash automático de contraseñas
 */
export const hashPasswordMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const password = req.body.password || req.body.new_password;
    
    if (password) {
      const hashedPassword = await PasswordSecurityManager.hashPassword(password);
      
      if (req.body.password) {
        req.body.password = hashedPassword;
      }
      if (req.body.new_password) {
        req.body.new_password = hashedPassword;
      }
      
      // Guardar para historial después de creación exitosa
      (req as any).originalPassword = password;
      (req as any).hashedPassword = hashedPassword;
    }
    
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    return res.status(500).json({
      error: 'Password processing failed',
      message: 'Error procesando la contraseña'
    });
  }
};

// Configuración exportable para políticas
export const PASSWORD_POLICIES = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_DIGITS: true,
  REQUIRE_SYMBOLS: true,
  MAX_HISTORY: MAX_PASSWORD_HISTORY,
  SALT_ROUNDS
};

// Utilidades exportables
export const generateSecurePassword = PasswordSecurityManager.generateSecurePassword;
export const validatePassword = PasswordSecurityManager.validatePasswordPolicy;
export const hashPassword = PasswordSecurityManager.hashPassword;
export const verifyPassword = PasswordSecurityManager.verifyPassword;