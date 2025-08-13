import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

/**
 * Database Optimizer - Fase 4.3 Paso 2
 * Implementa optimizaciones específicas basadas en el análisis del Paso 1
 */

export interface OptimizationResult {
  name: string;
  type: 'INDEX' | 'QUERY' | 'CONNECTION' | 'MIGRATION';
  description: string;
  executionTime: number;
  success: boolean;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  beforeMetric?: number;
  afterMetric?: number;
  improvement?: number;
  sqlExecuted?: string;
}

export interface OptimizationReport {
  totalOptimizations: number;
  successfulOptimizations: number;
  failedOptimizations: number;
  totalExecutionTime: number;
  overallImpact: 'CRITICAL' | 'SIGNIFICANT' | 'MODERATE' | 'MINIMAL';
  optimizations: OptimizationResult[];
  recommendations: string[];
}

export class DatabaseOptimizer {
  private prisma: PrismaClient;
  private results: OptimizationResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Ejecuta todas las optimizaciones críticas identificadas
   */
  async runCriticalOptimizations(): Promise<OptimizationReport> {
    console.log('🚀 Iniciando optimizaciones críticas de base de datos...');
    this.results = [];

    try {
      // 1. Índices críticos para relaciones principales
      await this.createCriticalIndexes();
      
      // 2. Optimización de queries específicas
      await this.optimizeSlowQueries();
      
      // 3. Configuración de connection pooling
      await this.optimizeConnectionSettings();
      
      // 4. Análisis de estadísticas de tablas
      await this.updateTableStatistics();

      return this.generateOptimizationReport();
      
    } catch (error) {
      console.error('❌ Error durante optimizaciones:', error);
      
      this.results.push({
        name: 'optimization_error',
        type: 'MIGRATION',
        description: `Error durante optimizaciones: ${(error as Error).message}`,
        executionTime: 0,
        success: false,
        impact: 'HIGH'
      });
      
      return this.generateOptimizationReport();
    }
  }

  /**
   * Crea índices críticos basados en el análisis del Paso 1
   */
  private async createCriticalIndexes(): Promise<void> {
    console.log('📊 Creando índices críticos...');

    // Índices identificados como críticos del análisis
    const criticalIndexes = [
      {
        name: 'idx_usuarios_organizacion_lookup',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion_lookup 
          ON usuarios(organizacion_id, email) 
          WHERE organizacion_id IS NOT NULL;
        `,
        description: 'Índice compuesto para optimizar búsquedas de usuarios por organización',
        impact: 'HIGH' as const,
        targets: ['usuarios_with_relations', 'complex_query']
      },
      {
        name: 'idx_pacientes_search_optimized',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_pacientes_search_optimized 
          ON pacientes(organizacion_id, nombre, apellido) 
          WHERE organizacion_id IS NOT NULL;
        `,
        description: 'Índice compuesto para optimizar búsquedas de pacientes',
        impact: 'HIGH' as const,
        targets: ['pacientes_search']
      },
      {
        name: 'idx_cobros_recent_lookup',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_cobros_recent_lookup 
          ON cobros(fecha_cobro DESC, estado) 
          WHERE fecha_cobro IS NOT NULL;
        `,
        description: 'Índice optimizado para cobros recientes con ordenamiento',
        impact: 'HIGH' as const,
        targets: ['cobros_recent']
      },
      {
        name: 'idx_citas_date_range',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_citas_date_range 
          ON citas(fecha_inicio, fecha_fin, estado) 
          WHERE fecha_inicio IS NOT NULL;
        `,
        description: 'Índice para búsquedas de citas por rango de fechas',
        impact: 'MEDIUM' as const,
        targets: ['citas_today']
      },
      {
        name: 'idx_organizaciones_performance',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_organizaciones_performance 
          ON organizaciones(id, nombre) 
          WHERE nombre IS NOT NULL;
        `,
        description: 'Índice para optimizar listados de organizaciones',
        impact: 'HIGH' as const,
        targets: ['organizaciones_list']
      },
      {
        name: 'idx_citas_usuario_paciente',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_citas_usuario_paciente 
          ON citas(usuario_id, paciente_id, fecha_inicio DESC);
        `,
        description: 'Índice compuesto para queries complejas de citas',
        impact: 'HIGH' as const,
        targets: ['complex_query']
      }
    ];

    for (const index of criticalIndexes) {
      await this.executeOptimization(
        index.name,
        'INDEX',
        index.description,
        index.impact,
        async () => {
          await this.prisma.$executeRawUnsafe(index.sql);
          return index.sql;
        }
      );
    }
  }

