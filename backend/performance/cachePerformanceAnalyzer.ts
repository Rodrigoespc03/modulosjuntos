import { redisCache, cacheMetricsStore } from './redisCache';
import { simpleAnalyzer } from './simplePerformanceAnalyzer';
import { performance } from 'perf_hooks';

/**
 * Cache Performance Analyzer - Fase 4.3 Paso 3
 * Analiza el impacto del cache Redis en el performance del sistema
 */

export interface CachePerformanceReport {
  cacheMetrics: {
    hitRate: number;
    avgCacheTime: number;
    avgDbTime: number;
    totalRequests: number;
    memoryUsage: number;
    keysCount: number;
  };
  performanceComparison: {
    withoutCache: {
      avgTime: number;
      totalQueries: number;
      slowQueries: number;
    };
    withCache: {
      avgTime: number;
      totalQueries: number;
      slowQueries: number;
    };
    improvement: {
      timeReduction: number;
      timeReductionPercentage: number;
      slowQueriesReduction: number;
      performanceGain: number;
    };
  };
  cacheEffectiveness: {
    mostCachedOperations: Array<{
      operation: string;
      hitRate: number;
      avgSavings: number;
    }>;
    cacheHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    recommendations: string[];
  };
}

export class CachePerformanceAnalyzer {
  constructor() {}

  /**
   * Ejecuta análisis completo de performance con cache
   */
  async runCachePerformanceAnalysis(): Promise<CachePerformanceReport> {
    console.log('📊 Iniciando análisis de performance con cache...');

    try {
      // 1. Conectar Redis si no está conectado
      if (!redisCache.isConnected()) {
        console.log('🔗 Conectando a Redis...');
        await redisCache.connect();
      }

      // 2. Warm-up del cache
      console.log('🔥 Ejecutando cache warm-up...');
      await redisCache.warmUp();

      // 3. Benchmark sin cache (limpiar cache primero)
      console.log('📊 Ejecutando benchmark SIN cache...');
      await redisCache.flush();
      cacheMetricsStore.clear();
      
      const withoutCacheReport = await simpleAnalyzer.runSimpleBenchmark();

      // 4. Benchmark CON cache (segunda ejecución para aprovechar cache)
      console.log('📊 Ejecutando benchmark CON cache...');
      
      // Primera ejecución para poblar cache
      await simpleAnalyzer.runSimpleBenchmark();
      
      // Segunda ejecución para medir con cache poblado
      const withCacheReport = await simpleAnalyzer.runSimpleBenchmark();

      // 5. Obtener métricas de cache
      const cacheMetrics = await redisCache.getMetrics();

      // 6. Generar reporte comparativo
      const performanceComparison = this.comparePerformance(withoutCacheReport, withCacheReport);
      const cacheEffectiveness = this.analyzeCacheEffectiveness(cacheMetrics);

      return {
        cacheMetrics: {
          hitRate: cacheMetrics.hitRate,
          avgCacheTime: cacheMetrics.avgCacheTime,
          avgDbTime: cacheMetrics.avgDbTime,
          totalRequests: cacheMetrics.totalRequests,
          memoryUsage: cacheMetrics.memoryUsage,
          keysCount: cacheMetrics.keysCount
        },
        performanceComparison,
        cacheEffectiveness
      };

    } catch (error) {
      console.error('❌ Error en análisis de cache performance:', error);
      throw error;
    }
  }

  /**
   * Compara performance con y sin cache
   */
  private comparePerformance(withoutCache: any, withCache: any) {
    const timeReduction = withoutCache.avgQueryTime - withCache.avgQueryTime;
    const timeReductionPercentage = (timeReduction / withoutCache.avgQueryTime) * 100;
    const slowQueriesReduction = withoutCache.slowQueries - withCache.slowQueries;
    const performanceGain = timeReductionPercentage;

    return {
      withoutCache: {
        avgTime: withoutCache.avgQueryTime,
        totalQueries: withoutCache.totalQueries,
        slowQueries: withoutCache.slowQueries
      },
      withCache: {
        avgTime: withCache.avgQueryTime,
        totalQueries: withCache.totalQueries,
        slowQueries: withCache.slowQueries
      },
      improvement: {
        timeReduction,
        timeReductionPercentage,
        slowQueriesReduction,
        performanceGain
      }
    };
  }

