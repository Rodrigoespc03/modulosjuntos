#!/usr/bin/env ts-node

/**
 * 🧪 DEMO VALIDACIÓN ESCALABILIDAD - FASE 4.5
 * Sistema Procura - Validación metódica paso a paso
 */

import ScalingValidator from '../scaling/scalingValidator';

interface ValidationProgress {
  phase: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  score?: number;
  timestamp?: Date;
  details?: string;
}

class ScalingValidationDemo {
  private validator: ScalingValidator;
  private progress: ValidationProgress[] = [];

  constructor() {
    this.validator = new ScalingValidator();
    this.initializeProgress();
  }

  private initializeProgress(): void {
    this.progress = [
      { phase: 'BASELINE', status: 'pending' },
      { phase: 'NGINX_LOAD_BALANCER', status: 'pending' },
      { phase: 'PM2_CLUSTER_MODE', status: 'pending' },
      { phase: 'WORKERS_IMPLEMENTATION', status: 'pending' },
      { phase: 'AUTO_SCALING', status: 'pending' },
      { phase: 'FINAL_INTEGRATION', status: 'pending' }
    ];
  }

  async runStepByStepValidation(): Promise<void> {
    console.log('🚀 === DEMO VALIDACIÓN ESCALABILIDAD PASO A PASO ===\n');
    console.log('📋 Contexto: 2 usuarios iniciales → 5-10 usuarios en 1-2 meses\n');

    // PASO 1: ESTABLECER BASELINE
    await this.runBaselineValidation();

    // PASO 2: VALIDAR NGINX LOAD BALANCER
    await this.runNginxValidation();

    // PASO 3: VALIDAR PM2 CLUSTER MODE
    await this.runPM2Validation();

    // PASO 4: VALIDAR WORKERS
    await this.runWorkersValidation();

    // PASO 5: VALIDAR AUTO-SCALING
    await this.runAutoScalingValidation();

    // PASO 6: VALIDACIÓN FINAL
    await this.runFinalValidation();

    // GENERAR REPORTE FINAL
    await this.generateFinalReport();
  }

  private async runBaselineValidation(): Promise<void> {
    console.log('📊 === PASO 1: ESTABLECIENDO BASELINE ===');
    
    try {
      this.updateProgress('BASELINE', 'in_progress');
      
      // Establecer baseline
      await this.validator.establishBaseline();
      
      this.updateProgress('BASELINE', 'completed', 100);
      console.log('✅ Baseline establecido correctamente\n');
      
    } catch (error) {
      this.updateProgress('BASELINE', 'failed', 0, (error as Error).message);
      console.error('❌ Error estableciendo baseline:', error);
    }
  }