  /**
   * Optimiza queries específicas identificadas como lentas
   */
  private async optimizeSlowQueries(): Promise<void> {
    console.log('⚡ Optimizando queries específicas...');

    // Configurar parámetros de PostgreSQL para mejorar performance
    const queryOptimizations = [
      {
        name: 'enable_seqscan_optimization',
        sql: `SET enable_seqscan = off;`,
        description: 'Deshabilitar sequential scans para forzar uso de índices',
        impact: 'MEDIUM' as const
      },
      {
        name: 'increase_work_mem',
        sql: `SET work_mem = '256MB';`,
        description: 'Aumentar memoria de trabajo para ordenamientos',
        impact: 'MEDIUM' as const
      },
      {
        name: 'optimize_join_collapse',
        sql: `SET join_collapse_limit = 12;`,
        description: 'Optimizar límite de colapso de JOINs',
        impact: 'LOW' as const
      }
    ];

    for (const optimization of queryOptimizations) {
      await this.executeOptimization(
        optimization.name,
        'QUERY',
        optimization.description,
        optimization.impact,
        async () => {
          await this.prisma.$executeRawUnsafe(optimization.sql);
          return optimization.sql;
        }
      );
    }
  }

  /**
   * Optimiza configuraciones de conexión
   */
  private async optimizeConnectionSettings(): Promise<void> {
    console.log('🔗 Optimizando configuraciones de conexión...');

    // Optimizaciones de configuración
    const connectionOptimizations = [
      {
        name: 'optimize_shared_buffers',
        sql: `SET shared_buffers = '256MB';`,
        description: 'Optimizar buffers compartidos para cache',
        impact: 'MEDIUM' as const
      },
      {
        name: 'optimize_effective_cache_size',
        sql: `SET effective_cache_size = '1GB';`,
        description: 'Configurar tamaño efectivo de cache',
        impact: 'MEDIUM' as const
      },
      {
        name: 'optimize_random_page_cost',
        sql: `SET random_page_cost = 1.1;`,
        description: 'Optimizar costo de páginas aleatorias (SSD)',
        impact: 'LOW' as const
      }
    ];

    for (const optimization of connectionOptimizations) {
      await this.executeOptimization(
        optimization.name,
        'CONNECTION',
        optimization.description,
        optimization.impact,
        async () => {
          await this.prisma.$executeRawUnsafe(optimization.sql);
          return optimization.sql;
        }
      );
    }
  }

  /**
   * Actualiza estadísticas de tablas para el query planner
   */
  private async updateTableStatistics(): Promise<void> {
    console.log('📈 Actualizando estadísticas de tablas...');

    const tables = [
      'organizaciones', 'usuarios', 'pacientes', 'consultorios',
      'cobros', 'cobro_conceptos', 'servicios', 'citas'
    ];

    for (const table of tables) {
      await this.executeOptimization(
        `analyze_${table}`,
        'MIGRATION',
        `Actualizar estadísticas de tabla ${table}`,
        'LOW',
        async () => {
          const sql = `ANALYZE ${table};`;
          await this.prisma.$executeRawUnsafe(sql);
          return sql;
        }
      );
    }
  }

  /**
   * Ejecuta una optimización específica con medición de tiempo
   */
  private async executeOptimization(
    name: string,
    type: OptimizationResult['type'],
    description: string,
    impact: OptimizationResult['impact'],
    operation: () => Promise<string>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`   🔧 ${description}...`);
      const sqlExecuted = await operation();
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      this.results.push({
        name,
        type,
        description,
        executionTime,
        success: true,
        impact,
        sqlExecuted
      });

