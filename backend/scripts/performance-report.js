const fs = require('fs');
const path = require('path');

/**
 * Script para generar reportes de performance del sistema
 * Usa: node scripts/performance-report.js [options]
 */

class PerformanceReporter {
  constructor() {
    this.reportDir = path.join(__dirname, '../reports');
    this.ensureReportDir();
  }

  ensureReportDir() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async generateReport(options = {}) {
    const {
      duration = '1h',
      format = 'json',
      endpoint = null
    } = options;

    console.log('📊 Generando reporte de performance...');
    console.log(`⏱️  Duración: ${duration}`);
    console.log(`📋 Formato: ${format}`);
    if (endpoint) console.log(`🎯 Endpoint: ${endpoint}`);

    try {
      // En un entorno real, esto haría llamadas HTTP al servidor
      // Para este ejemplo, simulamos datos de métricas
      const report = await this.collectMetrics(duration, endpoint);
      
      const filename = this.generateFilename(format, endpoint);
      const filepath = path.join(this.reportDir, filename);

      if (format === 'json') {
        await this.saveJsonReport(filepath, report);
      } else if (format === 'html') {
        await this.saveHtmlReport(filepath, report);
      } else if (format === 'csv') {
        await this.saveCsvReport(filepath, report);
      }

      console.log(`✅ Reporte generado: ${filepath}`);
      return filepath;

    } catch (error) {
      console.error('❌ Error generando reporte:', error.message);
      throw error;
    }
  }

  async collectMetrics(duration, endpoint) {
    // Simular recolección de métricas
    // En producción, esto haría fetch() al endpoint /api/metrics
    
    const now = new Date();
    const durationMs = this.parseDuration(duration);
    const startTime = new Date(now.getTime() - durationMs);

    // Datos simulados basados en patrones reales
    const metrics = {
      metadata: {
        generatedAt: now.toISOString(),
        period: {
          start: startTime.toISOString(),
          end: now.toISOString(),
          duration: duration
        },
        endpoint: endpoint || 'all'
      },
      summary: {
        totalRequests: Math.floor(Math.random() * 1000) + 100,
        avgResponseTime: Math.random() * 200 + 50,
        validationSuccessRate: 95 + Math.random() * 5,
        errorsCount: Math.floor(Math.random() * 10),
        memoryUsageMB: Math.random() * 100 + 50
      },
      validation: {
        totalValidations: Math.floor(Math.random() * 800) + 80,
        avgValidationTime: Math.random() * 10 + 2,
        successRate: 96 + Math.random() * 4,
        slowestValidation: Math.random() * 50 + 10,
        commonErrors: [
          { type: 'required_field', count: Math.floor(Math.random() * 5) },
          { type: 'invalid_format', count: Math.floor(Math.random() * 3) },
          { type: 'business_rule', count: Math.floor(Math.random() * 2) }
        ]
      },
      endpoints: this.generateEndpointMetrics(),
      alerts: this.generateAlerts(),
      recommendations: this.generateRecommendations()
    };

    return metrics;
  }

  generateEndpointMetrics() {
    const endpoints = [
      'GET /api/usuarios',
      'POST /api/usuarios', 
      'GET /api/cobros',
      'POST /api/cobros',
      'GET /api/citas',
      'POST /api/citas',
      'GET /api/pacientes',
      'POST /api/pacientes'
    ];

    return endpoints.map(endpoint => ({
      endpoint,
      requestCount: Math.floor(Math.random() * 200) + 10,
      avgResponseTime: Math.random() * 300 + 20,
      minResponseTime: Math.random() * 50 + 5,
      maxResponseTime: Math.random() * 500 + 100,
      errorRate: Math.random() * 5,
      memoryImpact: Math.random() * 20 + 5
    }));
  }

  generateAlerts() {
    const possibleAlerts = [
      '⚠️ High memory usage detected',
      '⚠️ Slow response time on /api/cobros',
      '⚠️ Validation errors increasing',
      '⚠️ Database connection pool exhausted'
    ];

    const alertCount = Math.floor(Math.random() * 3);
    return possibleAlerts.slice(0, alertCount).map(alert => ({
      message: alert,
      severity: Math.random() > 0.5 ? 'warning' : 'critical',
      timestamp: new Date().toISOString()
    }));
  }

  generateRecommendations() {
    return [
      {
        category: 'Performance',
        title: 'Optimizar validaciones de schemas complejos',
        description: 'Considerar cache para validaciones frecuentes',
        priority: 'medium',
        estimatedImpact: 'Reducción del 15-20% en tiempo de validación'
      },
      {
        category: 'Memory',
        title: 'Implementar cleanup de métricas automático',
        description: 'Configurar limpieza periódica de métricas antigas',
        priority: 'low',
        estimatedImpact: 'Reducción del uso de memoria en 10-15%'
      },
      {
        category: 'Monitoring',
        title: 'Agregar más puntos de monitoreo',
        description: 'Incluir métricas de base de datos y cache',
        priority: 'high',
        estimatedImpact: 'Mejor visibilidad de bottlenecks'
      }
    ];
  }

