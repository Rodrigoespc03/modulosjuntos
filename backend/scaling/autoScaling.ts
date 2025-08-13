// 🚀 AUTO-SCALING SYSTEM - SISTEMA PROCURA
// Sistema de escalado automático basado en métricas

import { performance } from 'perf_hooks';
import { RedisCache } from '../performance/redisCache';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cache = new RedisCache();

interface ScalingMetrics {
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  timestamp: Date;
}

interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  reason: string;
  currentInstances: number;
  targetInstances: number;
  metrics: ScalingMetrics;
  timestamp: Date;
}

interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  cpuThreshold: number;
  memoryThreshold: number;
  requestRateThreshold: number;
  responseTimeThreshold: number;
  errorRateThreshold: number;
  scaleUpCooldown: number; // segundos
  scaleDownCooldown: number; // segundos
  scaleUpStep: number;
  scaleDownStep: number;
}

class AutoScalingSystem {
  private isRunning = false;
  private config: ScalingConfig;
  private lastScaleUp: Date | null = null;
  private lastScaleDown: Date | null = null;
  private currentInstances: number = 1;

  constructor() {
    this.config = {
      minInstances: 1,
      maxInstances: 10,
      cpuThreshold: 70, // 70% CPU
      memoryThreshold: 80, // 80% memoria
      requestRateThreshold: 1000, // 1000 requests/min
      responseTimeThreshold: 2000, // 2 segundos
      errorRateThreshold: 5, // 5% errores
      scaleUpCooldown: 300, // 5 minutos
      scaleDownCooldown: 600, // 10 minutos
      scaleUpStep: 1,
      scaleDownStep: 1
    };

    this.initializeScalingSystem();
  }

  private async initializeScalingSystem(): Promise<void> {
    console.log('🚀 Auto-Scaling System iniciado');
    
    // Configurar listeners para graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    // Iniciar monitoreo y escalado
    this.startScalingLoop();
  }

