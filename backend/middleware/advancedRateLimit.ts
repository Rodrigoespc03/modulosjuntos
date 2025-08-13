import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
// import { createClient } from 'redis'; // Para Redis store en producción

/**
 * Sistema de Rate Limiting Avanzado para Security Hardening
 * Implementa límites granulares, escalamiento de penalizaciones y detección de abuso
 */

// Configuración de límites por tipo de endpoint
export const RATE_LIMITS = {
  // Endpoints críticos de autenticación
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.',
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },
  
  PASSWORD_CHANGE: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 cambios de contraseña por hora
    message: 'Demasiados cambios de contraseña. Intente nuevamente en 1 hora.'
  },
  
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 resets por hora
    message: 'Demasiadas solicitudes de reset. Intente nuevamente en 1 hora.'
  },
  
  // Endpoints de API general
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por 15 minutos
    message: 'Demasiadas requests. Intente nuevamente más tarde.'
  },
  
  // Endpoints de creación/modificación de datos
  DATA_MODIFICATION: {
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // 20 operaciones por minuto
    message: 'Demasiadas operaciones de datos. Espere un momento.'
  },
  
  // Endpoints de consulta
  DATA_QUERY: {
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // 60 queries por minuto
    message: 'Demasiadas consultas. Reduzca la frecuencia.'
  },
  
  // Endpoints GDPR (críticos)
  GDPR_OPERATIONS: {
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 5, // 5 operaciones GDPR por día
    message: 'Límite de operaciones GDPR alcanzado. Contacte soporte si necesita más.'
  },
  
  // Endpoints de exportación/reportes
  EXPORT_OPERATIONS: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 exportaciones por hora
    message: 'Demasiadas exportaciones. Intente nuevamente en 1 hora.'
  }
};

// Store en memoria para desarrollo (en producción usar Redis)
class MemoryStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar entradas expiradas cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.hits.entries()) {
      if (now > value.resetTime) {
        this.hits.delete(key);
      }
    }
  }

  incr(key: string, windowMs: number): Promise<{ totalHits: number; resetTime: number }> {
    return new Promise((resolve) => {
      const now = Date.now();
      const resetTime = now + windowMs;
      
      const existing = this.hits.get(key);
      
      if (!existing || now > existing.resetTime) {
        // Nueva ventana
        this.hits.set(key, { count: 1, resetTime });
        resolve({ totalHits: 1, resetTime });
      } else {
        // Incrementar contador existente
        existing.count++;
        this.hits.set(key, existing);
        resolve({ totalHits: existing.count, resetTime: existing.resetTime });
      }
    });
  }

  decrement(key: string): Promise<void> {
    return new Promise((resolve) => {
      const existing = this.hits.get(key);
      if (existing && existing.count > 0) {
        existing.count--;
        this.hits.set(key, existing);
      }
      resolve();
    });
  }

  resetKey(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.hits.delete(key);
      resolve();
    });
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.hits.clear();
  }
}

// Instancia global del store
const memoryStore = new MemoryStore();

// Función para generar key única para rate limiting
const generateKey = (req: Request, identifier: string): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';
  const organizacionId = (req as any).user?.organizacion_id || 'no-org';
  
  // Combinar IP, usuario y organización para key única
  return `${identifier}:${organizacionId}:${userId}:${ip}`;
};

// Función para crear rate limiter personalizado
export const createAdvancedRateLimit = (config: {
  windowMs: number;
  max: number;
  message: string;
  identifier: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  escalatingPenalty?: boolean;
  bypassRoles?: string[];
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar si el usuario tiene rol que puede bypasear límites
      const userRole = (req as any).user?.rol;
      if (config.bypassRoles && userRole && config.bypassRoles.includes(userRole)) {
        return next();
      }

      const key = generateKey(req, config.identifier);
      const result = await memoryStore.incr(key, config.windowMs);
      
      // Headers informativos
      res.set({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.max - result.totalHits).toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      // Verificar si excede el límite
      if (result.totalHits > config.max) {
        // Calcular tiempo de espera con escalamiento opcional
        let retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        
        if (config.escalatingPenalty) {
          // Penalización escalada: cada intento adicional agrega tiempo
          const excessAttempts = result.totalHits - config.max;
          retryAfter += excessAttempts * 60; // +1 minuto por cada intento extra
        }

        res.set({
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Exceeded': result.totalHits.toString()
        });

        // Log del abuso detectado
        console.warn(`🚨 Rate limit exceeded: ${key} - ${result.totalHits}/${config.max} attempts`);
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: config.message,
          details: {
            limit: config.max,
            windowMs: config.windowMs,
            totalAttempts: result.totalHits,
            retryAfter,
            resetTime: new Date(result.resetTime).toISOString()
          }
        });
      }

      // Hook para decrementar en requests exitosos si está configurado
      if (config.skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function(data: any) {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            // Request exitoso, decrementar contador
            memoryStore.decrement(key);
          }
          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      console.error('Error in rate limiting:', error);
      // En caso de error, permitir el request (fail open)
      next();
    }
  };
};

// Rate limiters predefinidos para diferentes casos de uso