      console.log(`   ✅ ${name} completado en ${executionTime.toFixed(2)}ms`);
      
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      this.results.push({
        name,
        type,
        description,
        executionTime,
        success: false,
        impact,
        sqlExecuted: `Error: ${(error as Error).message}`
      });

      console.warn(`   ⚠️ ${name} falló: ${(error as Error).message}`);
    }
  }

  /**
   * Ejecuta un test de performance antes y después de optimizaciones
   */
  async measurePerformanceImpact(): Promise<{
    before: number;
    after: number;
    improvement: number;
    improvementPercentage: number;
  }> {
    console.log('📊 Midiendo impacto de optimizaciones...');

    // Test simple para medir impacto
    const testQuery = async (): Promise<number> => {
      const startTime = performance.now();
      
      // Query representativa que debería beneficiarse de los índices
      await this.prisma.usuario.findMany({
        take: 10,
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
      
      const endTime = performance.now();
      return endTime - startTime;
    };

    // Medición después de optimizaciones (ya implementadas)
    const after1 = await testQuery();
    const after2 = await testQuery();
    const after3 = await testQuery();
    const afterAvg = (after1 + after2 + after3) / 3;

    // Para comparación, usamos la métrica baseline del Paso 1
    const beforeBaseline = 242.03; // Del análisis del Paso 1
    
    const improvement = beforeBaseline - afterAvg;
    const improvementPercentage = (improvement / beforeBaseline) * 100;

    return {
      before: beforeBaseline,
      after: afterAvg,
      improvement,
      improvementPercentage
    };
  }

  /**
   * Genera el reporte de optimizaciones
   */
  private generateOptimizationReport(): OptimizationReport {
    const totalOptimizations = this.results.length;
    const successfulOptimizations = this.results.filter(r => r.success).length;
    const failedOptimizations = totalOptimizations - successfulOptimizations;
    const totalExecutionTime = this.results.reduce((sum, r) => sum + r.executionTime, 0);

    // Determinar impacto general
    const highImpactCount = this.results.filter(r => r.impact === 'HIGH' && r.success).length;
    const mediumImpactCount = this.results.filter(r => r.impact === 'MEDIUM' && r.success).length;
    
    let overallImpact: OptimizationReport['overallImpact'] = 'MINIMAL';
    if (highImpactCount >= 3) overallImpact = 'CRITICAL';
    else if (highImpactCount >= 2 || mediumImpactCount >= 4) overallImpact = 'SIGNIFICANT';
    else if (highImpactCount >= 1 || mediumImpactCount >= 2) overallImpact = 'MODERATE';

    // Generar recomendaciones
    const recommendations = [];
    if (failedOptimizations > 0) {
      recommendations.push(`⚠️ ${failedOptimizations} optimizaciones fallaron - revisar logs`);
    }
    if (highImpactCount < 3) {
      recommendations.push('💡 Considerar optimizaciones adicionales de alto impacto');
    }
    recommendations.push('📊 Ejecutar benchmark post-optimización para validar mejoras');
    recommendations.push('🔍 Monitorear performance durante las próximas 24 horas');

    return {
      totalOptimizations,
      successfulOptimizations,
      failedOptimizations,
      totalExecutionTime,
      overallImpact,
      optimizations: this.results,
      recommendations
    };
  }

  /**
   * Ejecuta validación post-optimización
   */
  async validateOptimizations(): Promise<{
    indexesCreated: number;
    settingsOptimized: number;
    statisticsUpdated: number;
    performanceImpact: {
      before: number;
      after: number;
      improvement: number;
      improvementPercentage: number;
    };
  }> {
    const indexesCreated = this.results.filter(r => r.type === 'INDEX' && r.success).length;
    const settingsOptimized = this.results.filter(r => r.type === 'CONNECTION' && r.success).length;
    const statisticsUpdated = this.results.filter(r => r.type === 'MIGRATION' && r.success).length;
    
    const performanceImpact = await this.measurePerformanceImpact();

    return {
      indexesCreated,
      settingsOptimized,
      statisticsUpdated,
      performanceImpact
    };
  }

  /**
   * Cierra conexión
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Instancia global
export const databaseOptimizer = new DatabaseOptimizer();