  parseDuration(duration) {
    const match = duration.match(/^(\d+)([hmd])$/);
    if (!match) throw new Error('Formato de duración inválido. Usar: 1h, 30m, 1d');
    
    const [, amount, unit] = match;
    const multipliers = { m: 60000, h: 3600000, d: 86400000 };
    
    return parseInt(amount) * multipliers[unit];
  }

  generateFilename(format, endpoint) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const endpointSuffix = endpoint ? `-${endpoint.replace(/[\/]/g, '_')}` : '';
    return `performance-report${endpointSuffix}-${timestamp}.${format}`;
  }

  async saveJsonReport(filepath, report) {
    const jsonContent = JSON.stringify(report, null, 2);
    fs.writeFileSync(filepath, jsonContent, 'utf8');
  }

  async saveHtmlReport(filepath, report) {
    const htmlContent = this.generateHtmlReport(report);
    fs.writeFileSync(filepath, htmlContent, 'utf8');
  }

  async saveCsvReport(filepath, report) {
    const csvContent = this.generateCsvReport(report);
    fs.writeFileSync(filepath, csvContent, 'utf8');
  }

  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - ${report.metadata.generatedAt}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9ecef; border-radius: 5px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 5px 0; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Performance Report</h1>
        <p><strong>Generated:</strong> ${report.metadata.generatedAt}</p>
        <p><strong>Period:</strong> ${report.metadata.period.start} to ${report.metadata.period.end}</p>
        <p><strong>Duration:</strong> ${report.metadata.period.duration}</p>
    </div>

    <h2>📈 Summary</h2>
    <div class="metric">
        <strong>Total Requests:</strong><br/>${report.summary.totalRequests}
    </div>
    <div class="metric">
        <strong>Avg Response Time:</strong><br/>${report.summary.avgResponseTime.toFixed(2)}ms
    </div>
    <div class="metric">
        <strong>Validation Success Rate:</strong><br/>${report.summary.validationSuccessRate.toFixed(2)}%
    </div>
    <div class="metric">
        <strong>Memory Usage:</strong><br/>${report.summary.memoryUsageMB.toFixed(2)}MB
    </div>

    <h2>🚨 Alerts</h2>
    ${report.alerts.length === 0 ? '<p>No alerts detected ✅</p>' : 
      report.alerts.map(alert => `<div class="alert">${alert.message} (${alert.severity})</div>`).join('')
    }

    <h2>🎯 Endpoint Performance</h2>
    <table>
        <tr>
            <th>Endpoint</th>
            <th>Requests</th>
            <th>Avg Time (ms)</th>
            <th>Error Rate (%)</th>
        </tr>
        ${report.endpoints.map(ep => `
        <tr>
            <td>${ep.endpoint}</td>
            <td>${ep.requestCount}</td>
            <td>${ep.avgResponseTime.toFixed(2)}</td>
            <td>${ep.errorRate.toFixed(2)}</td>
        </tr>
        `).join('')}
    </table>

    <h2>💡 Recommendations</h2>
    ${report.recommendations.map(rec => `
    <div class="recommendation">
        <strong>${rec.title}</strong> (${rec.priority} priority)<br/>
        ${rec.description}<br/>
        <em>Impact: ${rec.estimatedImpact}</em>
    </div>
    `).join('')}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Generated by Sistema Procura Performance Monitor</p>
    </footer>
</body>
</html>`;
  }

  generateCsvReport(report) {
    const lines = [
      'Metric,Value',
      `Total Requests,${report.summary.totalRequests}`,
      `Avg Response Time (ms),${report.summary.avgResponseTime.toFixed(2)}`,
      `Validation Success Rate (%),${report.summary.validationSuccessRate.toFixed(2)}`,
      `Memory Usage (MB),${report.summary.memoryUsageMB.toFixed(2)}`,
      '',
      'Endpoint,Requests,Avg Time (ms),Error Rate (%)',
      ...report.endpoints.map(ep => 
        `${ep.endpoint},${ep.requestCount},${ep.avgResponseTime.toFixed(2)},${ep.errorRate.toFixed(2)}`
      )
    ];
    
    return lines.join('\n');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  const reporter = new PerformanceReporter();
  
  try {
    await reporter.generateReport(options);
  } catch (error) {
    console.error('Failed to generate report:', error.message);
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  console.log('🚀 Performance Report Generator');
  console.log('Usage: node performance-report.js [--duration 1h] [--format json] [--endpoint /api/usuarios]');
  console.log('');
  
  main();
}

module.exports = { PerformanceReporter };