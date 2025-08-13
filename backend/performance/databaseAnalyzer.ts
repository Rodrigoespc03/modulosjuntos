import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

/**
 * Database Performance Analyzer - Fase 4.3 Paso 1
 * Analiza el rendimiento actual de la base de datos y identifica optimizaciones
 */

export interface QueryAnalysis {
  query: string;
  executionTime: number;
  recordCount: number;
  tableName: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DatabaseMetrics {
  avgQueryTime: number;
  slowQueries: QueryAnalysis[];
  totalQueries: number;
  cacheHitRate: number;
  connectionPoolUsage: number;
  indexEfficiency: number;
}

export interface TableAnalysis {
  tableName: string;
  recordCount: number;
  indexCount: number;
  missingIndexes: string[];
  queryFrequency: number;
  avgQueryTime: number;
}

// Store global para análisis de queries
class QueryPerformanceStore {
  private queries: QueryAnalysis[] = [];
  private startTime: number = Date.now();

  addQuery(analysis: QueryAnalysis) {
    this.queries.push(analysis);
    
    // Mantener solo las últimas 1000 queries para no consumir mucha memoria
    if (this.queries.length > 1000) {
      this.queries = this.queries.slice(-1000);
    }
  }

  getMetrics(): DatabaseMetrics {
    if (this.queries.length === 0) {
      return {
        avgQueryTime: 0,
        slowQueries: [],
        totalQueries: 0,
        cacheHitRate: 0,
        connectionPoolUsage: 0,
        indexEfficiency: 100
      };
    }

    const totalTime = this.queries.reduce((sum, q) => sum + q.executionTime, 0);
    const avgQueryTime = totalTime / this.queries.length;
    
    // Queries que toman más de 100ms se consideran lentas
    const slowQueries = this.queries.filter(q => q.executionTime > 100);

    return {
      avgQueryTime,
      slowQueries: slowQueries.slice(-10), // Últimas 10 queries lentas
      totalQueries: this.queries.length,
      cacheHitRate: 0, // Implementar con Redis en Paso 2
      connectionPoolUsage: 0, // Implementar con connection pooling
      indexEfficiency: this.calculateIndexEfficiency()
    };
  }

  private calculateIndexEfficiency(): number {
    // Análisis básico basado en tiempo de queries
    const fastQueries = this.queries.filter(q => q.executionTime < 50).length;
    const totalQueries = this.queries.length;
    
    return totalQueries > 0 ? (fastQueries / totalQueries) * 100 : 100;
  }

  getQueriesByTable(tableName: string): QueryAnalysis[] {
    return this.queries.filter(q => q.tableName === tableName);
  }

  clear() {
    this.queries = [];
    this.startTime = Date.now();
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

// Instancia global del store
export const queryStore = new QueryPerformanceStore();

// Clase principal para análisis de base de datos
export class DatabaseAnalyzer {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' }
      ]
    });