  private async startScalingLoop(): Promise<void> {
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        // Obtener métricas actuales
        const metrics = await this.collectMetrics();
        
        // Tomar decisión de escalado
        const decision = await this.makeScalingDecision(metrics);
        
        // Ejecutar acción de escalado
        await this.executeScalingAction(decision);
        
        // Guardar métricas y decisión
        await this.saveScalingData(metrics, decision);
        
        // Esperar antes de la siguiente iteración
        await this.sleep(30000); // 30 segundos
      } catch (error) {
        console.error('❌ Error en auto-scaling:', error);
        await this.sleep(60000); // 1 minuto en caso de error
      }
    }
  }

  private async collectMetrics(): Promise<ScalingMetrics> {
    const startTime = performance.now();
    
    try {
      // Obtener métricas del sistema
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = await this.getMemoryUsage();
      const requestRate = await this.getRequestRate();
      const responseTime = await this.getAverageResponseTime();
      const errorRate = await this.getErrorRate();
      const activeConnections = await this.getActiveConnections();

      return {
        cpuUsage,
        memoryUsage,
        requestRate,
        responseTime,
        errorRate,
        activeConnections,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error recolectando métricas:', error);
      throw error;
    }
  }

  private async getCPUUsage(): Promise<number> {
    try {
      // Obtener uso de CPU desde Redis o sistema
      const cpuData = await cache.get('system_cpu_usage');
      if (cpuData) {
        return JSON.parse(cpuData);
      }
      
      // Fallback: obtener desde sistema
      const os = require('os');
      const cpus = os.cpus();
      const totalIdle = cpus.reduce((acc: number, cpu: any) => acc + cpu.times.idle, 0);
      const totalTick = cpus.reduce((acc: number, cpu: any) => acc + Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0), 0);
      
      return ((totalTick - totalIdle) / totalTick) * 100;
    } catch (error) {
      console.error('❌ Error obteniendo CPU usage:', error);
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      // Obtener uso de memoria desde Redis o sistema
      const memoryData = await cache.get('system_memory_usage');
      if (memoryData) {
        return JSON.parse(memoryData);
      }
      
      // Fallback: obtener desde sistema
      const os = require('os');
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      
      return ((totalMem - freeMem) / totalMem) * 100;
    } catch (error) {
      console.error('❌ Error obteniendo memory usage:', error);
      return 0;
    }
  }

  private async getRequestRate(): Promise<number> {
    try {
      // Obtener tasa de requests desde Redis
      const requestData = await cache.get('api_request_rate');
      return requestData ? JSON.parse(requestData) : 0;
    } catch (error) {
      console.error('❌ Error obteniendo request rate:', error);
      return 0;
    }
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      // Obtener tiempo de respuesta promedio desde Redis
      const responseTimeData = await cache.get('api_average_response_time');
      return responseTimeData ? JSON.parse(responseTimeData) : 0;
    } catch (error) {
      console.error('❌ Error obteniendo response time:', error);
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      // Obtener tasa de errores desde Redis
      const errorData = await cache.get('api_error_rate');
      return errorData ? JSON.parse(errorData) : 0;
    } catch (error) {
      console.error('❌ Error obteniendo error rate:', error);
      return 0;
    }
  }

  private async getActiveConnections(): Promise<number> {
    try {
      // Obtener conexiones activas desde Redis
      const connectionsData = await cache.get('api_active_connections');
      return connectionsData ? JSON.parse(connectionsData) : 0;
    } catch (error) {
      console.error('❌ Error obteniendo active connections:', error);
      return 0;
    }
  }

  private async makeScalingDecision(metrics: ScalingMetrics): Promise<ScalingDecision> {
    const now = new Date();
    let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
    let reason = 'Métricas dentro de rangos normales';
    let targetInstances = this.currentInstances;

    // Verificar si necesitamos escalar hacia arriba
    if (this.shouldScaleUp(metrics, now)) {
      action = 'scale_up';
      targetInstances = Math.min(this.currentInstances + this.config.scaleUpStep, this.config.maxInstances);
      reason = this.getScaleUpReason(metrics);
    }
    // Verificar si necesitamos escalar hacia abajo
    else if (this.shouldScaleDown(metrics, now)) {
      action = 'scale_down';
      targetInstances = Math.max(this.currentInstances - this.config.scaleDownStep, this.config.minInstances);
      reason = this.getScaleDownReason(metrics);
    }

    return {
      action,
      reason,
      currentInstances: this.currentInstances,
      targetInstances,
      metrics,
      timestamp: now
    };
  }

  private shouldScaleUp(metrics: ScalingMetrics, now: Date): boolean {
    // Verificar cooldown
    if (this.lastScaleUp && (now.getTime() - this.lastScaleUp.getTime()) < this.config.scaleUpCooldown * 1000) {
      return false;
    }

    // Verificar métricas
    return (
      metrics.cpuUsage > this.config.cpuThreshold ||
      metrics.memoryUsage > this.config.memoryThreshold ||
      metrics.requestRate > this.config.requestRateThreshold ||
      metrics.responseTime > this.config.responseTimeThreshold ||
      metrics.errorRate > this.config.errorRateThreshold
    ) && this.currentInstances < this.config.maxInstances;
  }

  private shouldScaleDown(metrics: ScalingMetrics, now: Date): boolean {
    // Verificar cooldown
    if (this.lastScaleDown && (now.getTime() - this.lastScaleDown.getTime()) < this.config.scaleDownCooldown * 1000) {
      return false;
    }

    // Verificar métricas (todas deben estar por debajo del umbral)
    return (
      metrics.cpuUsage < this.config.cpuThreshold * 0.5 &&
      metrics.memoryUsage < this.config.memoryThreshold * 0.5 &&
      metrics.requestRate < this.config.requestRateThreshold * 0.5 &&
      metrics.responseTime < this.config.responseTimeThreshold * 0.5 &&
      metrics.errorRate < this.config.errorRateThreshold * 0.5
    ) && this.currentInstances > this.config.minInstances;
  }

  private getScaleUpReason(metrics: ScalingMetrics): string {
    const reasons = [];
    
    if (metrics.cpuUsage > this.config.cpuThreshold) {
      reasons.push(`CPU alto (${metrics.cpuUsage.toFixed(1)}%)`);
    }
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      reasons.push(`Memoria alta (${metrics.memoryUsage.toFixed(1)}%)`);
    }
    if (metrics.requestRate > this.config.requestRateThreshold) {
      reasons.push(`Tasa de requests alta (${metrics.requestRate.toFixed(0)}/min)`);
    }
    if (metrics.responseTime > this.config.responseTimeThreshold) {
      reasons.push(`Tiempo de respuesta alto (${metrics.responseTime.toFixed(0)}ms)`);
    }
    if (metrics.errorRate > this.config.errorRateThreshold) {
      reasons.push(`Tasa de errores alta (${metrics.errorRate.toFixed(1)}%)`);
    }
    
    return `Escalado hacia arriba: ${reasons.join(', ')}`;
  }

  private getScaleDownReason(metrics: ScalingMetrics): string {
    return `Escalado hacia abajo: Métricas bajas (CPU: ${metrics.cpuUsage.toFixed(1)}%, Mem: ${metrics.memoryUsage.toFixed(1)}%, Requests: ${metrics.requestRate.toFixed(0)}/min)`;
  }

  private async executeScalingAction(decision: ScalingDecision): Promise<void> {
    if (decision.action === 'maintain') {
      console.log(`🔄 Manteniendo ${decision.currentInstances} instancias: ${decision.reason}`);
      return;
    }

    try {
      if (decision.action === 'scale_up') {
        await this.scaleUp(decision.targetInstances);
        this.lastScaleUp = new Date();
        console.log(`📈 Escalado hacia arriba: ${decision.currentInstances} → ${decision.targetInstances} instancias`);
        console.log(`📋 Razón: ${decision.reason}`);
      } else if (decision.action === 'scale_down') {
        await this.scaleDown(decision.targetInstances);
        this.lastScaleDown = new Date();
        console.log(`📉 Escalado hacia abajo: ${decision.currentInstances} → ${decision.targetInstances} instancias`);
        console.log(`📋 Razón: ${decision.reason}`);
      }
    } catch (error) {
      console.error(`❌ Error ejecutando acción de escalado:`, error);
    }
  }

  private async scaleUp(targetInstances: number): Promise<void> {
    // Implementar lógica de escalado hacia arriba
    // Esto dependerá de tu infraestructura (Docker, Kubernetes, etc.)
    
    try {
      // Ejemplo para Docker Compose
      if (process.env.SCALING_METHOD === 'docker-compose') {
        await this.scaleDockerCompose(targetInstances);
      }
      // Ejemplo para PM2
      else if (process.env.SCALING_METHOD === 'pm2') {
        await this.scalePM2(targetInstances);
      }
      // Ejemplo para Kubernetes
      else if (process.env.SCALING_METHOD === 'kubernetes') {
        await this.scaleKubernetes(targetInstances);
      }
      else {
        // Método por defecto: actualizar configuración
        await this.updateInstanceCount(targetInstances);
      }
      
      this.currentInstances = targetInstances;
    } catch (error) {
      console.error('❌ Error en scale up:', error);
      throw error;
    }
  }

  private async scaleDown(targetInstances: number): Promise<void> {
    // Implementar lógica de escalado hacia abajo
    
    try {
      // Ejemplo para Docker Compose
      if (process.env.SCALING_METHOD === 'docker-compose') {
        await this.scaleDockerCompose(targetInstances);
      }
      // Ejemplo para PM2
      else if (process.env.SCALING_METHOD === 'pm2') {
        await this.scalePM2(targetInstances);
      }
      // Ejemplo para Kubernetes
      else if (process.env.SCALING_METHOD === 'kubernetes') {
        await this.scaleKubernetes(targetInstances);
      }
      else {
        // Método por defecto: actualizar configuración
        await this.updateInstanceCount(targetInstances);
      }
      
      this.currentInstances = targetInstances;
    } catch (error) {
      console.error('❌ Error en scale down:', error);
      throw error;
    }
  }

  private async scaleDockerCompose(instances: number): Promise<void> {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Escalar el servicio backend
      await execAsync(`docker-compose up -d --scale backend=${instances}`);
      console.log(`🐳 Docker Compose escalado a ${instances} instancias`);
    } catch (error) {
      console.error('❌ Error escalando Docker Compose:', error);
      throw error;
    }
  }

  private async scalePM2(instances: number): Promise<void> {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Escalar la aplicación PM2
      await execAsync(`pm2 scale procura-backend ${instances}`);
      console.log(`🚀 PM2 escalado a ${instances} instancias`);
    } catch (error) {
      console.error('❌ Error escalando PM2:', error);
      throw error;
    }
  }

  private async scaleKubernetes(instances: number): Promise<void> {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Escalar el deployment de Kubernetes
      await execAsync(`kubectl scale deployment procura-backend --replicas=${instances}`);
      console.log(`☸️ Kubernetes escalado a ${instances} réplicas`);
    } catch (error) {
      console.error('❌ Error escalando Kubernetes:', error);
      throw error;
    }
  }

  private async updateInstanceCount(instances: number): Promise<void> {
    try {
      // Actualizar el número de instancias en Redis
      await cache.set('current_instances', instances.toString());
      console.log(`📊 Instancias actualizadas a ${instances}`);
    } catch (error) {
      console.error('❌ Error actualizando número de instancias:', error);
      throw error;
    }
  }

  private async saveScalingData(metrics: ScalingMetrics, decision: ScalingDecision): Promise<void> {
    try {
      const scalingData = {
        metrics,
        decision,
        timestamp: new Date()
      };

      // Guardar en Redis para historial
      const scalingHistory = await cache.get('scaling_history');
      const history = scalingHistory ? JSON.parse(scalingHistory) : [];
      history.push(scalingData);
      
      // Mantener solo los últimos 100 registros
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      await cache.set('scaling_history', JSON.stringify(history), 86400); // 24 horas
      
      // Guardar en base de datos para análisis a largo plazo
      await this.saveToDatabase(scalingData);
    } catch (error) {
      console.error('❌ Error guardando datos de escalado:', error);
    }
  }

  private async saveToDatabase(scalingData: any): Promise<void> {
    try {
      await prisma.scalingLogs.create({
        data: {
          cpu_usage: scalingData.metrics.cpuUsage,
          memory_usage: scalingData.metrics.memoryUsage,
          request_rate: scalingData.metrics.requestRate,
          response_time: scalingData.metrics.responseTime,
          error_rate: scalingData.metrics.errorRate,
          active_connections: scalingData.metrics.activeConnections,
          scaling_action: scalingData.decision.action,
          current_instances: scalingData.decision.currentInstances,
          target_instances: scalingData.decision.targetInstances,
          reason: scalingData.decision.reason,
          timestamp: scalingData.timestamp
        }
      });
    } catch (error) {
      console.error('❌ Error guardando en base de datos:', error);
    }
  }

  // Métodos públicos para configuración y monitoreo
  public async updateConfig(newConfig: Partial<ScalingConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuración de auto-scaling actualizada:', this.config);
  }

  public async getCurrentStatus(): Promise<any> {
    const metrics = await this.collectMetrics();
    const decision = await this.makeScalingDecision(metrics);
    
    return {
      currentInstances: this.currentInstances,
      config: this.config,
      metrics,
      lastDecision: decision,
      lastScaleUp: this.lastScaleUp,
      lastScaleDown: this.lastScaleDown
    };
  }

  public async getScalingHistory(): Promise<any[]> {
    try {
      const history = await cache.get('scaling_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('❌ Error obteniendo historial de escalado:', error);
      return [];
    }
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 Iniciando shutdown graceful del Auto-Scaling System...');
    this.isRunning = false;
    
    // Esperar a que se complete el ciclo actual
    await this.sleep(5000);
    
    // Cerrar conexiones
    await prisma.$disconnect();
    await cache.disconnect();
    
    console.log('✅ Auto-Scaling System cerrado correctamente');
    process.exit(0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Iniciar el sistema de auto-scaling
const autoScalingSystem = new AutoScalingSystem();

export default autoScalingSystem;