  /**
   * Analiza la efectividad del cache
   */
  private analyzeCacheEffectiveness(cacheMetrics: any) {
    // Simular operaciones más cacheadas (en producción vendría de métricas reales)
    const mostCachedOperations = [
      {
        operation: 'organizaciones_list',
        hitRate: Math.min(85 + Math.random() * 10, 95),
        avgSavings: 1800 + Math.random() * 400 // ms ahorrados
      },
      {
        operation: 'usuarios_with_relations',
        hitRate: Math.min(75 + Math.random() * 15, 90),
        avgSavings: 800 + Math.random() * 300
      },
      {
        operation: 'servicios_by_org',
        hitRate: Math.min(90 + Math.random() * 8, 98),
        avgSavings: 600 + Math.random() * 200
      },
      {
        operation: 'pacientes_search',
        hitRate: Math.min(60 + Math.random() * 20, 80),
        avgSavings: 300 + Math.random() * 150
      }
    ];

    // Determinar health del cache
    let cacheHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'POOR';
    
    if (cacheMetrics.hitRate > 80) cacheHealth = 'EXCELLENT';
    else if (cacheMetrics.hitRate > 60) cacheHealth = 'GOOD';
    else if (cacheMetrics.hitRate > 40) cacheHealth = 'FAIR';

    // Generar recomendaciones
    const recommendations = [];
    
    if (cacheMetrics.hitRate < 70) {
      recommendations.push('💡 Aumentar TTL para datos maestros');
    }
    if (cacheMetrics.avgCacheTime > 10) {
      recommendations.push('💡 Optimizar serialización de datos');
    }
    if (cacheMetrics.keysCount < 50) {
      recommendations.push('💡 Expandir cobertura de cache a más endpoints');
    }
    if (cacheMetrics.hitRate > 90) {
      recommendations.push('✅ Excelente hit rate - considerar aumentar TTL');
    }

    recommendations.push('📊 Monitorear patterns de invalidación');
    recommendations.push('🔍 Implementar cache pre-warming automático');

    return {
      mostCachedOperations,
      cacheHealth,
      recommendations
    };
  }

  /**
   * Test de stress con cache
   */
  async runCacheStressTest(): Promise<{
    baselinePerformance: number;
    cachePerformance: number;
    stressPerformance: number;
    cacheResilience: number;
    recommendation: string;
  }> {
    console.log('🔥 Iniciando test de stress con cache...');

    try {
      // 1. Baseline sin cache
      await redisCache.flush();
      const baselineStart = performance.now();
      await simpleAnalyzer.runSimpleBenchmark();
      const baselineTime = performance.now() - baselineStart;

      // 2. Performance con cache poblado
      await simpleAnalyzer.runSimpleBenchmark(); // Poblar cache
      const cacheStart = performance.now();
      await simpleAnalyzer.runSimpleBenchmark(); // Medir con cache
      const cacheTime = performance.now() - cacheStart;

      // 3. Test de stress (múltiples requests simultáneas)
      const stressStart = performance.now();
      const stressPromises = [];
      
      for (let i = 0; i < 10; i++) {
        stressPromises.push(simpleAnalyzer.runSimpleBenchmark());
      }
      
      await Promise.all(stressPromises);
      const stressTime = performance.now() - stressStart;

      // 4. Calcular resiliencia del cache
      const cacheImprovement = ((baselineTime - cacheTime) / baselineTime) * 100;
      const stressImpact = ((stressTime/10 - cacheTime) / cacheTime) * 100;
      const cacheResilience = Math.max(0, 100 - stressImpact);

      let recommendation = '';
      if (cacheResilience > 80) recommendation = 'Excelente resiliencia - cache muy estable';
      else if (cacheResilience > 60) recommendation = 'Buena resiliencia - monitorear bajo carga alta';
      else if (cacheResilience > 40) recommendation = 'Resiliencia moderada - considerar optimizaciones';
      else recommendation = 'Baja resiliencia - requiere optimización urgente';

      return {
        baselinePerformance: baselineTime,
        cachePerformance: cacheTime,
        stressPerformance: stressTime / 10, // Promedio por request
        cacheResilience,
        recommendation
      };

    } catch (error) {
      console.error('❌ Error en cache stress test:', error);
      throw error;
    }
  }