// Rate limiter para login (muy estricto)
export const loginRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.LOGIN,
  identifier: 'login',
  escalatingPenalty: true,
  bypassRoles: [] // Nadie puede bypasear
});

// Rate limiter para cambio de contraseña
export const passwordChangeRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.PASSWORD_CHANGE,
  identifier: 'password-change',
  escalatingPenalty: true,
  bypassRoles: ['ADMINISTRADOR']
});

// Rate limiter para reset de contraseña
export const passwordResetRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.PASSWORD_RESET,
  identifier: 'password-reset',
  escalatingPenalty: true,
  bypassRoles: []
});

// Rate limiter para API general
export const apiGeneralRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.API_GENERAL,
  identifier: 'api-general',
  bypassRoles: ['ADMINISTRADOR']
});

// Rate limiter para operaciones de datos
export const dataModificationRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.DATA_MODIFICATION,
  identifier: 'data-modification',
  bypassRoles: ['ADMINISTRADOR']
});

// Rate limiter para consultas de datos
export const dataQueryRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.DATA_QUERY,
  identifier: 'data-query',
  bypassRoles: ['ADMINISTRADOR']
});

// Rate limiter para operaciones GDPR (muy restrictivo)
export const gdprOperationsRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.GDPR_OPERATIONS,
  identifier: 'gdpr-operations',
  escalatingPenalty: false,
  bypassRoles: [] // Nadie puede bypasear GDPR limits
});

// Rate limiter para exportaciones
export const exportOperationsRateLimit = createAdvancedRateLimit({
  ...RATE_LIMITS.EXPORT_OPERATIONS,
  identifier: 'export-operations',
  escalatingPenalty: true,
  bypassRoles: ['ADMINISTRADOR']
});

// Rate limiter inteligente que se ajusta basado en el endpoint
export const smartRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path.toLowerCase();
  const method = req.method;
  
  // Determinar qué rate limiter usar basado en la ruta
  if (path.includes('/login')) {
    return loginRateLimit(req, res, next);
  } else if (path.includes('/password') || path.includes('/change-password')) {
    return passwordChangeRateLimit(req, res, next);
  } else if (path.includes('/reset')) {
    return passwordResetRateLimit(req, res, next);
  } else if (path.includes('/gdpr/')) {
    return gdprOperationsRateLimit(req, res, next);
  } else if (path.includes('/export') || path.includes('/download')) {
    return exportOperationsRateLimit(req, res, next);
  } else if (['POST', 'PUT', 'DELETE'].includes(method)) {
    return dataModificationRateLimit(req, res, next);
  } else {
    return dataQueryRateLimit(req, res, next);
  }
};

// Función para obtener estadísticas de rate limiting
export const getRateLimitStats = () => {
  // En producción, esto consultaría Redis
  return {
    totalKeys: (memoryStore as any).hits.size,
    timestamp: new Date().toISOString(),
    limits: RATE_LIMITS,
    note: 'Estadísticas en desarrollo (memoria local)'
  };
};

// Función para resetear límites de un usuario (para administradores)
export const resetUserRateLimit = async (userId: string, identifier?: string) => {
  try {
    if (identifier) {
      await memoryStore.resetKey(`${identifier}:*:${userId}:*`);
    } else {
      // Reset todos los límites del usuario
      const keys = Array.from((memoryStore as any).hits.keys()) as string[];
      const userKeys = keys.filter(key => key.includes(`:${userId}:`));
      
      for (const key of userKeys) {
        await memoryStore.resetKey(key);
      }
    }
    
    console.log(`Rate limits reset for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error resetting rate limits:', error);
    return false;
  }
};

// Función para blacklist temporal de IPs abusivas
const ipBlacklist = new Set<string>();

export const addToBlacklist = (ip: string, durationMs: number = 60 * 60 * 1000) => {
  ipBlacklist.add(ip);
  setTimeout(() => {
    ipBlacklist.delete(ip);
  }, durationMs);
  
  console.log(`IP ${ip} added to blacklist for ${durationMs / 1000} seconds`);
};

export const checkBlacklist = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  
  if (ipBlacklist.has(ip)) {
    return res.status(403).json({
      error: 'IP Blacklisted',
      message: 'Su IP ha sido temporalmente bloqueada por actividad sospechosa'
    });
  }
  
  next();
};

// Detector de patrones de abuso
export const abuseDetector = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';
  
  // Detectar user agents sospechosos
  const suspiciousAgents = ['bot', 'crawl', 'spider', 'scraper'];
  const isSuspiciousAgent = suspiciousAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  );
  
  // Detectar falta de headers estándar
  const hasStandardHeaders = req.get('Accept') && req.get('Accept-Language');
  
  if (isSuspiciousAgent || !hasStandardHeaders) {
    console.warn(`🚨 Suspicious request detected from ${ip}: ${userAgent}`);
    
    // Aplicar rate limit más estricto
    return createAdvancedRateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 5, // Solo 5 requests
      message: 'Actividad sospechosa detectada',
      identifier: 'suspicious-activity',
      escalatingPenalty: true
    })(req, res, next);
  }
  
  next();
};

// Cleanup al cerrar la aplicación
process.on('SIGINT', () => {
  memoryStore.destroy();
});

process.on('SIGTERM', () => {
  memoryStore.destroy();
});