import { PrismaClient } from '@prisma/client';
import { AdvancedOptimizer } from '../performance/advancedOptimizer';
import { getPerformanceMetrics, getPerformanceAlerts } from '../middleware/performanceMonitor';
import { queryStore } from '../performance/databaseAnalyzer';
import { cacheMetricsStore } from '../performance/redisCache';

async function runAdvancedOptimizationDemo() {
  console.log('🚀 === ADVANCED OPTIMIZATION DEMO ===\n');
  
  const prisma = new PrismaClient();
  const optimizer = new AdvancedOptimizer(prisma);
  
  try {
    // Paso 1: Mostrar estado actual del sistema
    console.log('📊 === ESTADO ACTUAL DEL SISTEMA ===');
    const currentMetrics = getPerformanceMetrics();
    const currentAlerts = getPerformanceAlerts();
    
    console.log(`🕒 Uptime: ${Math.floor(currentMetrics.system.uptime / 60)}m ${currentMetrics.system.uptime % 60}s`);
    console.log(`💾 Memory: ${currentMetrics.system.memoryUsage.heapUsed}MB / ${currentMetrics.system.memoryUsage.heapTotal}MB`);
    console.log(`⚡ Avg Response Time: ${currentMetrics.endpoints.avgResponseTime.toFixed(2)}ms`);
    console.log(`✅ Validation Success Rate: ${currentMetrics.validation.successRate.toFixed(2)}%`);
    console.log(`📈 Total Requests: ${currentMetrics.endpoints.count}`);
    
    if (currentAlerts.length > 0) {
      console.log('\n🚨 Alertas actuales:');
      currentAlerts.forEach((alert: string) => console.log(`  - ${alert}`));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Paso 2: Ejecutar optimización completa del sistema
    console.log('🔧 === EJECUTANDO OPTIMIZACIÓN AVANZADA ===');
    
    const optimizationResult = await optimizer.optimizeSystem();
    
    console.log(`\n🏆 RESULTADO DE OPTIMIZACIÓN:`);
    console.log(`   📊 Score General: ${optimizationResult.overallScore}/100`);
    console.log(`   ⏰ Timestamp: ${optimizationResult.timestamp.toISOString()}`);
    
    console.log(`\n📈 OPTIMIZACIONES APLICADAS:`);
    optimizationResult.optimizations.forEach((opt, index: number) => {
      console.log(`   ${index + 1}. ${opt.type.toUpperCase()}:`);
      console.log(`      📈 Mejora: ${opt.improvement.toFixed(2)}%`);
      console.log(`      📝 Descripción: ${opt.description}`);
      console.log(`      💡 Recomendaciones: ${opt.recommendations.length}`);
    });
    
    if (optimizationResult.bottlenecks.length > 0) {
      console.log(`\n⚠️ BOTTLENECKS IDENTIFICADOS:`);
      optimizationResult.bottlenecks.forEach((bottleneck: string) => {
        console.log(`   - ${bottleneck}`);
      });
    }
    
    console.log(`\n💡 RECOMENDACIONES PRINCIPALES:`);
    optimizationResult.recommendations.slice(0, 5).forEach((rec: string, index: number) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Paso 3: Mostrar métricas después de la optimización
    console.log('📊 === MÉTRICAS POST-OPTIMIZACIÓN ===');
    const postMetrics = getPerformanceMetrics();
    const postAlerts = getPerformanceAlerts();
    
    console.log(`🕒 Uptime: ${Math.floor(postMetrics.system.uptime / 60)}m ${postMetrics.system.uptime % 60}s`);
    console.log(`💾 Memory: ${postMetrics.system.memoryUsage.heapUsed}MB / ${postMetrics.system.memoryUsage.heapTotal}MB`);
    console.log(`⚡ Avg Response Time: ${postMetrics.endpoints.avgResponseTime.toFixed(2)}ms`);
    console.log(`✅ Validation Success Rate: ${postMetrics.validation.successRate.toFixed(2)}%`);
    console.log(`📈 Total Requests: ${postMetrics.endpoints.count}`);
    
    if (postAlerts.length > 0) {
      console.log('\n🚨 Alertas post-optimización:');
      postAlerts.forEach((alert: string) => console.log(`  - ${alert}`));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Paso 4: Comparación antes vs después
    console.log('📊 === COMPARACIÓN ANTES VS DESPUÉS ===');
    
    const responseTimeImprovement = ((currentMetrics.endpoints.avgResponseTime - postMetrics.endpoints.avgResponseTime) / currentMetrics.endpoints.avgResponseTime) * 100;
    const memoryImprovement = ((currentMetrics.system.memoryUsage.heapUsed - postMetrics.system.memoryUsage.heapUsed) / currentMetrics.system.memoryUsage.heapUsed) * 100;
    const alertReduction = currentAlerts.length - postAlerts.length;
    
    console.log(`⚡ Response Time: ${currentMetrics.endpoints.avgResponseTime.toFixed(2)}ms → ${postMetrics.endpoints.avgResponseTime.toFixed(2)}ms (${responseTimeImprovement > 0 ? '+' : ''}${responseTimeImprovement.toFixed(2)}%)`);
    console.log(`💾 Memory Usage: ${currentMetrics.system.memoryUsage.heapUsed}MB → ${postMetrics.system.memoryUsage.heapUsed}MB (${memoryImprovement > 0 ? '+' : ''}${memoryImprovement.toFixed(2)}%)`);
    console.log(`🚨 Alerts: ${currentAlerts.length} → ${postAlerts.length} (${alertReduction > 0 ? '+' : ''}${alertReduction})`);
    console.log(`📊 Overall Score: ${optimizationResult.overallScore}/100`);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Paso 5: Generar reporte final
    console.log('📋 === REPORTE FINAL DE OPTIMIZACIÓN ===');
    
    const report = optimizer.generateOptimizationReport();
    
    console.log(`📅 Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`🔄 Total Optimizations: ${report.totalOptimizations}`);
    console.log(`📈 Average Improvement: ${report.averageImprovement.toFixed(2)}%`);
    
    if (report.latestOptimization) {
      console.log(`\n🎯 Última Optimización:`);
      console.log(`   Tipo: ${report.latestOptimization.type}`);
      console.log(`   Mejora: ${report.latestOptimization.improvement.toFixed(2)}%`);
      console.log(`   Descripción: ${report.latestOptimization.description}`);
    }
    
    console.log(`\n💡 Recomendaciones Finales:`);
    report.recommendations.slice(0, 10).forEach((rec: string, index: number) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Paso 6: Evaluación final del sistema
    console.log('🏆 === EVALUACIÓN FINAL DEL SISTEMA ===');
    
    const finalScore = optimizationResult.overallScore;
    let grade = '';
    let status = '';
    
    if (finalScore >= 95) {
      grade = 'A+';
      status = 'EXCELENTE - Sistema completamente optimizado';
    } else if (finalScore >= 90) {
      grade = 'A';
      status = 'MUY BUENO - Sistema altamente optimizado';
    } else if (finalScore >= 80) {
      grade = 'B+';
      status = 'BUENO - Sistema bien optimizado';
    } else if (finalScore >= 70) {
      grade = 'B';
      status = 'ACEPTABLE - Sistema moderadamente optimizado';
    } else {
      grade = 'C';
      status = 'REQUIERE MEJORAS - Sistema necesita optimización';
    }
    
    console.log(`📊 Score Final: ${finalScore}/100 (${grade})`);
    console.log(`📈 Status: ${status}`);
    
    // Métricas clave
    const keyMetrics = {
      responseTime: postMetrics.endpoints.avgResponseTime,
      memoryUsage: postMetrics.system.memoryUsage.heapUsed,
      validationSuccess: postMetrics.validation.successRate,
      alertCount: postAlerts.length
    };
    
    console.log(`\n🎯 Métricas Clave:`);
    console.log(`   ⚡ Response Time: ${keyMetrics.responseTime.toFixed(2)}ms ${keyMetrics.responseTime < 100 ? '✅' : '⚠️'}`);
    console.log(`   💾 Memory Usage: ${keyMetrics.memoryUsage}MB ${keyMetrics.memoryUsage < 500 ? '✅' : '⚠️'}`);
    console.log(`   ✅ Validation Success: ${keyMetrics.validationSuccess.toFixed(2)}% ${keyMetrics.validationSuccess > 95 ? '✅' : '⚠️'}`);
    console.log(`   🚨 Alerts: ${keyMetrics.alertCount} ${keyMetrics.alertCount === 0 ? '✅' : '⚠️'}`);
    
    // Resumen de mejoras
    console.log(`\n📈 RESUMEN DE MEJORAS:`);
    console.log(`   🚀 Optimizaciones aplicadas: ${optimizationResult.optimizations.length}`);
    console.log(`   📊 Mejora promedio: ${optimizationResult.optimizations.reduce((sum, opt) => sum + opt.improvement, 0) / optimizationResult.optimizations.length}%`);
    console.log(`   🎯 Score final: ${finalScore}/100`);
    console.log(`   📋 Recomendaciones: ${optimizationResult.recommendations.length}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ === DEMO DE OPTIMIZACIÓN AVANZADA COMPLETADO ===');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el demo
if (require.main === module) {
  runAdvancedOptimizationDemo().catch(console.error);
}

export { runAdvancedOptimizationDemo };
