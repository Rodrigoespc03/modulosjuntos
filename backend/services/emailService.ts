import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Configuración del servicio de email
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface AppointmentReminderData {
  pacienteNombre: string;
  pacienteEmail: string;
  pacienteTelefono?: string;
  doctorNombre: string;
  consultorioNombre: string;
  fecha: Date;
  citaId: string;
  pacienteId: string;
  usuarioId: string;
}

interface TreatmentReminderData {
  pacienteNombre: string;
  pacienteEmail: string;
  pacienteTelefono?: string;
  treatmentType: string;
  pacienteId: string;
  usuarioId: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Inicializa el transporter de email
   */
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      if (!SMTP_USER || !SMTP_PASS) {
        throw new Error('Configuración de email no encontrada. Verifica SMTP_USER y SMTP_PASS en .env');
      }

      this.transporter = nodemailer.createTransporter({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true para 465, false para otros puertos
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verificar la conexión
      try {
        await this.transporter.verify();
        console.log('✅ Servidor de email configurado correctamente');
      } catch (error) {
        console.error('❌ Error configurando servidor de email:', error);
        throw new Error('No se pudo conectar al servidor de email');
      }
    }

    return this.transporter;
  }

  /**
   * Envía recordatorio de cita por email
   */
  static async sendAppointmentReminder(data: AppointmentReminderData): Promise<EmailResponse> {
    try {
      const transporter = await this.getTransporter();
      const fecha = format(data.fecha, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });

      const subject = `Recordatorio de cita - ${data.consultorioNombre}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recordatorio de Cita</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .highlight { color: #4F46E5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Recordatorio de Cita</h1>
              <p>${data.consultorioNombre}</p>
            </div>
            
            <div class="content">
              <h2>Hola ${data.pacienteNombre},</h2>
              
              <p>Te recordamos que tienes una cita programada:</p>
              
              <div class="appointment-details">
                <h3>📋 Detalles de la Cita</h3>
                <p><strong>Fecha y Hora:</strong> <span class="highlight">${fecha}</span></p>
                <p><strong>Doctor:</strong> Dr. ${data.doctorNombre}</p>
                <p><strong>Consultorio:</strong> ${data.consultorioNombre}</p>
                <p><strong>ID de Cita:</strong> ${data.citaId}</p>
              </div>
              
              <p>Por favor, confirma tu asistencia respondiendo a este email o contactando al consultorio.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:${FROM_EMAIL}?subject=Confirmación de Cita ${data.citaId}&body=Hola, confirmo mi asistencia a la cita del ${fecha}" class="button">
                  ✅ Confirmar Asistencia
                </a>
                <a href="mailto:${FROM_EMAIL}?subject=Reagendar Cita ${data.citaId}&body=Hola, necesito reagendar mi cita del ${fecha}" class="button">
                  📅 Reagendar
                </a>
              </div>
              
              <p><strong>Importante:</strong> Si no puedes asistir, por favor avísanos con al menos 24 horas de anticipación.</p>
            </div>
            
            <div class="footer">
              <p>Este es un mensaje automático del sistema de citas de ${data.consultorioNombre}</p>
              <p>Si tienes alguna pregunta, no dudes en contactarnos</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Recordatorio de Cita - ${data.consultorioNombre}
        
        Hola ${data.pacienteNombre},
        
        Te recordamos que tienes una cita programada:
        
        Fecha y Hora: ${fecha}
        Doctor: Dr. ${data.doctorNombre}
        Consultorio: ${data.consultorioNombre}
        ID de Cita: ${data.citaId}
        
        Por favor, confirma tu asistencia respondiendo a este email o contactando al consultorio.
        
        Si no puedes asistir, por favor avísanos con al menos 24 horas de anticipación.
        
        Este es un mensaje automático del sistema de citas de ${data.consultorioNombre}
      `;

      const mailOptions = {
        from: `"${data.consultorioNombre}" <${FROM_EMAIL}>`,
        to: data.pacienteEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await transporter.sendMail(mailOptions);

      // Guardar en base de datos
      await prisma.emailMessage.create({
        data: {
          usuario_id: data.usuarioId,
          paciente_id: data.pacienteId,
          cita_id: data.citaId,
          message_type: 'APPOINTMENT_REMINDER',
          content: {
            subject: subject,
            body: textContent,
            appointmentId: data.citaId,
            patientName: data.pacienteNombre,
            doctorName: data.doctorNombre,
            appointmentDate: data.fecha.toISOString()
          },
          email_address: data.pacienteEmail,
          status: 'SENT',
          email_message_id: result.messageId,
          sent_at: new Date()
        }
      });

      console.log(`📧 Email de recordatorio enviado a ${data.pacienteEmail}: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error enviando email de recordatorio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía recordatorio de tratamiento por email
   */
  static async sendTreatmentReminder(data: TreatmentReminderData): Promise<EmailResponse> {
    try {
      const transporter = await this.getTransporter();

      const subject = `Recordatorio de Tratamiento - ${data.treatmentType}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recordatorio de Tratamiento</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .treatment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .highlight { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💊 Recordatorio de Tratamiento</h1>
            </div>
            
            <div class="content">
              <h2>Hola ${data.pacienteNombre},</h2>
              
              <p>Es momento de tu próxima sesión de <span class="highlight">${data.treatmentType}</span>.</p>
              
              <div class="treatment-details">
                <h3>📋 Detalles del Tratamiento</h3>
                <p><strong>Tipo de Tratamiento:</strong> <span class="highlight">${data.treatmentType}</span></p>
                <p><strong>Paciente:</strong> ${data.pacienteNombre}</p>
              </div>
              
              <p>Por favor, contacta al consultorio para agendar tu próxima cita.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:${FROM_EMAIL}?subject=Agendar ${data.treatmentType}&body=Hola, quiero agendar mi próxima sesión de ${data.treatmentType}" class="button">
                  📅 Agendar Cita
                </a>
              </div>
              
              <p><strong>Importante:</strong> Mantener la continuidad del tratamiento es fundamental para obtener los mejores resultados.</p>
            </div>
            
            <div class="footer">
              <p>Este es un mensaje automático del sistema de tratamientos</p>
              <p>Si tienes alguna pregunta, no dudes en contactarnos</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Recordatorio de Tratamiento - ${data.treatmentType}
        
        Hola ${data.pacienteNombre},
        
        Es momento de tu próxima sesión de ${data.treatmentType}.
        
        Tipo de Tratamiento: ${data.treatmentType}
        Paciente: ${data.pacienteNombre}
        
        Por favor, contacta al consultorio para agendar tu próxima cita.
        
        Importante: Mantener la continuidad del tratamiento es fundamental para obtener los mejores resultados.
        
        Este es un mensaje automático del sistema de tratamientos
      `;

      const mailOptions = {
        from: `"Sistema de Tratamientos" <${FROM_EMAIL}>`,
        to: data.pacienteEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await transporter.sendMail(mailOptions);

      // Guardar en base de datos
      await prisma.emailMessage.create({
        data: {
          usuario_id: data.usuarioId,
          paciente_id: data.pacienteId,
          message_type: 'TREATMENT_REMINDER',
          content: {
            subject: subject,
            body: textContent,
            treatmentType: data.treatmentType,
            patientName: data.pacienteNombre
          },
          email_address: data.pacienteEmail,
          status: 'SENT',
          email_message_id: result.messageId,
          sent_at: new Date()
        }
      });

      console.log(`📧 Email de tratamiento enviado a ${data.pacienteEmail}: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error enviando email de tratamiento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificación de cobro por email
   */
  static async sendPaymentNotification(data: {
    pacienteNombre: string;
    pacienteEmail: string;
    monto: number;
    concepto: string;
    fechaVencimiento?: Date;
    usuarioId: string;
    pacienteId: string;
    cobroId: string;
  }): Promise<EmailResponse> {
    try {
      const transporter = await this.getTransporter();

      const subject = `Notificación de Cobro - ${data.concepto}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Notificación de Cobro</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Notificación de Cobro</h1>
            </div>
            
            <div class="content">
              <h2>Hola ${data.pacienteNombre},</h2>
              
              <p>Te informamos sobre un cobro pendiente:</p>
              
              <div class="payment-details">
                <h3>📋 Detalles del Cobro</h3>
                <p><strong>Concepto:</strong> ${data.concepto}</p>
                <p><strong>Monto:</strong> <span class="amount">$${data.monto.toLocaleString()}</span></p>
                ${data.fechaVencimiento ? `<p><strong>Fecha de Vencimiento:</strong> ${format(data.fechaVencimiento, "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>` : ''}
              </div>
              
              <p>Por favor, contacta al consultorio para realizar el pago o si tienes alguna pregunta.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:${FROM_EMAIL}?subject=Consulta sobre Cobro&body=Hola, tengo una consulta sobre el cobro de ${data.concepto} por $${data.monto}" class="button">
                  💬 Consultar
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Este es un mensaje automático del sistema de cobros</p>
              <p>Si tienes alguna pregunta, no dudes en contactarnos</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Notificación de Cobro - ${data.concepto}
        
        Hola ${data.pacienteNombre},
        
        Te informamos sobre un cobro pendiente:
        
        Concepto: ${data.concepto}
        Monto: $${data.monto.toLocaleString()}
        ${data.fechaVencimiento ? `Fecha de Vencimiento: ${format(data.fechaVencimiento, "dd 'de' MMMM 'de' yyyy", { locale: es })}` : ''}
        
        Por favor, contacta al consultorio para realizar el pago o si tienes alguna pregunta.
        
        Este es un mensaje automático del sistema de cobros
      `;

      const mailOptions = {
        from: `"Sistema de Cobros" <${FROM_EMAIL}>`,
        to: data.pacienteEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await transporter.sendMail(mailOptions);

      // Guardar en base de datos
      await prisma.emailMessage.create({
        data: {
          usuario_id: data.usuarioId,
          paciente_id: data.pacienteId,
          cobro_id: data.cobroId,
          message_type: 'PAYMENT_NOTIFICATION',
          content: {
            subject: subject,
            body: textContent,
            concept: data.concepto,
            amount: data.monto,
            dueDate: data.fechaVencimiento?.toISOString()
          },
          email_address: data.pacienteEmail,
          status: 'SENT',
          email_message_id: result.messageId,
          sent_at: new Date()
        }
      });

      console.log(`📧 Email de cobro enviado a ${data.pacienteEmail}: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error enviando email de cobro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verifica la configuración del servicio de email
   */
  static async verifyConfiguration(): Promise<boolean> {
    try {
      await this.getTransporter();
      return true;
    } catch (error) {
      console.error('❌ Error verificando configuración de email:', error);
      return false;
    }
  }
}