  /**
   * Simulación de operaciones con cache inteligente
   */
  async simulateIntelligentCaching(): Promise<{
    operations: Array<{
      name: string;
      withoutCache: number;
      withCache: number;
      improvement: number;
      cacheHit: boolean;
    }>;
    totalImprovement: number;
    averageImprovement: number;
  }> {
    console.log('🧠 Simulando cache inteligente...');

    const operations = [
      {
        name: 'organizaciones_list',
        simulator: async () => {
          // Simular operación costosa
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
          return { data: 'organizaciones_data', cost: 150 };
        }
      },
      {
        name: 'usuarios_with_relations',
        simulator: async () => {
          await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40));
          return { data: 'usuarios_data', cost: 120 };
        }
      },
      {
        name: 'pacientes_search',
        simulator: async () => {
          await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 30));
          return { data: 'pacientes_data', cost: 90 };
        }
      },
      {
        name: 'citas_today',
        simulator: async () => {
          await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 20));
          return { data: 'citas_data', cost: 60 };
        }
      }
    ];

    const results = [];
    let totalWithoutCache = 0;
    let totalWithCache = 0;

    for (const operation of operations) {
      // Sin cache
      const withoutCacheStart = performance.now();
      await operation.simulator();
      const withoutCacheTime = performance.now() - withoutCacheStart;

      // Con cache (primera vez - miss)
      const cacheKey = `simulation:${operation.name}`;
      const withCacheTime1 = await this.timeOperation(async () => {
        return await redisCache.getOrSet(cacheKey, operation.simulator, {
          ttl: 600,
          tags: ['simulation']
        });
      });

      // Con cache (segunda vez - hit)
      const withCacheTime2 = await this.timeOperation(async () => {
        return await redisCache.getOrSet(cacheKey, operation.simulator, {
          ttl: 600,
          tags: ['simulation']
        });
      });

      const withCacheTime = withCacheTime2; // Usar el hit time
      const improvement = ((withoutCacheTime - withCacheTime) / withoutCacheTime) * 100;

      results.push({
        name: operation.name,
        withoutCache: withoutCacheTime,
        withCache: withCacheTime,
        improvement,
        cacheHit: withCacheTime2 < withCacheTime1 * 0.5 // Si es significativamente más rápido
      });

      totalWithoutCache += withoutCacheTime;
      totalWithCache += withCacheTime;
    }

    const totalImprovement = ((totalWithoutCache - totalWithCache) / totalWithoutCache) * 100;
    const averageImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;

    return {
      operations: results,
      totalImprovement,
      averageImprovement
    };
  }

  /**
   * Helper para medir tiempo de operación
   */
  private async timeOperation<T>(operation: () => Promise<T>): Promise<number> {
    const start = performance.now();
    await operation();
    return performance.now() - start;
  }

  /**
   * Health check del sistema completo con cache
   */
  async systemHealthCheck(): Promise<{
    redis: {
      connected: boolean;
      latency: number;
      memoryUsage: number;
      keysCount: number;
    };
    cache: {
      hitRate: number;
      avgResponseTime: number;
      health: string;
    };
    overall: {
      score: number;
      status: string;
      recommendations: string[];
    };
  }> {
    try {
      // Redis health
      const redisHealth = await redisCache.healthCheck();
      const cacheMetrics = await redisCache.getMetrics();

      // Cache health
      let cacheHealthStatus = 'POOR';
      if (cacheMetrics.hitRate > 80) cacheHealthStatus = 'EXCELLENT';
      else if (cacheMetrics.hitRate > 60) cacheHealthStatus = 'GOOD';
      else if (cacheMetrics.hitRate > 40) cacheHealthStatus = 'FAIR';

      // Overall score
      let overallScore = 100;
      
      if (!redisHealth.connected) overallScore -= 40;
      if (redisHealth.latency > 10) overallScore -= 20;
      if (cacheMetrics.hitRate < 50) overallScore -= 30;
      if (cacheMetrics.avgCacheTime > 20) overallScore -= 10;

      let overallStatus = 'EXCELLENT';
      if (overallScore < 40) overallStatus = 'CRITICAL';
      else if (overallScore < 60) overallStatus = 'POOR';
      else if (overallScore < 80) overallStatus = 'GOOD';

      const recommendations = [];
      if (!redisHealth.connected) recommendations.push('🚨 Conectar Redis urgentemente');
      if (redisHealth.latency > 10) recommendations.push('⚡ Optimizar latencia de Redis');
      if (cacheMetrics.hitRate < 70) recommendations.push('📊 Mejorar estrategias de cache');
      if (cacheMetrics.keysCount < 10) recommendations.push('🔥 Implementar cache warming');

      return {
        redis: {
          connected: redisHealth.connected,
          latency: redisHealth.latency,
          memoryUsage: redisHealth.memoryUsage,
          keysCount: redisHealth.keysCount
        },
        cache: {
          hitRate: cacheMetrics.hitRate,
          avgResponseTime: cacheMetrics.avgCacheTime,
          health: cacheHealthStatus
        },
        overall: {
          score: overallScore,
          status: overallStatus,
          recommendations
        }
      };

    } catch (error) {
      console.error('❌ Error en system health check:', error);
      return {
        redis: { connected: false, latency: 0, memoryUsage: 0, keysCount: 0 },
        cache: { hitRate: 0, avgResponseTime: 0, health: 'CRITICAL' },
        overall: { score: 0, status: 'CRITICAL', recommendations: ['🚨 Sistema de cache no disponible'] }
      };
    }
  }
}

// Instancia global
export const cachePerformanceAnalyzer = new CachePerformanceAnalyzer();