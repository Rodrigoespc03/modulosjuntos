import Redis from 'ioredis';
import { performance } from 'perf_hooks';

/**
 * Intelligent Redis Cache System - Fase 4.3 Paso 3
 * Sistema de cache inteligente para optimizar queries frecuentes
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgCacheTime: number;
  avgDbTime: number;
  memoryUsage: number;
  keysCount: number;
}

export interface CacheStrategy {
  key: string;
  ttl: number; // Time to live in seconds
  strategy: 'READ_THROUGH' | 'WRITE_BEHIND' | 'CACHE_ASIDE' | 'WRITE_THROUGH';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
}

export interface CacheOperation {
  key: string;
  operation: 'GET' | 'SET' | 'DELETE' | 'INVALIDATE';
  executionTime: number;
  hit: boolean;
  dataSize: number;
  timestamp: Date;
}

// Store global para métricas de cache
class CacheMetricsStore {
  private operations: CacheOperation[] = [];
  private startTime: number = Date.now();

  addOperation(operation: CacheOperation) {
    this.operations.push(operation);
    
    // Mantener solo las últimas 1000 operaciones
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000);
    }
  }

  getMetrics(): CacheMetrics {
    if (this.operations.length === 0) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        avgCacheTime: 0,
        avgDbTime: 0,
        memoryUsage: 0,
        keysCount: 0
      };
    }

    const hits = this.operations.filter(op => op.hit && op.operation === 'GET').length;
    const misses = this.operations.filter(op => !op.hit && op.operation === 'GET').length;
    const totalRequests = hits + misses;
    const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;

    const cacheOps = this.operations.filter(op => op.hit);
    const dbOps = this.operations.filter(op => !op.hit);

    const avgCacheTime = cacheOps.length > 0 ? 
      cacheOps.reduce((sum, op) => sum + op.executionTime, 0) / cacheOps.length : 0;
    
    const avgDbTime = dbOps.length > 0 ? 
      dbOps.reduce((sum, op) => sum + op.executionTime, 0) / dbOps.length : 0;

    return {
      hits,
      misses,
      hitRate,
      totalRequests,
      avgCacheTime,
      avgDbTime,
      memoryUsage: 0, // Se calculará desde Redis
      keysCount: 0 // Se calculará desde Redis
    };
  }

  clear() {
    this.operations = [];
    this.startTime = Date.now();
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

export const cacheMetricsStore = new CacheMetricsStore();

export class RedisCache {
  private redis: Redis;
  private connected: boolean = false;
  private strategies: Map<string, CacheStrategy> = new Map();

  constructor() {
    // Configuración de Redis optimizada para performance
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Configuraciones de performance
      enableOfflineQueue: false,
      enableReadyCheck: true
    });

    this.setupRedisEvents();
    this.setupCacheStrategies();
  }

  /**
   * Obtener valor crudo por key (compatibilidad con código existente)
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error(`❌ Error en Redis.get(${key}):`, error);
      return null;
    }
  }

  /**
   * Establecer valor crudo por key con TTL opcional (compatibilidad)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.error(`❌ Error en Redis.set(${key}):`, error);
    }
  }

  /**
   * Configura event listeners para Redis
   */
  private setupRedisEvents() {
    this.redis.on('connect', () => {
      console.log('🔗 Redis conectado exitosamente');
      this.connected = true;
    });

    this.redis.on('ready', () => {
      console.log('✅ Redis listo para operaciones');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Error de Redis:', error);
      this.connected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Conexión Redis cerrada');
      this.connected = false;
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Reconectando Redis...');
    });
  }

  /**
   * Configura estrategias de cache para diferentes tipos de datos
   */
  private setupCacheStrategies() {
    // Cache strategies basadas en análisis del Paso 1 y 2
    const strategies: CacheStrategy[] = [
      {
        key: 'organizaciones:*',
        ttl: 3600, // 1 hora - datos relativamente estáticos
        strategy: 'READ_THROUGH',
        priority: 'HIGH',
        tags: ['organizaciones', 'master_data']
      },
      {
        key: 'usuarios:org:*',
        ttl: 1800, // 30 minutos - datos de usuarios por organización
        strategy: 'READ_THROUGH',
        priority: 'HIGH',
        tags: ['usuarios', 'relaciones']
      },
      {
        key: 'pacientes:search:*',
        ttl: 900, // 15 minutos - búsquedas de pacientes
        strategy: 'CACHE_ASIDE',
        priority: 'MEDIUM',
        tags: ['pacientes', 'search']
      },
      {
        key: 'cobros:recent:*',
        ttl: 300, // 5 minutos - cobros recientes cambian frecuentemente
        strategy: 'CACHE_ASIDE',
        priority: 'MEDIUM',
        tags: ['cobros', 'recent']
      },
      {
        key: 'citas:today:*',
        ttl: 600, // 10 minutos - citas del día
        strategy: 'READ_THROUGH',
        priority: 'HIGH',
        tags: ['citas', 'daily']
      },
      {
        key: 'servicios:org:*',
        ttl: 7200, // 2 horas - servicios por organización
        strategy: 'READ_THROUGH',
        priority: 'LOW',
        tags: ['servicios', 'master_data']
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.key.replace('*', ''), strategy);
    });
  }

  /**
   * Conecta a Redis
   */
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
      console.log('🚀 Redis cache inicializado correctamente');
    } catch (error) {
      console.error('❌ Error conectando a Redis:', error);
      throw error;
    }
  }

  /**
   * Cache inteligente con read-through pattern
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    }
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // Intentar obtener del cache
      const cached = await this.redis.get(key);
      
      if (cached) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Registrar hit
        cacheMetricsStore.addOperation({
          key,
          operation: 'GET',
          executionTime,
          hit: true,
          dataSize: cached.length,
          timestamp: new Date()
        });

        console.log(`🎯 Cache HIT: ${key} (${executionTime.toFixed(2)}ms)`);
        return JSON.parse(cached);
      }

      // Cache miss - obtener de la base de datos
      console.log(`📊 Cache MISS: ${key} - fetching from DB...`);
      const fetchStartTime = performance.now();
      const data = await fetcher();
      const fetchEndTime = performance.now();
      const fetchTime = fetchEndTime - fetchStartTime;

      // Guardar en cache
      const strategy = this.getStrategy(key);
      const ttl = options?.ttl || strategy?.ttl || 900; // Default 15 minutos
      
      await this.redis.setex(key, ttl, JSON.stringify(data));

      // Agregar tags si existen
      if (options?.tags || strategy?.tags) {
        const tags = [...(options?.tags || []), ...(strategy?.tags || [])];
        for (const tag of tags) {
          await this.redis.sadd(`tags:${tag}`, key);
        }
      }

      const totalTime = performance.now() - startTime;

      // Registrar miss
      cacheMetricsStore.addOperation({
        key,
        operation: 'GET',
        executionTime: totalTime,
        hit: false,
        dataSize: JSON.stringify(data).length,
        timestamp: new Date()
      });

      console.log(`💾 Cache SET: ${key} (DB: ${fetchTime.toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms)`);
      return data;

    } catch (error) {
      console.error(`❌ Error en cache operation para ${key}:`, error);
      
      // En caso de error de cache, ejecutar fetcher directamente
      const fallbackStart = performance.now();
      const data = await fetcher();
      const fallbackTime = performance.now() - fallbackStart;

      console.log(`🔄 Cache fallback para ${key} (${fallbackTime.toFixed(2)}ms)`);
      return data;
    }
  }

  /**
   * Invalidación inteligente por tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tags:${tag}`);
      
      if (keys.length === 0) {
        return 0;
      }

      // Eliminar keys del cache
      const deleted = await this.redis.del(...keys);
      
      // Limpiar el set de tags
      await this.redis.del(`tags:${tag}`);

      console.log(`🗑️ Invalidated ${deleted} keys for tag: ${tag}`);
      return deleted;
    } catch (error) {
      console.error(`❌ Error invalidating tag ${tag}:`, error);
      return 0;
    }
  }

  /**
   * Invalidación de cache específica
   */
  async invalidate(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      
      cacheMetricsStore.addOperation({
        key,
        operation: 'DELETE',
        executionTime: 0,
        hit: false,
        dataSize: 0,
        timestamp: new Date()
      });

      console.log(`🗑️ Cache invalidated: ${key}`);
      return result > 0;
    } catch (error) {
      console.error(`❌ Error invalidating ${key}:`, error);
      return false;
    }
  }

  /**
   * Pre-warming del cache con datos frecuentes
   */
  async warmUp(): Promise<{
    preWarmed: number;
    errors: number;
    totalTime: number;
  }> {
    console.log('🔥 Iniciando cache warm-up...');
    const startTime = performance.now();
    
    let preWarmed = 0;
    let errors = 0;

    // Estrategias de pre-warming para datos críticos
    const warmUpOperations = [
      {
        key: 'warmup:organizaciones:all',
        fetcher: async () => {
          // Simular carga de organizaciones
          return { count: 10, timestamp: new Date() };
        },
        ttl: 3600
      },
      {
        key: 'warmup:usuarios:active',
        fetcher: async () => {
          // Simular carga de usuarios activos
          return { count: 50, timestamp: new Date() };
        },
        ttl: 1800
      },
      {
        key: 'warmup:system:status',
        fetcher: async () => {
          return { 
            count: 1,
            timestamp: new Date() 
          };
        },
        ttl: 600
      }
    ];

    for (const operation of warmUpOperations) {
      try {
        await this.getOrSet(operation.key, operation.fetcher, {
          ttl: operation.ttl,
          tags: ['warmup'],
          priority: 'HIGH'
        });
        preWarmed++;
      } catch (error) {
        console.error(`❌ Error en warm-up para ${operation.key}:`, error);
        errors++;
      }
    }

    const totalTime = performance.now() - startTime;
    console.log(`🔥 Cache warm-up completado: ${preWarmed} keys, ${errors} errors (${totalTime.toFixed(2)}ms)`);

    return { preWarmed, errors, totalTime };
  }

  /**
   * Obtiene métricas del cache
   */
  async getMetrics(): Promise<CacheMetrics> {
    const metrics = cacheMetricsStore.getMetrics();

    try {
      // Obtener información adicional de Redis
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      const keysCount = await this.redis.dbsize();

      return {
        ...metrics,
        memoryUsage,
        keysCount
      };
    } catch (error) {
      console.error('❌ Error obteniendo métricas de Redis:', error);
      return metrics;
    }
  }

  /**
   * Obtiene estrategia para una key
   */
  private getStrategy(key: string): CacheStrategy | undefined {
    // Buscar estrategia que coincida con el patrón
    for (const [pattern, strategy] of this.strategies.entries()) {
      if (key.startsWith(pattern) || pattern === '*') {
        return strategy;
      }
    }
    return undefined;
  }

  /**
   * Flush completo del cache (usar con precaución)
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      cacheMetricsStore.clear();
      console.log('🗑️ Cache completamente limpiado');
    } catch (error) {
      console.error('❌ Error limpiando cache:', error);
      throw error;
    }
  }

  /**
   * Health check del cache
   */
  async healthCheck(): Promise<{
    connected: boolean;
    latency: number;
    memoryUsage: number;
    keysCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let latency = 0;
    let memoryUsage = 0;
    let keysCount = 0;

    try {
      // Test de latencia
      const start = performance.now();
      await this.redis.ping();
      latency = performance.now() - start;

      // Información de memoria
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      // Contar keys
      keysCount = await this.redis.dbsize();

    } catch (error) {
      errors.push((error as Error).message);
      this.connected = false;
    }

    return {
      connected: this.connected,
      latency,
      memoryUsage,
      keysCount,
      errors
    };
  }

  /**
   * Cierra la conexión
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('👋 Redis desconectado correctamente');
    } catch (error) {
      console.error('❌ Error desconectando Redis:', error);
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// Instancia global del cache
export const redisCache = new RedisCache();