    this.setupQueryLogging();
  }

  /**
   * Configura el logging automático de queries para análisis
   */
  private setupQueryLogging() {
    this.prisma.$on('query', (e: any) => {
      const analysis: QueryAnalysis = {
        query: e.query,
        executionTime: e.duration,
        recordCount: 0, // Prisma no proporciona este dato directamente
        tableName: this.extractTableName(e.query),
        operation: this.extractOperation(e.query),
        complexity: this.calculateComplexity(e.query, e.duration)
      };

      queryStore.addQuery(analysis);

      // Log queries lentas para debugging
      if (e.duration > 100) {
        console.warn(`🐌 Slow query detected: ${e.duration}ms - ${e.query.substring(0, 100)}...`);
      }
    });
  }

  /**
   * Extrae el nombre de la tabla de una query SQL
   */
  private extractTableName(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Buscar patrones comunes de Prisma
    const patterns = [
      /from\s+"?(\w+)"?/,
      /update\s+"?(\w+)"?/,
      /insert\s+into\s+"?(\w+)"?/,
      /delete\s+from\s+"?(\w+)"?/
    ];

    for (const pattern of patterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'unknown';
  }

  /**
   * Extrae el tipo de operación de una query
   */
  private extractOperation(query: string): QueryAnalysis['operation'] {
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery.startsWith('select')) return 'SELECT';
    if (lowerQuery.startsWith('insert')) return 'INSERT';
    if (lowerQuery.startsWith('update')) return 'UPDATE';
    if (lowerQuery.startsWith('delete')) return 'DELETE';
    
    return 'SELECT'; // Default
  }

  /**
   * Calcula la complejidad de una query basada en patrones y tiempo
   */
  private calculateComplexity(query: string, duration: number): QueryAnalysis['complexity'] {
    const lowerQuery = query.toLowerCase();
    
    // Factores de complejidad
    let complexityScore = 0;
    
    // Duración (factor más importante)
    if (duration > 200) complexityScore += 3;
    else if (duration > 100) complexityScore += 2;
    else if (duration > 50) complexityScore += 1;
    
    // Joins
    const joinCount = (lowerQuery.match(/join/g) || []).length;
    complexityScore += joinCount;
    
    // Subqueries
    const subqueryCount = (lowerQuery.match(/\(/g) || []).length;
    complexityScore += Math.floor(subqueryCount / 2);
    
    // Functions y agregaciones
    if (lowerQuery.includes('group by')) complexityScore += 1;
    if (lowerQuery.includes('order by')) complexityScore += 1;
    if (lowerQuery.includes('having')) complexityScore += 1;
    
    // Clasificación
    if (complexityScore >= 5) return 'HIGH';
    if (complexityScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Ejecuta un benchmark de queries comunes del sistema
   */
  async runBenchmark(): Promise<{
    baseline: DatabaseMetrics;
    tableAnalysis: TableAnalysis[];
    recommendations: string[];
  }> {
    console.log('🔍 Iniciando benchmark de base de datos...');
    
    queryStore.clear();
    const startTime = performance.now();

    try {
      // Test queries comunes del sistema
      await this.benchmarkCommonQueries();
      
      const endTime = performance.now();
      const totalBenchmarkTime = endTime - startTime;
      
      console.log(`📊 Benchmark completado en ${totalBenchmarkTime.toFixed(2)}ms`);
      
      const baseline = queryStore.getMetrics();
      const tableAnalysis = await this.analyzeTablePerformance();
      const recommendations = this.generateRecommendations(baseline, tableAnalysis);
      
      return {
        baseline,
        tableAnalysis,
        recommendations
      };
    } catch (error) {
      console.error('❌ Error durante benchmark:', error);
      throw error;
    }
  }

  /**
   * Ejecuta queries comunes para establecer métricas base
   */
  private async benchmarkCommonQueries() {
    // Query 1: Listar organizaciones
    await this.prisma.organizaciones.findMany({
      take: 10,
      include: {
        consultorios: true,
        usuarios: true
      }
    });

    // Query 2: Buscar pacientes con paginación
    await this.prisma.paciente.findMany({
      take: 20,
      skip: 0,
      where: {
        organizacion_id: { not: null }
      },
      include: {
        cita: {
          take: 5,
          orderBy: { fecha_inicio: 'desc' }
        }
      }
    });

    // Query 3: Cobros recientes con detalles
    await this.prisma.cobro.findMany({
      take: 15,
      orderBy: { fecha_cobro: 'desc' },
      include: {
        paciente: true,
        usuario: true,
        cobroConcepto: {
          include: {
            servicio: true
          }
        }
      }
    });

    // Query 4: Citas del día
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    await this.prisma.cita.findMany({
      where: {
        fecha_inicio: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        paciente: true,
        usuario: true,
        consultorio: true
      }
    });

    // Query 5: Búsqueda de servicios
    await this.prisma.servicio.findMany({
      where: {
        nombre: {
          contains: 'consulta',
          mode: 'insensitive'
        }
      },
      include: {
        organizacione: true
      }
    });

    // Query 6: Historial de cobros (query compleja)
    await this.prisma.historialCobro.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        cobro: {
          include: {
            paciente: true
          }
        },
        usuario: true
      }
    });

    // Query 7: Disponibilidad médica
    await this.prisma.disponibilidadMedico.findMany({
      where: {
        dia_semana: new Date().getDay()
      },
      include: {
        usuario: true
      }
    });

    // Query 8: Configuración de permisos
    await this.prisma.configuracionPermisos.findMany({
      include: {
        consultorio: {
          include: {
            organizacione: true
          }
        }
      }
    });
  }

  /**
   * Analiza el rendimiento por tabla
   */
  private async analyzeTablePerformance(): Promise<TableAnalysis[]> {
    const tables = [
      'organizaciones', 'usuarios', 'pacientes', 'consultorios',
      'cobros', 'cobro_conceptos', 'servicios', 'citas',
      'historial_cobros', 'disponibilidad_medico'
    ];

    const analysis: TableAnalysis[] = [];

    for (const tableName of tables) {
      const queries = queryStore.getQueriesByTable(tableName);
      
      if (queries.length > 0) {
        const avgQueryTime = queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;
        
        analysis.push({
          tableName,
          recordCount: 0, // Obtener con COUNT en producción
          indexCount: this.getExistingIndexCount(tableName),
          missingIndexes: this.identifyMissingIndexes(tableName, queries),
          queryFrequency: queries.length,
          avgQueryTime
        });
      }
    }

    return analysis.sort((a, b) => b.avgQueryTime - a.avgQueryTime);
  }

  /**
   * Cuenta los índices existentes para una tabla
   */
  private getExistingIndexCount(tableName: string): number {
    // Basado en el schema que revisamos
    const indexCounts: Record<string, number> = {
      usuarios: 5, // Tiene 5 índices en el schema
      pacientes: 4, // Tiene 4 índices
      cobros: 4, // Tiene 4 índices
      citas: 5, // Tiene 5 índices
      cobro_conceptos: 3, // Tiene 3 índices
      consultorios: 1, // Tiene 1 índice
      servicios: 2, // Tiene 2 índices
      historial_cobros: 2, // Tiene 2 índices
      disponibilidad_medico: 2, // Tiene 2 índices
      organizaciones: 0 // No vimos índices específicos
    };

    return indexCounts[tableName] || 0;
  }

  /**
   * Identifica índices faltantes basado en patrones de query
   */
  private identifyMissingIndexes(tableName: string, queries: QueryAnalysis[]): string[] {
    const missingIndexes: string[] = [];
    
    // Análisis básico de patrones de WHERE clauses en queries lentas
    const slowQueries = queries.filter(q => q.executionTime > 50);
    
    for (const query of slowQueries) {
      const suggestions = this.suggestIndexesForQuery(tableName, query.query);
      missingIndexes.push(...suggestions);
    }

    // Remover duplicados
    return [...new Set(missingIndexes)];
  }

  /**
   * Sugiere índices para una query específica
   */
  private suggestIndexesForQuery(tableName: string, query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Detectar columnas en WHERE clauses
    if (lowerQuery.includes('where')) {
      // Patrones comunes que podrían beneficiarse de índices
      const patterns = [
        { regex: /where\s+(\w+)\s*=/, suggestion: (match: string) => `idx_${tableName}_${match}` },
        { regex: /and\s+(\w+)\s*=/, suggestion: (match: string) => `idx_${tableName}_${match}` },
        { regex: /order\s+by\s+(\w+)/, suggestion: (match: string) => `idx_${tableName}_${match}_sorted` }
      ];

      for (const pattern of patterns) {
        const matches = lowerQuery.match(pattern.regex);
        if (matches && matches[1]) {
          suggestions.push(pattern.suggestion(matches[1]));
        }
      }
    }

    return suggestions;
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generateRecommendations(
    metrics: DatabaseMetrics, 
    tableAnalysis: TableAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en tiempo promedio de query
    if (metrics.avgQueryTime > 100) {
      recommendations.push('🚨 Tiempo promedio de query > 100ms - Requiere optimización urgente');
    } else if (metrics.avgQueryTime > 50) {
      recommendations.push('⚠️ Tiempo promedio de query > 50ms - Considerar optimizaciones');
    }

    // Recomendaciones por queries lentas
    if (metrics.slowQueries.length > 0) {
      recommendations.push(`🐌 ${metrics.slowQueries.length} queries lentas detectadas - Revisar índices`);
    }

    // Recomendaciones por tabla
    for (const table of tableAnalysis) {
      if (table.avgQueryTime > 80) {
        recommendations.push(`📊 Tabla '${table.tableName}' tiene queries lentas (${table.avgQueryTime.toFixed(2)}ms promedio)`);
      }

      if (table.missingIndexes.length > 0) {
        recommendations.push(`🔍 Tabla '${table.tableName}' necesita índices: ${table.missingIndexes.slice(0, 2).join(', ')}`);
      }
    }

    // Recomendaciones específicas del sistema
    recommendations.push('💡 Implementar connection pooling para PostgreSQL');
    recommendations.push('💡 Configurar Redis cache para queries frecuentes');
    recommendations.push('💡 Optimizar queries con EXPLAIN ANALYZE en producción');

    return recommendations.slice(0, 10); // Máximo 10 recomendaciones
  }

  /**
   * Obtiene métricas en tiempo real
   */
  getRealtimeMetrics(): DatabaseMetrics {
    return queryStore.getMetrics();
  }

  /**
   * Limpia el store de queries
   */
  clearMetrics() {
    queryStore.clear();
  }

  /**
   * Cierra la conexión de Prisma
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Instancia global para uso en el sistema
export const databaseAnalyzer = new DatabaseAnalyzer();