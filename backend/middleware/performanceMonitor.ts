import { Request, Response, NextFunction } from 'express';

// Interfaces para métricas
interface ValidationMetrics {
  endpoint: string;
  method: string;
  validationTime: number;
  validationSuccess: boolean;
  errorType?: string;
  timestamp: Date;
}

interface EndpointMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

// Almacenamiento en memoria (en producción usar Redis/Database)
class MetricsStore {
  private validationMetrics: ValidationMetrics[] = [];
  private endpointMetrics: EndpointMetrics[] = [];
  private readonly maxStoredMetrics = 1000;

  addValidationMetric(metric: ValidationMetrics) {
    this.validationMetrics.push(metric);
    // Mantener solo las últimas N métricas
    if (this.validationMetrics.length > this.maxStoredMetrics) {
      this.validationMetrics = this.validationMetrics.slice(-this.maxStoredMetrics);
    }
  }

  addEndpointMetric(metric: EndpointMetrics) {
    this.endpointMetrics.push(metric);
    if (this.endpointMetrics.length > this.maxStoredMetrics) {
      this.endpointMetrics = this.endpointMetrics.slice(-this.maxStoredMetrics);
    }
  }

  getValidationMetrics(endpoint?: string, timeRange?: number): ValidationMetrics[] {
    let metrics = this.validationMetrics;
    
    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }
    
    if (timeRange) {
      const cutoff = new Date(Date.now() - timeRange);
      metrics = metrics.filter(m => m.timestamp > cutoff);
    }
    
    return metrics;
  }

  getEndpointMetrics(endpoint?: string, timeRange?: number): EndpointMetrics[] {
    let metrics = this.endpointMetrics;
    
    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }
    
    if (timeRange) {
      const cutoff = new Date(Date.now() - timeRange);
      metrics = metrics.filter(m => m.timestamp > cutoff);
    }
    
    return metrics;
  }

  getValidationStats(endpoint?: string) {
    const metrics = this.getValidationMetrics(endpoint, 3600000); // Última hora
    
    if (metrics.length === 0) {
      return {
        count: 0,
        avgTime: 0,
        successRate: 0,
        slowestValidation: 0
      };
    }

    const totalTime = metrics.reduce((sum, m) => sum + m.validationTime, 0);
    const successCount = metrics.filter(m => m.validationSuccess).length;
    const maxTime = Math.max(...metrics.map(m => m.validationTime));

    return {
      count: metrics.length,
      avgTime: totalTime / metrics.length,
      successRate: (successCount / metrics.length) * 100,
      slowestValidation: maxTime
    };
  }

  getEndpointStats(endpoint?: string) {
    const metrics = this.getEndpointMetrics(endpoint, 3600000); // Última hora
    
    if (metrics.length === 0) {
      return {
        count: 0,
        avgResponseTime: 0,
        avgMemoryUsage: 0,
        statusCodes: {}
      };
    }

    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const totalMemory = metrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0);
    
    const statusCodes: Record<number, number> = {};
    metrics.forEach(m => {
      statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1;
    });

    return {
      count: metrics.length,
      avgResponseTime: totalResponseTime / metrics.length,
      avgMemoryUsage: totalMemory / metrics.length,
      statusCodes
    };
  }
}

// Instancia global del store de métricas
export const metricsStore = new MetricsStore();

// Middleware para monitorear performance de endpoints
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  // Interceptar el final de la respuesta
  const originalSend = res.send;
  res.send = function(data: any) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const metric: EndpointMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime: endTime - startTime,
      statusCode: res.statusCode,
      timestamp: new Date(),
      memoryUsage: {
        heapUsed: endMemory.heapUsed,
        heapTotal: endMemory.heapTotal,
        external: endMemory.external
      }
    };
    
    metricsStore.addEndpointMetric(metric);
    
    // Log si el request es lento (>1000ms)
    if (metric.responseTime > 1000) {
      console.warn(`🐌 Slow request detected: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`);
    }
    
    // Log si el uso de memoria es alto (>100MB)
    if (metric.memoryUsage.heapUsed > 100 * 1024 * 1024) {
      console.warn(`💾 High memory usage: ${metric.method} ${metric.endpoint} - ${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware específico para monitorear validaciones
export const validationMonitor = (endpoint: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Interceptar errores de validación
    const originalJson = res.json;
    res.json = function(data: any) {
      const endTime = Date.now();
      
      const isValidationError = res.statusCode === 400 && 
        (data.error?.includes('validación') || data.errors);
      
      const metric: ValidationMetrics = {
        endpoint,
        method: req.method,
        validationTime: endTime - startTime,
        validationSuccess: !isValidationError,
        errorType: isValidationError ? 'validation_error' : undefined,
        timestamp: new Date()
      };
      
      metricsStore.addValidationMetric(metric);
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Función para obtener métricas en tiempo real
export const getPerformanceMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    system: {
      uptime: Math.round(uptime),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
      }
    },
    validation: metricsStore.getValidationStats(),
    endpoints: metricsStore.getEndpointStats()
  };
};

// Función para obtener alertas automáticas
export const getPerformanceAlerts = () => {
  const alerts: string[] = [];
  const endpointStats = metricsStore.getEndpointStats();
  const validationStats = metricsStore.getValidationStats();
  const memoryUsage = process.memoryUsage();
  
  // Alertas de respuesta lenta
  if (endpointStats.avgResponseTime > 500) {
    alerts.push(`⚠️ Average response time high: ${endpointStats.avgResponseTime.toFixed(2)}ms`);
  }
  
  // Alertas de memoria
  const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
  if (memoryMB > 500) {
    alerts.push(`⚠️ High memory usage: ${memoryMB.toFixed(2)}MB`);
  }
  
  // Alertas de validación
  if (validationStats.successRate < 95 && validationStats.count > 10) {
    alerts.push(`⚠️ Low validation success rate: ${validationStats.successRate.toFixed(2)}%`);
  }
  
  if (validationStats.avgTime > 100) {
    alerts.push(`⚠️ Slow validation average: ${validationStats.avgTime.toFixed(2)}ms`);
  }
  
  return alerts;
};

// Función para limpiar métricas antiguas (llamar periódicamente)
export const cleanupOldMetrics = (maxAge: number = 24 * 60 * 60 * 1000) => { // 24 horas por defecto
  const cutoff = new Date(Date.now() - maxAge);
  
  // En una implementación real, esto se haría en base de datos
  console.log(`🧹 Cleaned up metrics older than ${new Date(cutoff).toISOString()}`);
};

// Utility para formatear métricas para logging
export const logPerformanceMetrics = () => {
  const metrics = getPerformanceMetrics();
  const alerts = getPerformanceAlerts();
  
  console.log('\n📊 === PERFORMANCE METRICS ===');
  console.log(`🕒 Uptime: ${Math.floor(metrics.system.uptime / 60)}m ${metrics.system.uptime % 60}s`);
  console.log(`💾 Memory: ${metrics.system.memoryUsage.heapUsed}MB / ${metrics.system.memoryUsage.heapTotal}MB`);
  console.log(`✅ Validation Success Rate: ${metrics.validation.successRate.toFixed(2)}%`);
  console.log(`⚡ Avg Response Time: ${metrics.endpoints.avgResponseTime.toFixed(2)}ms`);
  console.log(`📈 Total Requests: ${metrics.endpoints.count}`);
  
  if (alerts.length > 0) {
    console.log('\n🚨 === ALERTS ===');
    alerts.forEach(alert => console.log(alert));
  }
  
  console.log('============================\n');
};