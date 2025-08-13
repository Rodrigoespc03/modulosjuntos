// 📱 WHATSAPP QUEUE WORKER - SISTEMA PROCURA
// Worker para procesamiento de cola de mensajes de WhatsApp

import { PrismaClient } from '@prisma/client';
import { RedisCache } from '../performance/redisCache';
import { performance } from 'perf_hooks';
import axios from 'axios';

const prisma = new PrismaClient();
const cache = new RedisCache();

interface WhatsAppTask {
  id: string;
  type: 'reminder' | 'notification' | 'bulk' | 'custom';
  to: string | string[];
  message: string;
  template?: string;
  data?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  retryCount: number;
  maxRetries: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
}

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  processingTime: number;
  timestamp: Date;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
}

class WhatsAppQueueWorker {
  private isRunning = false;
  private whatsappApiUrl: string;
  private whatsappToken: string;
  private messageTemplates: Map<string, string>;

  constructor() {
    this.initializeWorker();
    this.setupWhatsAppAPI();
    this.loadMessageTemplates();
  }

  private async initializeWorker(): Promise<void> {
    console.log('📱 WhatsApp Queue Worker iniciado');
    
    // Configurar listeners para graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    // Iniciar procesamiento de mensajes
    this.startMessageProcessing();
  }

  private setupWhatsAppAPI(): void {
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
    this.whatsappToken = process.env.WHATSAPP_TOKEN || '';
    
    if (!this.whatsappToken) {
      console.warn('⚠️ WhatsApp token no configurado. Los mensajes no se enviarán.');
    }
  }

  private loadMessageTemplates(): void {
    this.messageTemplates = new Map();
    
    // Cargar plantillas de mensajes
    this.messageTemplates.set('appointment_reminder', this.getAppointmentReminderTemplate());
    this.messageTemplates.set('payment_confirmation', this.getPaymentConfirmationTemplate());
    this.messageTemplates.set('welcome_message', this.getWelcomeMessageTemplate());
    this.messageTemplates.set('report_ready', this.getReportReadyTemplate());
    this.messageTemplates.set('system_notification', this.getSystemNotificationTemplate());
  }

