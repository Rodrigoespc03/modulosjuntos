// 📧 EMAIL QUEUE WORKER - SISTEMA PROCURA
// Worker para procesamiento de cola de emails

import { PrismaClient } from '@prisma/client';
import { RedisCache } from '../performance/redisCache';
import { performance } from 'perf_hooks';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const cache = new RedisCache();

interface EmailTask {
  id: string;
  type: 'notification' | 'reminder' | 'bulk' | 'report';
  to: string | string[];
  subject: string;
  template: string;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  retryCount: number;
  maxRetries: number;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  processingTime: number;
  timestamp: Date;
}

class EmailQueueWorker {
  private isRunning = false;
  private transporter: nodemailer.Transporter;
  private emailTemplates: Map<string, string>;

  constructor() {
    this.initializeWorker();
    this.setupEmailTransporter();
    this.loadEmailTemplates();
  }

  private async initializeWorker(): Promise<void> {
    console.log('📧 Email Queue Worker iniciado');
    
    // Configurar listeners para graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    // Iniciar procesamiento de emails
    this.startEmailProcessing();
  }

  private setupEmailTransporter(): void {
    // Configurar transporter de email (SMTP, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14 // 14 emails por segundo
    });
  }

  private loadEmailTemplates(): void {
    this.emailTemplates = new Map();
    
    // Cargar plantillas de email
    this.emailTemplates.set('appointment_reminder', this.getAppointmentReminderTemplate());
    this.emailTemplates.set('payment_confirmation', this.getPaymentConfirmationTemplate());
    this.emailTemplates.set('password_reset', this.getPasswordResetTemplate());
    this.emailTemplates.set('welcome_email', this.getWelcomeEmailTemplate());
    this.emailTemplates.set('report_ready', this.getReportReadyTemplate());
    this.emailTemplates.set('system_notification', this.getSystemNotificationTemplate());
  }

  private async startEmailProcessing(): Promise<void> {
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        // Procesar emails pendientes
        await this.processPendingEmails();
        
        // Esperar antes de la siguiente iteración
        await this.sleep(2000); // 2 segundos para emails
      } catch (error) {
        console.error('❌ Error en procesamiento de emails:', error);
        await this.sleep(5000);
      }
    }
  }

  private async processPendingEmails(): Promise<void> {
    // Obtener emails pendientes de Redis
    const pendingEmails = await this.getPendingEmails();
    
    for (const email of pendingEmails) {
      try {
        await this.processEmail(email);
      } catch (error) {
        console.error(`❌ Error procesando email ${email.id}:`, error);
        await this.handleEmailError(email, error as Error);
      }
    }
  }

  private async getPendingEmails(): Promise<EmailTask[]> {
    try {
      const emails = await cache.get('pending_emails');
      return emails ? JSON.parse(emails) : [];
    } catch (error) {
      console.error('❌ Error obteniendo emails pendientes:', error);
      return [];
    }
  }

  private async processEmail(emailTask: EmailTask): Promise<void> {
    const startTime = performance.now();
    
    console.log(`📧 Procesando email: ${emailTask.id} (${emailTask.type})`);
    
    // Verificar si el email está programado para el futuro
    if (emailTask.scheduledAt && new Date() < emailTask.scheduledAt) {
      return; // Saltar emails programados para el futuro
    }

    let result: EmailResult;

    switch (emailTask.type) {
      case 'notification':
        result = await this.sendNotificationEmail(emailTask);
        break;
      case 'reminder':
        result = await this.sendReminderEmail(emailTask);
        break;
      case 'bulk':
        result = await this.sendBulkEmail(emailTask);
        break;
      case 'report':
        result = await this.sendReportEmail(emailTask);
        break;
      default:
        throw new Error(`Tipo de email no soportado: ${emailTask.type}`);
    }

    result.processingTime = performance.now() - startTime;
    result.timestamp = new Date();

    // Guardar resultado
    await this.saveEmailResult(emailTask.id, result);
    
    // Marcar email como enviado
    await this.markEmailAsSent(emailTask.id);
    
    console.log(`✅ Email ${emailTask.id} enviado en ${result.processingTime.toFixed(2)}ms`);
  }

  private async sendNotificationEmail(emailTask: EmailTask): Promise<EmailResult> {
    try {
      const template = this.emailTemplates.get(emailTask.template);
      if (!template) {
        throw new Error(`Plantilla no encontrada: ${emailTask.template}`);
      }

      const htmlContent = this.renderTemplate(template, emailTask.data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@procura.com',
        to: emailTask.to,
        subject: emailTask.subject,
        html: htmlContent,
        priority: emailTask.priority
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
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

  private async sendReminderEmail(emailTask: EmailTask): Promise<EmailResult> {
    try {
      // Lógica específica para emails de recordatorio
      const template = this.emailTemplates.get('appointment_reminder');
      if (!template) {
        throw new Error('Plantilla de recordatorio no encontrada');
      }

      const htmlContent = this.renderTemplate(template, emailTask.data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'reminders@procura.com',
        to: emailTask.to,
        subject: emailTask.subject,
        html: htmlContent,
        priority: 'high'
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Registrar el recordatorio enviado
      await this.logReminderSent(emailTask.data.appointmentId, emailTask.data.patientId);

      return {
        success: true,
        messageId: info.messageId,
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

  private async sendBulkEmail(emailTask: EmailTask): Promise<EmailResult> {
    try {
      const recipients = Array.isArray(emailTask.to) ? emailTask.to : [emailTask.to];
      let successCount = 0;
      let errorCount = 0;

      // Enviar emails en lotes para evitar sobrecarga
      const batchSize = 50;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const promises = batch.map(async (recipient) => {
          try {
            const template = this.emailTemplates.get(emailTask.template);
            if (!template) {
              throw new Error(`Plantilla no encontrada: ${emailTask.template}`);
            }

            const htmlContent = this.renderTemplate(template, { ...emailTask.data, recipient });
            
            const mailOptions = {
              from: process.env.EMAIL_FROM || 'noreply@procura.com',
              to: recipient,
              subject: emailTask.subject,
              html: htmlContent,
              priority: emailTask.priority
            };

            await this.transporter.sendMail(mailOptions);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`❌ Error enviando email a ${recipient}:`, error);
          }
        });

        await Promise.all(promises);
        
        // Pausa entre lotes para evitar rate limiting
        if (i + batchSize < recipients.length) {
          await this.sleep(1000);
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

  private async sendReportEmail(emailTask: EmailTask): Promise<EmailResult> {
    try {
      const template = this.emailTemplates.get('report_ready');
      if (!template) {
        throw new Error('Plantilla de reporte no encontrada');
      }

      const htmlContent = this.renderTemplate(template, emailTask.data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'reports@procura.com',
        to: emailTask.to,
        subject: emailTask.subject,
        html: htmlContent,
        priority: 'normal',
        attachments: emailTask.data.attachments || []
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
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
          tipo: 'EMAIL',
          fecha_envio: new Date(),
          estado: 'ENVIADO'
        }
      });
    } catch (error) {
      console.error('❌ Error registrando recordatorio:', error);
    }
  }

  private async handleEmailError(emailTask: EmailTask, error: Error): Promise<void> {
    emailTask.retryCount++;
    
    if (emailTask.retryCount >= emailTask.maxRetries) {
      // Marcar como fallido permanentemente
      await this.markEmailAsFailed(emailTask.id, error);
    } else {
      // Reintentar más tarde
      await this.scheduleRetry(emailTask);
    }
  }

  private async scheduleRetry(emailTask: EmailTask): Promise<void> {
    try {
      // Calcular tiempo de espera exponencial
      const delay = Math.pow(2, emailTask.retryCount) * 60000; // minutos
      const retryTime = new Date(Date.now() + delay);
      
      emailTask.scheduledAt = retryTime;
      
      // Agregar de vuelta a la cola
      await this.addToEmailQueue(emailTask);
      
      console.log(`🔄 Email ${emailTask.id} programado para reintento en ${delay/60000} minutos`);
    } catch (error) {
      console.error('❌ Error programando reintento:', error);
    }
  }

  private async saveEmailResult(emailId: string, result: EmailResult): Promise<void> {
    try {
      await cache.set(`email_result_${emailId}`, JSON.stringify(result), 86400); // 24 horas
    } catch (error) {
      console.error('❌ Error guardando resultado de email:', error);
    }
  }

  private async markEmailAsSent(emailId: string): Promise<void> {
    try {
      await cache.set(`email_status_${emailId}`, 'sent', 86400);
      await this.removeFromPendingEmails(emailId);
    } catch (error) {
      console.error('❌ Error marcando email como enviado:', error);
    }
  }

  private async markEmailAsFailed(emailId: string, error: Error): Promise<void> {
    try {
      await cache.set(`email_status_${emailId}`, 'failed', 86400);
      await cache.set(`email_error_${emailId}`, error.message, 86400);
      await this.removeFromPendingEmails(emailId);
    } catch (cacheError) {
      console.error('❌ Error marcando email como fallido:', cacheError);
    }
  }

  private async removeFromPendingEmails(emailId: string): Promise<void> {
    try {
      const pendingEmails = await this.getPendingEmails();
      const updatedEmails = pendingEmails.filter(email => email.id !== emailId);
      await cache.set('pending_emails', JSON.stringify(updatedEmails));
    } catch (error) {
      console.error('❌ Error removiendo email de pendientes:', error);
    }
  }

  private async addToEmailQueue(emailTask: EmailTask): Promise<void> {
    try {
      const pendingEmails = await this.getPendingEmails();
      pendingEmails.push(emailTask);
      await cache.set('pending_emails', JSON.stringify(pendingEmails));
    } catch (error) {
      console.error('❌ Error agregando email a la cola:', error);
    }
  }

  // Plantillas de email
  private getAppointmentReminderTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recordatorio de Cita</title>
      </head>
      <body>
        <h2>Recordatorio de Cita Médica</h2>
        <p>Hola {{nombre_paciente}},</p>
        <p>Te recordamos que tienes una cita programada para el {{fecha_cita}} a las {{hora_cita}}.</p>
        <p><strong>Doctor:</strong> {{nombre_doctor}}</p>
        <p><strong>Servicio:</strong> {{nombre_servicio}}</p>
        <p><strong>Consultorio:</strong> {{consultorio}}</p>
        <p>Por favor, llega 10 minutos antes de tu cita.</p>
        <p>Si necesitas cancelar o reprogramar, contacta con nosotros.</p>
        <p>Saludos,<br>Equipo Procura</p>
      </body>
      </html>
    `;
  }

  private getPaymentConfirmationTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Pago</title>
      </head>
      <body>
        <h2>Confirmación de Pago</h2>
        <p>Hola {{nombre_paciente}},</p>
        <p>Hemos recibido tu pago de ${{monto}} por el servicio {{servicio}}.</p>
        <p><strong>Fecha de pago:</strong> {{fecha_pago}}</p>
        <p><strong>Método de pago:</strong> {{metodo_pago}}</p>
        <p><strong>Referencia:</strong> {{referencia}}</p>
        <p>Gracias por confiar en nosotros.</p>
        <p>Saludos,<br>Equipo Procura</p>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Restablecer Contraseña</title>
      </head>
      <body>
        <h2>Restablecer Contraseña</h2>
        <p>Hola {{nombre_usuario}},</p>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="{{reset_link}}">Restablecer Contraseña</a></p>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste este cambio, ignora este email.</p>
        <p>Saludos,<br>Equipo Procura</p>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a Procura</title>
      </head>
      <body>
        <h2>¡Bienvenido a Procura!</h2>
        <p>Hola {{nombre_usuario}},</p>
        <p>Gracias por registrarte en nuestro sistema.</p>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Puedes acceder a tu cuenta en: <a href="{{login_url}}">Iniciar Sesión</a></p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>Saludos,<br>Equipo Procura</p>
      </body>
      </html>
    `;
  }

  private getReportReadyTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte Listo</title>
      </head>
      <body>
        <h2>Tu Reporte Está Listo</h2>
        <p>Hola {{nombre_usuario}},</p>
        <p>El reporte que solicitaste está listo.</p>
        <p><strong>Tipo de reporte:</strong> {{tipo_reporte}}</p>
        <p><strong>Período:</strong> {{periodo}}</p>
        <p>Puedes descargarlo desde tu panel de control.</p>
        <p>Saludos,<br>Equipo Procura</p>
      </body>
      </html>
    `;
  }

  private getSystemNotificationTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Notificación del Sistema</title>
      </head>
      <body>
        <h2>Notificación del Sistema</h2>
        <p>Hola {{nombre_usuario}},</p>
        <p>{{mensaje}}</p>
        <p><strong>Fecha:</strong> {{fecha}}</p>
        <p><strong>Tipo:</strong> {{tipo_notificacion}}</p>
        <p>Saludos,<br>Equipo Procura</p>
      </body>
      </html>
    `;
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 Iniciando shutdown graceful del Email Queue Worker...');
    this.isRunning = false;
    
    // Esperar a que se completen los emails en curso
    await this.sleep(3000);
    
    // Cerrar conexiones
    await prisma.$disconnect();
    await cache.disconnect();
    this.transporter.close();
    
    console.log('✅ Email Queue Worker cerrado correctamente');
    process.exit(0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Iniciar el worker
const worker = new EmailQueueWorker();

export default worker;
