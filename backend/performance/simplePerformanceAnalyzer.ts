import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

/**
 * Simple Database Performance Analyzer - Fase 4.3 Paso 1
 * Versión simplificada que funciona con la configuración actual de Prisma
 */

export interface SimpleQueryMetrics {
  operation: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
}

export interface PerformanceReport {
  avgQueryTime: number;
  totalQueries: number;
  slowQueries: number;
  fastQueries: number;
  operationBreakdown: Record<string, { count: number; avgTime: number }>;
  recommendations: string[];
}

class SimpleQueryTracker {
  private queries: SimpleQueryMetrics[] = [];
  private startTime: number = Date.now();

  addQuery(metrics: SimpleQueryMetrics) {
    this.queries.push(metrics);
    
    // Mantener solo las últimas 500 queries
    if (this.queries.length > 500) {
      this.queries = this.queries.slice(-500);
    }
  }

  getReport(): PerformanceReport {
    if (this.queries.length === 0) {
      return {
        avgQueryTime: 0,
        totalQueries: 0,
        slowQueries: 0,
        fastQueries: 0,
        operationBreakdown: {},
        recommendations: ['No hay datos de queries disponibles']
      };
    }

    const totalTime = this.queries.reduce((sum, q) => sum + q.executionTime, 0);
    const avgQueryTime = totalTime / this.queries.length;
    
    const slowQueries = this.queries.filter(q => q.executionTime > 100).length;
    const fastQueries = this.queries.filter(q => q.executionTime < 50).length;

    // Breakdown por operación
    const operationBreakdown: Record<string, { count: number; avgTime: number }> = {};
    
    this.queries.forEach(query => {
      if (!operationBreakdown[query.operation]) {
        operationBreakdown[query.operation] = { count: 0, avgTime: 0 };
      }
      operationBreakdown[query.operation].count++;
    });

    // Calcular tiempo promedio por operación
    Object.keys(operationBreakdown).forEach(op => {
      const opQueries = this.queries.filter(q => q.operation === op);
      const opTotalTime = opQueries.reduce((sum, q) => sum + q.executionTime, 0);
      operationBreakdown[op].avgTime = opTotalTime / opQueries.length;
    });

    const recommendations = this.generateRecommendations(avgQueryTime, slowQueries, this.queries.length);

    return {
      avgQueryTime,
      totalQueries: this.queries.length,
      slowQueries,
      fastQueries,
      operationBreakdown,
      recommendations
    };
  }

  private generateRecommendations(avgTime: number, slowCount: number, totalCount: number): string[] {
    const recommendations: string[] = [];

    if (avgTime > 100) {
      recommendations.push('🚨 CRÍTICO: Tiempo promedio muy alto (>100ms)');
      recommendations.push('💡 Implementar índices en tablas principales');
      recommendations.push('💡 Optimizar queries con EXPLAIN ANALYZE');
    } else if (avgTime > 50) {
      recommendations.push('⚠️ MEDIO: Tiempo promedio alto (>50ms)');
      recommendations.push('💡 Considerar índices adicionales');
    }

    if (slowCount > totalCount * 0.1) {
      recommendations.push(`🐌 ${slowCount} queries lentas detectadas (>${(slowCount/totalCount*100).toFixed(1)}%)`);
    }

    recommendations.push('💡 Implementar Redis cache para queries frecuentes');
    recommendations.push('💡 Configurar connection pooling');

    return recommendations;
  }

  clear() {
    this.queries = [];
    this.startTime = Date.now();
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

export const simpleTracker = new SimpleQueryTracker();

export class SimplePerformanceAnalyzer {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Ejecuta un benchmark simple de operaciones comunes
   */
  async runSimpleBenchmark(): Promise<PerformanceReport> {
    console.log('🔍 Iniciando benchmark simple...');
    
    simpleTracker.clear();

    try {
      // Test 1: Consulta simple de organizaciones
      await this.timedOperation('organizaciones_list', async () => {
        return await this.prisma.organizaciones.findMany({
          take: 10
        });
      });

      // Test 2: Consulta de usuarios con relaciones
      await this.timedOperation('usuarios_with_relations', async () => {
        return await this.prisma.usuario.findMany({
          take: 10,
          include: {
            organizaciones: true
          }
        });
      });

      // Test 3: Búsqueda de pacientes
      await this.timedOperation('pacientes_search', async () => {
        return await this.prisma.paciente.findMany({
          take: 15,
          where: {
            nombre: {
              contains: 'a',
              mode: 'insensitive'
            }
          }
        });
      });

      // Test 4: Consultas de citas
      await this.timedOperation('citas_today', async () => {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        return await this.prisma.citas.findMany({
          where: {
            fecha_inicio: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          take: 20
        });
      });

      // Test 5: Consultas de cobros
      await this.timedOperation('cobros_recent', async () => {
        return await this.prisma.cobro.findMany({
          take: 10,
          orderBy: {
            fecha_cobro: 'desc'
          }
        });
      });

      // Test 6: Consulta compleja con múltiples joins
      await this.timedOperation('complex_query', async () => {
        return await this.prisma.usuario.findMany({
          take: 5,
          include: {
            organizaciones: true,
            citas: {
              take: 3,
              include: {
                paciente: true
              }
            }
          }
        });
      });

      console.log('📊 Benchmark completado');
      return simpleTracker.getReport();

    } catch (error) {
      console.error('❌ Error durante benchmark:', error);
      
      // Agregar query fallida
      simpleTracker.addQuery({
        operation: 'benchmark_error',
        executionTime: 0,
        timestamp: new Date(),
        success: false
      });

      return simpleTracker.getReport();
    }
  }

  /**
   * Ejecuta una operación y mide el tiempo
   */
  private async timedOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      simpleTracker.addQuery({
        operation: operationName,
        executionTime,
        timestamp: new Date(),
        success: true
      });

      if (executionTime > 100) {
        console.warn(`🐌 Slow operation: ${operationName} took ${executionTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      simpleTracker.addQuery({
        operation: operationName,
        executionTime,
        timestamp: new Date(),
        success: false
      });

      console.error(`❌ Operation failed: ${operationName} - ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Ejecuta tests específicos de performance
   */
  async runPerformanceTests(): Promise<{
    baseline: PerformanceReport;
    stress: PerformanceReport;
    recommendations: string[];
  }> {
    // Test baseline
    console.log('📊 Ejecutando test baseline...');
    const baseline = await this.runSimpleBenchmark();

    // Test de stress (más queries)
    console.log('🔥 Ejecutando test de stress...');
    simpleTracker.clear();
    
    for (let i = 0; i < 20; i++) {
      await this.timedOperation(`stress_test_${i}`, async () => {
        return await this.prisma.usuario.findMany({
          take: 5,
          skip: i * 5
        });
      });
    }

    const stress = simpleTracker.getReport();

    // Recomendaciones combinadas
    const recommendations = [
      ...baseline.recommendations,
      ...stress.recommendations
    ].filter((rec, index, arr) => arr.indexOf(rec) === index); // Remover duplicados

    return {
      baseline,
      stress,
      recommendations
    };
  }

  /**
   * Obtiene métricas actuales
   */
  getCurrentMetrics(): PerformanceReport {
    return simpleTracker.getReport();
  }

  /**
   * Limpia métricas
   */
  clearMetrics() {
    simpleTracker.clear();
  }

  /**
   * Cierra conexión
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Instancia global
export const simpleAnalyzer = new SimplePerformanceAnalyzer();