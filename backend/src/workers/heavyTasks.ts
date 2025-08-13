// 🚀 HEAVY TASKS WORKER - SISTEMA PROCURA
// Worker para procesamiento de tareas pesadas

import { PrismaClient } from '@prisma/client';
import { RedisCache } from '../performance/redisCache';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();
const cache = new RedisCache();

interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  timestamp: Date;
}

class HeavyTasksWorker {
  private isRunning = false;
  private taskQueue: string[] = [];

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker(): Promise<void> {
    console.log('🚀 Heavy Tasks Worker iniciado');
    
    // Configurar listeners para graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    // Iniciar procesamiento de tareas
    this.startTaskProcessing();
  }

  private async startTaskProcessing(): Promise<void> {
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        // Procesar tareas pendientes
        await this.processPendingTasks();
        
        // Esperar antes de la siguiente iteración
        await this.sleep(5000);
      } catch (error) {
        console.error('❌ Error en procesamiento de tareas:', error);
        await this.sleep(10000); // Esperar más tiempo en caso de error
      }
    }
  }

  private async processPendingTasks(): Promise<void> {
    // Obtener tareas pendientes de Redis
    const pendingTasks = await this.getPendingTasks();
    
    for (const task of pendingTasks) {
      try {
        await this.processTask(task);
      } catch (error) {
        console.error(`❌ Error procesando tarea ${task}:`, error);
        await this.markTaskAsFailed(task, error as Error);
      }
    }
  }

  private async getPendingTasks(): Promise<string[]> {
    try {
      const tasks = await cache.get('pending_heavy_tasks');
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('❌ Error obteniendo tareas pendientes:', error);
      return [];
    }
  }

  private async processTask(taskId: string): Promise<void> {
    const startTime = performance.now();
    
    console.log(`🔄 Procesando tarea: ${taskId}`);
    
    // Obtener detalles de la tarea
    const taskDetails = await this.getTaskDetails(taskId);
    
    if (!taskDetails) {
      throw new Error(`Tarea ${taskId} no encontrada`);
    }

    let result: TaskResult;

    switch (taskDetails.type) {
      case 'generate_report':
        result = await this.generateReport(taskDetails.data);
        break;
      case 'data_migration':
        result = await this.performDataMigration(taskDetails.data);
        break;
      case 'batch_processing':
        result = await this.processBatchData(taskDetails.data);
        break;
      case 'cleanup_old_data':
        result = await this.cleanupOldData(taskDetails.data);
        break;
      case 'sync_external_data':
        result = await this.syncExternalData(taskDetails.data);
        break;
      default:
        throw new Error(`Tipo de tarea no soportado: ${taskDetails.type}`);
    }

    result.processingTime = performance.now() - startTime;
    result.timestamp = new Date();

    // Guardar resultado
    await this.saveTaskResult(taskId, result);
    
    // Marcar tarea como completada
    await this.markTaskAsCompleted(taskId);
    
    console.log(`✅ Tarea ${taskId} completada en ${result.processingTime.toFixed(2)}ms`);
  }

  private async generateReport(data: any): Promise<TaskResult> {
    try {
      const { reportType, filters, organizationId } = data;
      
      let reportData: any;
      
      switch (reportType) {
        case 'financial_summary':
          reportData = await this.generateFinancialSummary(filters, organizationId);
          break;
        case 'patient_statistics':
          reportData = await this.generatePatientStatistics(filters, organizationId);
          break;
        case 'appointment_analytics':
          reportData = await this.generateAppointmentAnalytics(filters, organizationId);
          break;
        case 'inventory_report':
          reportData = await this.generateInventoryReport(filters, organizationId);
          break;
        default:
          throw new Error(`Tipo de reporte no soportado: ${reportType}`);
      }

      return {
        success: true,
        data: reportData,
        processingTime: 0,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        timestamp: new Date()
      };
    }
  }

  private async generateFinancialSummary(filters: any, organizationId: string): Promise<any> {
    const { startDate, endDate } = filters;
    
    const financialData = await prisma.cobros.groupBy({
      by: ['fecha_cobro'],
      where: {
        organizacion_id: organizationId,
        fecha_cobro: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: {
        monto: true
      },
      _count: {
        id: true
      }
    });

    const totalRevenue = financialData.reduce((sum, item) => sum + (item._sum.monto || 0), 0);
    const totalTransactions = financialData.reduce((sum, item) => sum + item._count.id, 0);

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      dailyBreakdown: financialData,
      period: { startDate, endDate }
    };
  }

  private async generatePatientStatistics(filters: any, organizationId: string): Promise<any> {
    const { startDate, endDate } = filters;
    
    const patientStats = await prisma.pacientes.groupBy({
      by: ['fecha_registro'],
      where: {
        organizacion_id: organizationId,
        fecha_registro: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _count: {
        id: true
      }
    });

    const totalPatients = patientStats.reduce((sum, item) => sum + item._count.id, 0);
    
    // Obtener estadísticas de citas
    const appointmentStats = await prisma.citas.groupBy({
      by: ['estado'],
      where: {
        organizacion_id: organizationId,
        fecha_cita: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _count: {
        id: true
      }
    });

    return {
      totalPatients,
      newPatientsByDay: patientStats,
      appointmentStats,
      period: { startDate, endDate }
    };
  }

  private async generateAppointmentAnalytics(filters: any, organizationId: string): Promise<any> {
    const { startDate, endDate } = filters;
    
    const appointments = await prisma.citas.findMany({
      where: {
        organizacion_id: organizationId,
        fecha_cita: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        paciente: true,
        doctor: true,
        servicio: true
      }
    });

    const analytics = {
      total: appointments.length,
      byStatus: appointments.reduce((acc, apt) => {
        acc[apt.estado] = (acc[apt.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byService: appointments.reduce((acc, apt) => {
        const serviceName = apt.servicio?.nombre || 'Sin servicio';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byDoctor: appointments.reduce((acc, apt) => {
        const doctorName = apt.doctor?.nombre || 'Sin doctor';
        acc[doctorName] = (acc[doctorName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return analytics;
  }

  private async generateInventoryReport(filters: any, organizationId: string): Promise<any> {
    const inventoryData = await prisma.inventory.findMany({
      where: {
        organizacion_id: organizationId
      },
      include: {
        usage: true
      }
    });

    const report = {
      totalProducts: inventoryData.length,
      lowStock: inventoryData.filter(item => item.cantidad < item.stock_minimo).length,
      outOfStock: inventoryData.filter(item => item.cantidad === 0).length,
      totalValue: inventoryData.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
      usageStats: inventoryData.map(item => ({
        productName: item.nombre,
        currentStock: item.cantidad,
        minStock: item.stock_minimo,
        usageCount: item.usage.length
      }))
    };

    return report;
  }

  private async performDataMigration(data: any): Promise<TaskResult> {
    try {
      const { migrationType, sourceData, targetTable } = data;
      
      // Implementar lógica de migración según el tipo
      let migratedRecords = 0;
      
      switch (migrationType) {
        case 'batch_insert':
          migratedRecords = await this.batchInsert(sourceData, targetTable);
          break;
        case 'data_cleanup':
          migratedRecords = await this.cleanupData(sourceData, targetTable);
          break;
        case 'data_transformation':
          migratedRecords = await this.transformData(sourceData, targetTable);
          break;
        default:
          throw new Error(`Tipo de migración no soportado: ${migrationType}`);
      }

      return {
        success: true,
        data: { migratedRecords },
        processingTime: 0,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        timestamp: new Date()
      };
    }
  }

  private async processBatchData(data: any): Promise<TaskResult> {
    try {
      const { operation, records } = data;
      
      let processedRecords = 0;
      
      switch (operation) {
        case 'bulk_update':
          processedRecords = await this.bulkUpdate(records);
          break;
        case 'bulk_delete':
          processedRecords = await this.bulkDelete(records);
          break;
        case 'data_validation':
          processedRecords = await this.validateData(records);
          break;
        default:
          throw new Error(`Operación no soportada: ${operation}`);
      }

      return {
        success: true,
        data: { processedRecords },
        processingTime: 0,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        timestamp: new Date()
      };
    }
  }

  private async cleanupOldData(data: any): Promise<TaskResult> {
    try {
      const { table, olderThan, organizationId } = data;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);
      
      let deletedRecords = 0;
      
      switch (table) {
        case 'logs':
          deletedRecords = await this.cleanupLogs(cutoffDate, organizationId);
          break;
        case 'temp_files':
          deletedRecords = await this.cleanupTempFiles(cutoffDate, organizationId);
          break;
        case 'old_backups':
          deletedRecords = await this.cleanupOldBackups(cutoffDate, organizationId);
          break;
        default:
          throw new Error(`Tabla no soportada para limpieza: ${table}`);
      }

      return {
        success: true,
        data: { deletedRecords },
        processingTime: 0,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        timestamp: new Date()
      };
    }
  }

  private async syncExternalData(data: any): Promise<TaskResult> {
    try {
      const { source, syncType } = data;
      
      let syncedRecords = 0;
      
      switch (source) {
        case 'huli':
          syncedRecords = await this.syncHuliData(syncType);
          break;
        case 'google_calendar':
          syncedRecords = await this.syncGoogleCalendar(syncType);
          break;
        case 'whatsapp':
          syncedRecords = await this.syncWhatsAppData(syncType);
          break;
        default:
          throw new Error(`Fuente externa no soportada: ${source}`);
      }

      return {
        success: true,
        data: { syncedRecords },
        processingTime: 0,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        processingTime: 0,
        timestamp: new Date()
      };
    }
  }

  // Métodos auxiliares para operaciones específicas
  private async batchInsert(data: any[], table: string): Promise<number> {
    // Implementar inserción por lotes
    return data.length;
  }

  private async bulkUpdate(records: any[]): Promise<number> {
    // Implementar actualización por lotes
    return records.length;
  }

  private async bulkDelete(records: any[]): Promise<number> {
    // Implementar eliminación por lotes
    return records.length;
  }

  private async validateData(records: any[]): Promise<number> {
    // Implementar validación de datos
    return records.length;
  }

  private async cleanupLogs(cutoffDate: Date, organizationId: string): Promise<number> {
    // Implementar limpieza de logs
    return 0;
  }

  private async cleanupTempFiles(cutoffDate: Date, organizationId: string): Promise<number> {
    // Implementar limpieza de archivos temporales
    return 0;
  }

  private async cleanupOldBackups(cutoffDate: Date, organizationId: string): Promise<number> {
    // Implementar limpieza de backups antiguos
    return 0;
  }

  private async syncHuliData(syncType: string): Promise<number> {
    // Implementar sincronización con Huli
    return 0;
  }

  private async syncGoogleCalendar(syncType: string): Promise<number> {
    // Implementar sincronización con Google Calendar
    return 0;
  }

  private async syncWhatsAppData(syncType: string): Promise<number> {
    // Implementar sincronización con WhatsApp
    return 0;
  }

  private async getTaskDetails(taskId: string): Promise<any> {
    try {
      const taskDetails = await cache.get(`task_${taskId}`);
      return taskDetails ? JSON.parse(taskDetails) : null;
    } catch (error) {
      console.error('❌ Error obteniendo detalles de tarea:', error);
      return null;
    }
  }

  private async saveTaskResult(taskId: string, result: TaskResult): Promise<void> {
    try {
      await cache.set(`task_result_${taskId}`, JSON.stringify(result), 3600); // 1 hora
    } catch (error) {
      console.error('❌ Error guardando resultado de tarea:', error);
    }
  }

  private async markTaskAsCompleted(taskId: string): Promise<void> {
    try {
      await cache.set(`task_status_${taskId}`, 'completed', 3600);
      await this.removeFromPendingTasks(taskId);
    } catch (error) {
      console.error('❌ Error marcando tarea como completada:', error);
    }
  }

  private async markTaskAsFailed(taskId: string, error: Error): Promise<void> {
    try {
      await cache.set(`task_status_${taskId}`, 'failed', 3600);
      await cache.set(`task_error_${taskId}`, error.message, 3600);
      await this.removeFromPendingTasks(taskId);
    } catch (cacheError) {
      console.error('❌ Error marcando tarea como fallida:', cacheError);
    }
  }

  private async removeFromPendingTasks(taskId: string): Promise<void> {
    try {
      const pendingTasks = await this.getPendingTasks();
      const updatedTasks = pendingTasks.filter(task => task !== taskId);
      await cache.set('pending_heavy_tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('❌ Error removiendo tarea de pendientes:', error);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 Iniciando shutdown graceful del Heavy Tasks Worker...');
    this.isRunning = false;
    
    // Esperar a que se completen las tareas en curso
    await this.sleep(5000);
    
    // Cerrar conexiones
    await prisma.$disconnect();
    await cache.disconnect();
    
    console.log('✅ Heavy Tasks Worker cerrado correctamente');
    process.exit(0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Iniciar el worker
const worker = new HeavyTasksWorker();

export default worker;



