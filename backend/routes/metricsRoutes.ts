import express from 'express';
import { 
  getPerformanceMetrics, 
  getPerformanceAlerts, 
  metricsStore,
  logPerformanceMetrics 
} from '../middleware/performanceMonitor';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// GET /api/metrics - Obtener métricas generales de performance
router.get('/', asyncHandler(async (req, res) => {
  const metrics = getPerformanceMetrics();
  const alerts = getPerformanceAlerts();
  
  res.json({
    success: true,
    data: {
      ...metrics,
      alerts,
      timestamp: new Date().toISOString()
    }
  });
}));

// GET /api/metrics/validation - Métricas específicas de validación
router.get('/validation', asyncHandler(async (req, res) => {
  const { endpoint, timeRange } = req.query;
  
  const timeRangeMs = timeRange ? parseInt(timeRange as string) * 1000 : 3600000; // 1 hora por defecto
  const metrics = metricsStore.getValidationMetrics(endpoint as string, timeRangeMs);
  const stats = metricsStore.getValidationStats(endpoint as string);
  
  res.json({
    success: true,
    data: {
      stats,
      metrics: metrics.slice(-50), // Últimas 50 métricas
      total: metrics.length
    }
  });
}));

// GET /api/metrics/endpoints - Métricas específicas de endpoints
router.get('/endpoints', asyncHandler(async (req, res) => {
  const { endpoint, timeRange } = req.query;
  
  const timeRangeMs = timeRange ? parseInt(timeRange as string) * 1000 : 3600000; // 1 hora por defecto
  const metrics = metricsStore.getEndpointMetrics(endpoint as string, timeRangeMs);
  const stats = metricsStore.getEndpointStats(endpoint as string);
  
  res.json({
    success: true,
    data: {
      stats,
      metrics: metrics.slice(-50), // Últimas 50 métricas
      total: metrics.length
    }
  });
}));

// GET /api/metrics/alerts - Obtener alertas actuales
router.get('/alerts', asyncHandler(async (req, res) => {
  const alerts = getPerformanceAlerts();
  
  res.json({
    success: true,
    data: {
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    }
  });
}));

// GET /api/metrics/summary - Resumen ejecutivo de performance
router.get('/summary', asyncHandler(async (req, res) => {
  const metrics = getPerformanceMetrics();
  const alerts = getPerformanceAlerts();
  
  // Calcular métricas de los últimos períodos
  const validationMetrics1h = metricsStore.getValidationStats();
  const endpointMetrics1h = metricsStore.getEndpointStats();
  
  // Obtener top endpoints más lentos
  const recentEndpoints = metricsStore.getEndpointMetrics(undefined, 3600000);
  const endpointAvgs = recentEndpoints.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!acc[key]) {
      acc[key] = { totalTime: 0, count: 0 };
    }
    acc[key].totalTime += metric.responseTime;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { totalTime: number; count: number }>);
  
  const slowestEndpoints = Object.entries(endpointAvgs)
    .map(([endpoint, data]) => ({
      endpoint,
      avgTime: data.totalTime / data.count,
      count: data.count
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);
  
  const summary = {
    system: {
      status: alerts.length === 0 ? 'healthy' : 'warning',
      uptime: metrics.system.uptime,
      memoryUsageMB: metrics.system.memoryUsage.heapUsed
    },
    performance: {
      avgResponseTime: endpointMetrics1h.avgResponseTime,
      totalRequests: endpointMetrics1h.count,
      validationSuccessRate: validationMetrics1h.successRate,
      validationAvgTime: validationMetrics1h.avgTime
    },
    alerts: {
      count: alerts.length,
      list: alerts
    },
    topSlowEndpoints: slowestEndpoints
  };
  
  res.json({
    success: true,
    data: summary
  });
}));

// POST /api/metrics/log - Forzar logging de métricas (para debugging)
router.post('/log', asyncHandler(async (req, res) => {
  logPerformanceMetrics();
  
  res.json({
    success: true,
    message: 'Métricas loggeadas en consola'
  });
}));

// GET /api/metrics/health - Health check con métricas básicas
router.get('/health', asyncHandler(async (req, res) => {
  const alerts = getPerformanceAlerts();
  const metrics = getPerformanceMetrics();
  
  const healthStatus = {
    status: alerts.length === 0 ? 'healthy' : 'warning',
    uptime: metrics.system.uptime,
    memory: metrics.system.memoryUsage.heapUsed,
    alerts: alerts.length,
    timestamp: new Date().toISOString()
  };
  
  const statusCode = healthStatus.status === 'healthy' ? 200 : 206;
  
  res.status(statusCode).json({
    success: true,
    data: healthStatus
  });
}));

export default router;