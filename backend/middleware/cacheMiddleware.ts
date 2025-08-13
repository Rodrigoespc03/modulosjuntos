import { Request, Response, NextFunction } from 'express';
import { redisCache } from '../performance/redisCache';
import { performance } from 'perf_hooks';

/**
 * Cache Middleware - Fase 4.3 Paso 3
 * Middleware inteligente para cache automático de responses
 */

export interface CacheOptions {
  ttl?: number; // Time to live en segundos
  tags?: string[]; // Tags para invalidación
  keyGenerator?: (req: Request) => string; // Función personalizada para generar key
  condition?: (req: Request, res: Response) => boolean; // Condición para cachear
  skipCache?: boolean; // Saltar cache para esta request
}

export interface CachedResponse {
  data: any;
  statusCode: number;
  headers: Record<string, string>;
  timestamp: number;
  ttl: number;
}

/**
 * Middleware principal de cache
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Verificar si el cache está habilitado y conectado
    if (!redisCache.isConnected() || options.skipCache) {
      return next();
    }

    // Verificar condición de cache
    if (options.condition && !options.condition(req, res)) {
      return next();
    }

    // Solo cachear GET requests por defecto
    if (req.method !== 'GET') {
      return next();
    }

    const startTime = performance.now();
    
    try {
      // Generar cache key
      const cacheKey = options.keyGenerator ? 
        options.keyGenerator(req) : 
        generateDefaultCacheKey(req);

      console.log(`🔍 Cache check: ${cacheKey}`);

      // Intentar obtener del cache
      const cached = await redisCache.getOrSet<CachedResponse>(
        cacheKey,
        async () => {
          // Cache miss - ejecutar el handler y capturar response
          return await executeAndCapture(req, res, next);
        },
        {
          ttl: options.ttl || 900, // Default 15 minutos
          tags: options.tags || [],
          priority: 'MEDIUM'
        }
      );

      // Si obtuvimos respuesta del cache, enviarla
      if (cached && cached.data) {
        const cacheTime = performance.now() - startTime;
        
        // Restaurar headers
        Object.entries(cached.headers || {}).forEach(([key, value]) => {
          res.set(key, value);
        });

        // Agregar headers de cache
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Time', `${cacheTime.toFixed(2)}ms`);
        res.set('X-Cache-Age', `${Math.floor((Date.now() - cached.timestamp) / 1000)}s`);

        console.log(`🎯 Cache HIT enviado: ${cacheKey} (${cacheTime.toFixed(2)}ms)`);
        return res.status(cached.statusCode).json(cached.data);
      }

      // Si llegamos aquí, hubo un cache miss y next() ya fue llamado

    } catch (error) {
      console.error('❌ Error en cache middleware:', error);
      // En caso de error, continuar sin cache
      return next();
    }
  };
}

/**
 * Ejecuta el siguiente middleware y captura la respuesta
 */