  private async startMessageProcessing(): Promise<void> {
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        // Procesar mensajes pendientes
        await this.processPendingMessages();
        
        // Esperar antes de la siguiente iteración
        await this.sleep(3000); // 3 segundos para WhatsApp
      } catch (error) {
        console.error('❌ Error en procesamiento de mensajes WhatsApp:', error);
        await this.sleep(5000);
      }
    }
  }

  private async processPendingMessages(): Promise<void> {
    // Obtener mensajes pendientes de Redis
    const pendingMessages = await this.getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error(`❌ Error procesando mensaje WhatsApp ${message.id}:`, error);
        await this.handleMessageError(message, error as Error);
      }
    }
  }

  private async getPendingMessages(): Promise<WhatsAppTask[]> {
    try {
      const messages = await cache.get('pending_whatsapp_messages');
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('❌ Error obteniendo mensajes pendientes:', error);
      return [];
    }
  }

  private async processMessage(messageTask: WhatsAppTask): Promise<void> {
    const startTime = performance.now();
    
    console.log(`📱 Procesando mensaje WhatsApp: ${messageTask.id} (${messageTask.type})`);
    
    // Verificar si el mensaje está programado para el futuro
    if (messageTask.scheduledAt && new Date() < messageTask.scheduledAt) {
      return; // Saltar mensajes programados para el futuro
    }

    let result: WhatsAppResult;

    switch (messageTask.type) {
      case 'reminder':
        result = await this.sendReminderMessage(messageTask);
        break;
      case 'notification':
        result = await this.sendNotificationMessage(messageTask);
        break;
      case 'bulk':
        result = await this.sendBulkMessage(messageTask);
        break;
      case 'custom':
        result = await this.sendCustomMessage(messageTask);
        break;
      default:
        throw new Error(`Tipo de mensaje no soportado: ${messageTask.type}`);
    }

    result.processingTime = performance.now() - startTime;
    result.timestamp = new Date();

    // Guardar resultado
    await this.saveMessageResult(messageTask.id, result);
    
    // Marcar mensaje como enviado
    await this.markMessageAsSent(messageTask.id);
    
    console.log(`✅ Mensaje WhatsApp ${messageTask.id} enviado en ${result.processingTime.toFixed(2)}ms`);
  }

  private async sendReminderMessage(messageTask: WhatsAppTask): Promise<WhatsAppResult> {
    try {
      const template = this.messageTemplates.get('appointment_reminder');
      if (!template) {
        throw new Error('Plantilla de recordatorio no encontrada');
      }

      const messageContent = this.renderTemplate(template, messageTask.data);
      
      const result = await this.sendWhatsAppMessage({
        to: messageTask.to,
        message: messageContent,
        priority: 'high'
      });

      // Registrar el recordatorio enviado
      await this.logReminderSent(messageTask.data.appointmentId, messageTask.data.patientId);

      return {
        success: true,
        messageId: result.messageId,
        deliveryStatus: 'sent',
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

  private async sendNotificationMessage(messageTask: WhatsAppTask): Promise<WhatsAppResult> {
    try {
      const template = this.messageTemplates.get(messageTask.template || 'system_notification');
      if (!template) {
        throw new Error(`Plantilla no encontrada: ${messageTask.template}`);
      }

      const messageContent = this.renderTemplate(template, messageTask.data);
      
      const result = await this.sendWhatsAppMessage({
        to: messageTask.to,
        message: messageContent,
        priority: messageTask.priority
      });

      return {
        success: true,
        messageId: result.messageId,
        deliveryStatus: 'sent',
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

  private async sendBulkMessage(messageTask: WhatsAppTask): Promise<WhatsAppResult> {
    try {
      const recipients = Array.isArray(messageTask.to) ? messageTask.to : [messageTask.to];
      let successCount = 0;
      let errorCount = 0;

      // Enviar mensajes en lotes para evitar rate limiting
      const batchSize = 20; // WhatsApp tiene límites más estrictos
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const promises = batch.map(async (recipient) => {
          try {
            const template = this.messageTemplates.get(messageTask.template || 'system_notification');
            if (!template) {
              throw new Error(`Plantilla no encontrada: ${messageTask.template}`);
            }

            const messageContent = this.renderTemplate(template, { ...messageTask.data, recipient });
            
            await this.sendWhatsAppMessage({
              to: recipient,
              message: messageContent,
              priority: messageTask.priority
            });
            
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`❌ Error enviando mensaje a ${recipient}:`, error);
          }
        });

        await Promise.all(promises);
        
        // Pausa entre lotes para evitar rate limiting
        if (i + batchSize < recipients.length) {
          await this.sleep(2000);
        }
      }

      return {
        success: errorCount === 0,
        data: { successCount, errorCount, totalRecipients: recipients.length },
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

  private async sendCustomMessage(messageTask: WhatsAppTask): Promise<WhatsAppResult> {
    try {
      const result = await this.sendWhatsAppMessage({
        to: messageTask.to,
        message: messageTask.message,
        priority: messageTask.priority,
        mediaUrl: messageTask.mediaUrl,
        mediaType: messageTask.mediaType
      });

      return {
        success: true,
        messageId: result.messageId,
        deliveryStatus: 'sent',
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

  private async sendWhatsAppMessage(options: {
    to: string | string[];
    message: string;
    priority: string;
    mediaUrl?: string;
    mediaType?: string;
  }): Promise<{ messageId: string }> {
    if (!this.whatsappToken) {
      throw new Error('WhatsApp token no configurado');
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enviar mensaje a cada destinatario
    for (const recipient of recipients) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: options.mediaUrl ? 'document' : 'text',
          text: options.mediaUrl ? undefined : { body: options.message },
          document: options.mediaUrl ? {
            link: options.mediaUrl,
            caption: options.message
          } : undefined
        };

        const response = await axios.post(
          `${this.whatsappApiUrl}/messages`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status !== 200) {
          throw new Error(`Error enviando mensaje: ${response.statusText}`);
        }

        console.log(`📱 Mensaje enviado a ${recipient}: ${response.data.messages?.[0]?.id}`);
      } catch (error) {
        console.error(`❌ Error enviando mensaje a ${recipient}:`, error);
        throw error;
      }
    }

    return { messageId };
  }

  private renderTemplate(template: string, data: any): string {
    // Renderizar plantilla con datos
    let rendered = template;
    
    // Reemplazar variables en la plantilla
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key]);
    });
    
    return rendered;
  }

  private async logReminderSent(appointmentId: string, patientId: string): Promise<void> {
    try {
      await prisma.recordatorios.create({
        data: {
          cita_id: appointmentId,
          paciente_id: patientId,
          tipo: 'WHATSAPP',
          fecha_envio: new Date(),
          estado: 'ENVIADO'
        }
      });
    } catch (error) {
      console.error('❌ Error registrando recordatorio WhatsApp:', error);
    }
  }

  private async handleMessageError(messageTask: WhatsAppTask, error: Error): Promise<void> {
    messageTask.retryCount++;
    
    if (messageTask.retryCount >= messageTask.maxRetries) {
      // Marcar como fallido permanentemente
      await this.markMessageAsFailed(messageTask.id, error);
    } else {
      // Reintentar más tarde
      await this.scheduleRetry(messageTask);
    }
  }

  private async scheduleRetry(messageTask: WhatsAppTask): Promise<void> {
    try {
      // Calcular tiempo de espera exponencial
      const delay = Math.pow(2, messageTask.retryCount) * 60000; // minutos
      const retryTime = new Date(Date.now() + delay);
      
      messageTask.scheduledAt = retryTime;
      
      // Agregar de vuelta a la cola
      await this.addToMessageQueue(messageTask);
      
      console.log(`🔄 Mensaje WhatsApp ${messageTask.id} programado para reintento en ${delay/60000} minutos`);
    } catch (error) {
      console.error('❌ Error programando reintento:', error);
    }
  }

  private async saveMessageResult(messageId: string, result: WhatsAppResult): Promise<void> {
    try {
      await cache.set(`whatsapp_result_${messageId}`, JSON.stringify(result), 86400); // 24 horas
    } catch (error) {
      console.error('❌ Error guardando resultado de mensaje:', error);
    }
  }

  private async markMessageAsSent(messageId: string): Promise<void> {
    try {
      await cache.set(`whatsapp_status_${messageId}`, 'sent', 86400);
      await this.removeFromPendingMessages(messageId);
    } catch (error) {
      console.error('❌ Error marcando mensaje como enviado:', error);
    }
  }

  private async markMessageAsFailed(messageId: string, error: Error): Promise<void> {
    try {
      await cache.set(`whatsapp_status_${messageId}`, 'failed', 86400);
      await cache.set(`whatsapp_error_${messageId}`, error.message, 86400);
      await this.removeFromPendingMessages(messageId);
    } catch (cacheError) {
      console.error('❌ Error marcando mensaje como fallido:', cacheError);
    }
  }

  private async removeFromPendingMessages(messageId: string): Promise<void> {
    try {
      const pendingMessages = await this.getPendingMessages();
      const updatedMessages = pendingMessages.filter(message => message.id !== messageId);
      await cache.set('pending_whatsapp_messages', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('❌ Error removiendo mensaje de pendientes:', error);
    }
  }

  private async addToMessageQueue(messageTask: WhatsAppTask): Promise<void> {
    try {
      const pendingMessages = await this.getPendingMessages();
      pendingMessages.push(messageTask);
      await cache.set('pending_whatsapp_messages', JSON.stringify(pendingMessages));
    } catch (error) {
      console.error('❌ Error agregando mensaje a la cola:', error);
    }
  }

  // Plantillas de mensajes
  private getAppointmentReminderTemplate(): string {
    return `🏥 *Recordatorio de Cita Médica*

Hola {{nombre_paciente}},

Te recordamos que tienes una cita programada para el *{{fecha_cita}}* a las *{{hora_cita}}*.

👨‍⚕️ *Doctor:* {{nombre_doctor}}
🏥 *Servicio:* {{nombre_servicio}}
📍 *Consultorio:* {{consultorio}}

⏰ Por favor, llega 10 minutos antes de tu cita.

Si necesitas cancelar o reprogramar, contacta con nosotros.

Saludos,
Equipo Procura`;
  }

  private getPaymentConfirmationTemplate(): string {
    return `💳 *Confirmación de Pago*

Hola {{nombre_paciente}},

Hemos recibido tu pago de *${{monto}}* por el servicio *{{servicio}}*.

📅 *Fecha de pago:* {{fecha_pago}}
💳 *Método de pago:* {{metodo_pago}}
🔢 *Referencia:* {{referencia}}

Gracias por confiar en nosotros.

Saludos,
Equipo Procura`;
  }

  private getWelcomeMessageTemplate(): string {
    return `👋 *¡Bienvenido a Procura!*

Hola {{nombre_usuario}},

Gracias por registrarte en nuestro sistema.

✅ Tu cuenta ha sido creada exitosamente.

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Equipo Procura`;
  }

  private getReportReadyTemplate(): string {
    return `📊 *Tu Reporte Está Listo*

Hola {{nombre_usuario}},

El reporte que solicitaste está listo.

📋 *Tipo de reporte:* {{tipo_reporte}}
📅 *Período:* {{periodo}}

Puedes descargarlo desde tu panel de control.

Saludos,
Equipo Procura`;
  }

  private getSystemNotificationTemplate(): string {
    return `🔔 *Notificación del Sistema*

Hola {{nombre_usuario}},

{{mensaje}}

📅 *Fecha:* {{fecha}}
📋 *Tipo:* {{tipo_notificacion}}

Saludos,
Equipo Procura`;
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 Iniciando shutdown graceful del WhatsApp Queue Worker...');
    this.isRunning = false;
    
    // Esperar a que se completen los mensajes en curso
    await this.sleep(3000);
    
    // Cerrar conexiones
    await prisma.$disconnect();
    await cache.disconnect();
    
    console.log('✅ WhatsApp Queue Worker cerrado correctamente');
    process.exit(0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Iniciar el worker
const worker = new WhatsAppQueueWorker();

export default worker;



