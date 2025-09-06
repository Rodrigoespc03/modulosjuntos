import { WhatsAppService } from './whatsappService';
import { EmailService } from './emailService';

interface NotificationResponse {
  success: boolean;
  method: 'whatsapp' | 'email' | 'both';
  whatsappMessageId?: string;
  emailMessageId?: string;
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

export class NotificationService {
  /**
   * Envía recordatorio de cita usando WhatsApp y/o Email
   * Prioriza WhatsApp, pero usa Email como fallback
   */
  static async sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResponse> {
    const results: NotificationResponse = {
      success: false,
      method: 'email' // Por defecto usamos email
    };

    // Intentar WhatsApp primero (si está configurado)
    if (data.pacienteTelefono) {
      try {
        console.log('📱 Intentando enviar recordatorio por WhatsApp...');
        const whatsappResult = await WhatsAppService.sendAppointmentReminder({
          ...data,
          pacienteTelefono: data.pacienteTelefono
        });

        if (whatsappResult.success) {
          results.success = true;
          results.method = 'whatsapp';
          results.whatsappMessageId = whatsappResult.messageId;
          console.log('✅ Recordatorio enviado por WhatsApp');
          
          // También intentar email como respaldo
          try {
            const emailResult = await EmailService.sendAppointmentReminder(data);
            if (emailResult.success) {
              results.method = 'both';
              results.emailMessageId = emailResult.messageId;
              console.log('✅ Recordatorio también enviado por Email como respaldo');
            }
          } catch (emailError) {
            console.log('⚠️ Email fallback falló, pero WhatsApp funcionó');
          }
          
          return results;
        }
      } catch (whatsappError) {
        console.log('❌ WhatsApp falló:', whatsappError);
      }
    }

    // Si WhatsApp falla o no hay teléfono, usar Email
    try {
      console.log('📧 Enviando recordatorio por Email...');
      const emailResult = await EmailService.sendAppointmentReminder(data);
      
      if (emailResult.success) {
        results.success = true;
        results.method = 'email';
        results.emailMessageId = emailResult.messageId;
        console.log('✅ Recordatorio enviado por Email');
      } else {
        results.error = emailResult.error;
        console.log('❌ Email falló:', emailResult.error);
      }
    } catch (emailError) {
      results.error = emailError instanceof Error ? emailError.message : 'Error desconocido';
      console.log('❌ Error enviando email:', results.error);
    }

    return results;
  }

  /**
   * Envía recordatorio de tratamiento usando WhatsApp y/o Email
   */
  static async sendTreatmentReminder(data: TreatmentReminderData): Promise<NotificationResponse> {
    const results: NotificationResponse = {
      success: false,
      method: 'email'
    };

    // Intentar WhatsApp primero
    if (data.pacienteTelefono) {
      try {
        console.log('📱 Intentando enviar recordatorio de tratamiento por WhatsApp...');
        const whatsappResult = await WhatsAppService.sendWeeklyTreatmentReminder(
          data.pacienteId,
          data.treatmentType,
          data.usuarioId
        );

        if (whatsappResult.success) {
          results.success = true;
          results.method = 'whatsapp';
          results.whatsappMessageId = whatsappResult.messageId;
          console.log('✅ Recordatorio de tratamiento enviado por WhatsApp');
          
          // También intentar email
          try {
            const emailResult = await EmailService.sendTreatmentReminder(data);
            if (emailResult.success) {
              results.method = 'both';
              results.emailMessageId = emailResult.messageId;
              console.log('✅ Recordatorio también enviado por Email');
            }
          } catch (emailError) {
            console.log('⚠️ Email fallback falló, pero WhatsApp funcionó');
          }
          
          return results;
        }
      } catch (whatsappError) {
        console.log('❌ WhatsApp falló:', whatsappError);
      }
    }

    // Usar Email como fallback
    try {
      console.log('📧 Enviando recordatorio de tratamiento por Email...');
      const emailResult = await EmailService.sendTreatmentReminder(data);
      
      if (emailResult.success) {
        results.success = true;
        results.method = 'email';
        results.emailMessageId = emailResult.messageId;
        console.log('✅ Recordatorio de tratamiento enviado por Email');
      } else {
        results.error = emailResult.error;
        console.log('❌ Email falló:', emailResult.error);
      }
    } catch (emailError) {
      results.error = emailError instanceof Error ? emailError.message : 'Error desconocido';
      console.log('❌ Error enviando email:', results.error);
    }

    return results;
  }

  /**
   * Envía notificación de cobro por Email (no hay WhatsApp para cobros)
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
  }): Promise<NotificationResponse> {
    try {
      console.log('📧 Enviando notificación de cobro por Email...');
      const emailResult = await EmailService.sendPaymentNotification(data);
      
      if (emailResult.success) {
        console.log('✅ Notificación de cobro enviada por Email');
        return {
          success: true,
          method: 'email',
          emailMessageId: emailResult.messageId
        };
      } else {
        console.log('❌ Email de cobro falló:', emailResult.error);
        return {
          success: false,
          method: 'email',
          error: emailResult.error
        };
      }
    } catch (emailError) {
      const error = emailError instanceof Error ? emailError.message : 'Error desconocido';
      console.log('❌ Error enviando email de cobro:', error);
      return {
        success: false,
        method: 'email',
        error
      };
    }
  }

  /**
   * Verifica qué métodos de notificación están disponibles
   */
  static async checkAvailableMethods(): Promise<{
    whatsapp: boolean;
    email: boolean;
  }> {
    const results = {
      whatsapp: false,
      email: false
    };

    // Verificar WhatsApp
    try {
      // Simular verificación de WhatsApp
      results.whatsapp = process.env.WHATSAPP_ACCESS_TOKEN ? true : false;
    } catch (error) {
      console.log('⚠️ WhatsApp no disponible');
    }

    // Verificar Email
    try {
      results.email = await EmailService.verifyConfiguration();
    } catch (error) {
      console.log('⚠️ Email no disponible');
    }

    console.log('📊 Métodos de notificación disponibles:', results);
    return results;
  }
}