async function executeAndCapture(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<CachedResponse> {
  return new Promise((resolve, reject) => {
    // Interceptar res.json para capturar la respuesta
    const originalJson = res.json;
    const originalStatus = res.status;
    
    let statusCode = 200;
    let responseData: any;
    let capturedHeaders: Record<string, string> = {};

    // Override res.status
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    // Override res.json
    res.json = function(data: any) {
      responseData = data;
      
      // Capturar headers importantes
      capturedHeaders = {
        'content-type': res.get('content-type') || 'application/json',
        'cache-control': res.get('cache-control') || 'no-cache'
      };

      // Solo cachear respuestas exitosas
      if (statusCode >= 200 && statusCode < 300) {
        const cachedResponse: CachedResponse = {
          data: responseData,
          statusCode,
          headers: capturedHeaders,
          timestamp: Date.now(),
          ttl: 900 // Default TTL
        };

        resolve(cachedResponse);
      } else {
        reject(new Error(`Response status ${statusCode} not cacheable`));
      }

      // Llamar al método original para enviar la respuesta
      return originalJson.call(this, data);
    };

    // Llamar al siguiente middleware
    next();
  });
}

/**
 * Genera una cache key por defecto basada en la request
 */
function generateDefaultCacheKey(req: Request): string {
  const baseKey = `api:${req.route?.path || req.path}`;
  
  // Incluir parámetros de query relevantes
  const queryParams = new URLSearchParams();
  
  // Parámetros comunes que afectan el resultado
  const relevantParams = ['page', 'limit', 'search', 'filter', 'sort', 'organizacion_id'];
  
  relevantParams.forEach(param => {
    if (req.query[param]) {
      queryParams.set(param, req.query[param] as string);
    }
  });

  // Incluir parámetros de ruta
  const routeParams = Object.entries(req.params || {})
    .map(([key, value]) => `${key}:${value}`)
    .join(',');

  const queryString = queryParams.toString();
  
  let cacheKey = baseKey;
  if (routeParams) cacheKey += `:${routeParams}`;
  if (queryString) cacheKey += `:${queryString}`;

  return cacheKey;
}

/**
 * Middleware para invalidar cache después de operaciones de escritura
 */
export function invalidateCacheMiddleware(tags: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ejecutar el handler primero
    const originalJson = res.json;
    
    res.json = async function(data: any) {
      // Si la operación fue exitosa, invalidar cache
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const tag of tags) {
            await redisCache.invalidateByTag(tag);
            console.log(`🗑️ Cache invalidated for tag: ${tag}`);
          }
        } catch (error) {
          console.error('❌ Error invalidating cache:', error);
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Cache para organizaciones (datos maestros)
 */
export const organizacionesCache = cacheMiddleware({
  ttl: 3600, // 1 hora
  tags: ['organizaciones', 'master_data'],
  keyGenerator: (req) => `organizaciones:${req.params.id || 'list'}:${req.query.page || 1}`
});

/**
 * Cache para usuarios por organización
 */
export const usuariosCache = cacheMiddleware({
  ttl: 1800, // 30 minutos
  tags: ['usuarios', 'relaciones'],
  keyGenerator: (req) => `usuarios:org:${req.query.organizacion_id || 'all'}:${req.query.page || 1}`
});

/**
 * Cache para búsquedas de pacientes
 */
export const pacientesSearchCache = cacheMiddleware({
  ttl: 900, // 15 minutos
  tags: ['pacientes', 'search'],
  keyGenerator: (req) => `pacientes:search:${req.query.search || 'all'}:${req.query.organizacion_id}:${req.query.page || 1}`,
  condition: (req) => !!req.query.search || !!req.query.organizacion_id
});

/**
 * Cache para cobros recientes
 */
export const cobrosRecentCache = cacheMiddleware({
  ttl: 300, // 5 minutos
  tags: ['cobros', 'recent'],
  keyGenerator: (req) => `cobros:recent:${req.query.organizacion_id}:${req.query.limit || 10}`
});

/**
 * Cache para citas del día
 */
export const citasTodayCache = cacheMiddleware({
  ttl: 600, // 10 minutos
  tags: ['citas', 'daily'],
  keyGenerator: (req) => {
    const today = new Date().toISOString().split('T')[0];
    return `citas:today:${today}:${req.query.organizacion_id}:${req.query.consultorio_id || 'all'}`;
  }
});

/**
 * Cache para servicios por organización
 */
export const serviciosCache = cacheMiddleware({
  ttl: 7200, // 2 horas
  tags: ['servicios', 'master_data'],
  keyGenerator: (req) => `servicios:org:${req.query.organizacion_id || req.params.organizacion_id || 'all'}`
});

/**
 * Invalidadores para operaciones de escritura
 */
export const invalidateOrganizaciones = invalidateCacheMiddleware(['organizaciones', 'master_data']);
export const invalidateUsuarios = invalidateCacheMiddleware(['usuarios', 'relaciones']);
export const invalidatePacientes = invalidateCacheMiddleware(['pacientes', 'search']);
export const invalidateCobros = invalidateCacheMiddleware(['cobros', 'recent']);
export const invalidateCitas = invalidateCacheMiddleware(['citas', 'daily']);
export const invalidateServicios = invalidateCacheMiddleware(['servicios', 'master_data']);

/**
 * Helper para invalidación manual
 */
export async function manualInvalidate(tags: string[]): Promise<number> {
  let totalInvalidated = 0;
  
  for (const tag of tags) {
    try {
      const invalidated = await redisCache.invalidateByTag(tag);
      totalInvalidated += invalidated;
      console.log(`🗑️ Invalidated ${invalidated} keys for tag: ${tag}`);
    } catch (error) {
      console.error(`❌ Error invalidating tag ${tag}:`, error);
    }
  }

  return totalInvalidated;
}