  private async runNginxValidation(): Promise<void> {
    console.log('🌐 === PASO 2: VALIDANDO NGINX LOAD BALANCER ===');
    
    try {
      this.updateProgress('NGINX_LOAD_BALANCER', 'in_progress');
      
      const report = await this.validator.validateNginxLoadBalancer();
      
      this.updateProgress('NGINX_LOAD_BALANCER', 'completed', report.overallScore);
      console.log(`✅ NGINX Load Balancer validado: ${report.overallScore.toFixed(1)}%\n`);
      
      // Mostrar recomendaciones
      if (report.recommendations.length > 0) {
        console.log('💡 Recomendaciones NGINX:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        console.log('');
      }
      
    } catch (error) {
      this.updateProgress('NGINX_LOAD_BALANCER', 'failed', 0, (error as Error).message);
      console.error('❌ Error validando NGINX:', error);
    }
  }

  private async runPM2Validation(): Promise<void> {
    console.log('🚀 === PASO 3: VALIDANDO PM2 CLUSTER MODE ===');
    
    try {
      this.updateProgress('PM2_CLUSTER_MODE', 'in_progress');
      
      const report = await this.validator.validatePM2ClusterMode();
      
      this.updateProgress('PM2_CLUSTER_MODE', 'completed', report.overallScore);
      console.log(`✅ PM2 Cluster Mode validado: ${report.overallScore.toFixed(1)}%\n`);
      
      // Mostrar recomendaciones
      if (report.recommendations.length > 0) {
        console.log('💡 Recomendaciones PM2:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        console.log('');
      }
      
    } catch (error) {
      this.updateProgress('PM2_CLUSTER_MODE', 'failed', 0, (error as Error).message);
      console.error('❌ Error validando PM2:', error);
    }
  }

  private async runWorkersValidation(): Promise<void> {
    console.log('⚙️ === PASO 4: VALIDANDO WORKERS ===');
    
    try {
      this.updateProgress('WORKERS_IMPLEMENTATION', 'in_progress');
      
      const report = await this.validator.validateWorkers();
      
      this.updateProgress('WORKERS_IMPLEMENTATION', 'completed', report.overallScore);
      console.log(`✅ Workers validados: ${report.overallScore.toFixed(1)}%\n`);
      
      // Mostrar recomendaciones
      if (report.recommendations.length > 0) {
        console.log('💡 Recomendaciones Workers:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        console.log('');
      }
      
    } catch (error) {
      this.updateProgress('WORKERS_IMPLEMENTATION', 'failed', 0, (error as Error).message);
      console.error('❌ Error validando Workers:', error);
    }
  }

  private async runAutoScalingValidation(): Promise<void> {
    console.log('📈 === PASO 5: VALIDANDO AUTO-SCALING ===');
    
    try {
      this.updateProgress('AUTO_SCALING', 'in_progress');
      
      const report = await this.validator.validateAutoScaling();
      
      this.updateProgress('AUTO_SCALING', 'completed', report.overallScore);
      console.log(`✅ Auto-Scaling validado: ${report.overallScore.toFixed(1)}%\n`);
      
      // Mostrar recomendaciones
      if (report.recommendations.length > 0) {
        console.log('💡 Recomendaciones Auto-Scaling:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        console.log('');
      }
      
    } catch (error) {
      this.updateProgress('AUTO_SCALING', 'failed', 0, (error as Error).message);
      console.error('❌ Error validando Auto-Scaling:', error);
    }
  }

  private async runFinalValidation(): Promise<void> {
    console.log('🎯 === PASO 6: VALIDACIÓN FINAL INTEGRADA ===');
    
    try {
      this.updateProgress('FINAL_INTEGRATION', 'in_progress');
      
      const report = await this.validator.validateFinalIntegration();
      
      this.updateProgress('FINAL_INTEGRATION', 'completed', report.overallScore);
      console.log(`✅ Validación Final completada: ${report.overallScore.toFixed(1)}%\n`);
      
      // Mostrar recomendaciones
      if (report.recommendations.length > 0) {
        console.log('💡 Recomendaciones Finales:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        console.log('');
      }
      
    } catch (error) {
      this.updateProgress('FINAL_INTEGRATION', 'failed', 0, (error as Error).message);
      console.error('❌ Error en validación final:', error);
    }
  }

  private updateProgress(phase: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', score?: number, details?: string): void {
    const progressItem = this.progress.find(p => p.phase === phase);
    if (progressItem) {
      progressItem.status = status;
      progressItem.score = score;
      progressItem.timestamp = new Date();
      progressItem.details = details;
    }
  }

  private async generateFinalReport(): Promise<void> {
    console.log('📊 === REPORTE FINAL DE VALIDACIÓN ===\n');

    // Calcular métricas generales
    const completedPhases = this.progress.filter(p => p.status === 'completed');
    const failedPhases = this.progress.filter(p => p.status === 'failed');
    const totalPhases = this.progress.length;
    
    const overallScore = completedPhases.length > 0 
      ? completedPhases.reduce((sum, p) => sum + (p.score || 0), 0) / completedPhases.length
      : 0;

    // Mostrar progreso por fase
    console.log('📋 PROGRESO POR FASE:');
    this.progress.forEach(phase => {
      const statusIcon = this.getStatusIcon(phase.status);
      const scoreText = phase.score !== undefined ? ` (${phase.score.toFixed(1)}%)` : '';
      console.log(`   ${statusIcon} ${phase.phase}${scoreText}`);
      
      if (phase.details) {
        console.log(`      ⚠️ ${phase.details}`);
      }
    });

    console.log('\n📈 MÉTRICAS GENERALES:');
    console.log(`   • Fases completadas: ${completedPhases.length}/${totalPhases}`);
    console.log(`   • Fases fallidas: ${failedPhases.length}`);
    console.log(`   • Score promedio: ${overallScore.toFixed(1)}%`);
    console.log(`   • Estado general: ${this.getOverallStatus(overallScore, failedPhases.length)}`);

    // Recomendaciones según el contexto de crecimiento
    console.log('\n🎯 RECOMENDACIONES PARA CRECIMIENTO GRADUAL:');
    console.log('   📊 Contexto: 2 usuarios → 5-10 usuarios en 1-2 meses');
    
    if (overallScore >= 80) {
      console.log('   ✅ Sistema preparado para crecimiento gradual');
      console.log('   📈 Puedes comenzar con implementación básica');
      console.log('   🔄 Monitorear métricas durante el crecimiento');
    } else if (overallScore >= 60) {
      console.log('   ⚠️ Sistema necesita ajustes menores');
      console.log('   🔧 Implementar correcciones antes del crecimiento');
      console.log('   📊 Re-evaluar después de ajustes');
    } else {
      console.log('   ❌ Sistema requiere mejoras significativas');
      console.log('   🛠️ Implementar correcciones críticas primero');
      console.log('   🔄 Re-validar completamente después de correcciones');
    }

    // Próximos pasos
    console.log('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:');
    
    if (failedPhases.length === 0) {
      console.log('   1. ✅ Implementar NGINX Load Balancer');
      console.log('   2. ✅ Configurar PM2 Cluster Mode');
      console.log('   3. ✅ Implementar Workers básicos');
      console.log('   4. ✅ Configurar Auto-Scaling básico');
      console.log('   5. 🎯 Desplegar en producción');
      console.log('   6. 📊 Monitorear durante crecimiento');
    } else {
      console.log('   1. 🔧 Corregir fases fallidas');
      console.log('   2. 🧪 Re-ejecutar validaciones');
      console.log('   3. ✅ Implementar componentes exitosos');
      console.log('   4. 🎯 Desplegar gradualmente');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 === VALIDACIÓN DE ESCALABILIDAD COMPLETADA ===');
    console.log('='.repeat(60));
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  }

  private getOverallStatus(score: number, failedCount: number): string {
    if (failedCount > 0) {
      return '❌ REQUIERE CORRECCIONES';
    } else if (score >= 90) {
      return '✅ EXCELENTE';
    } else if (score >= 80) {
      return '✅ BUENO';
    } else if (score >= 60) {
      return '⚠️ ACEPTABLE';
    } else {
      return '❌ INSUFICIENTE';
    }
  }

  // Método para validación rápida (solo baseline)
  async runQuickBaseline(): Promise<void> {
    console.log('⚡ === VALIDACIÓN RÁPIDA DE BASELINE ===\n');
    
    try {
      await this.validator.establishBaseline();
      console.log('✅ Baseline establecido correctamente');
      console.log('📊 Sistema listo para implementación gradual');
    } catch (error) {
      console.error('❌ Error estableciendo baseline:', error);
    }
  }
}

// Ejecutar validación
async function runScalingValidation() {
  const demo = new ScalingValidationDemo();
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    await demo.runQuickBaseline();
  } else {
    await demo.runStepByStepValidation();
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  runScalingValidation().catch(console.error);
}

export { ScalingValidationDemo, runScalingValidation };



