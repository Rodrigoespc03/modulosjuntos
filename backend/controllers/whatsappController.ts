import { Request, Response } from 'express'
import { WhatsAppService } from '../services/whatsappService'
import asyncHandler from '../utils/asyncHandler'
import { 
  whatsappWebhookSchema,
  sendTreatmentReminderSchema,
  citaIdSchema,
  pacienteTreatmentSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

export class WhatsAppController {
  
  /**
   * Webhook para recibir mensajes de WhatsApp
   */
  static handleWebhook = [
    validateBody(whatsappWebhookSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { Body, From, To } = getValidatedBody(req);
      
      console.log('Webhook recibido:', { Body, From, To });
      
      // Extraer número de teléfono (remover prefijo whatsapp:)
      const phoneNumber = From?.replace('whatsapp:', '');
      
      // Buscar cita pendiente para este número
      const pendingAppointment = await findPendingAppointment(phoneNumber);
      
      if (pendingAppointment) {
        // Procesar respuesta del paciente
        const result = await WhatsAppService.processPatientResponse(
          phoneNumber,
          Body,
          pendingAppointment.id
        );
        
        if (result.success) {
          return res.status(200).json({ 
            success: true, 
            message: 'Respuesta procesada correctamente' 
          });
        } else {
          return res.status(400).json({ 
            success: false, 
            error: result.error 
          });
        }
      } else {
        // Mensaje no relacionado con confirmación de cita
        await handleGeneralMessage(phoneNumber, Body);
        return res.status(200).json({ 
          success: true, 
          message: 'Mensaje recibido' 
        });
      }
    })
  ];
  
  /**
   * Enviar recordatorio de cita
   */
  static sendReminder = [
    validateParams(citaIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { citaId } = getValidatedParams(req);
      
      const cita = await getCitaWithDetails(citaId);
      
      if (!cita) {
        throw createNotFoundError('Cita no encontrada');
      }
      
      if (!cita.pacientes.telefono) {
        throw createNotFoundError('Paciente sin teléfono');
      }
      
      const reminderData = {
        citaId: cita.id,
        pacienteId: cita.paciente_id,
        usuarioId: cita.usuario_id,
        fecha: cita.fecha_inicio,
        hora: formatTime(cita.fecha_inicio),
        doctorNombre: `${cita.usuarios.nombre} ${cita.usuarios.apellido}`,
        consultorioNombre: cita.consultorios.nombre,
        pacienteTelefono: cita.pacientes.telefono,
        pacienteNombre: `${cita.pacientes.nombre} ${cita.pacientes.apellido}`
      };
      
      const result = await WhatsAppService.sendAppointmentReminder(reminderData);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          messageId: result.messageId,
          message: 'Recordatorio enviado correctamente'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    })
  ];
  
  /**
   * Enviar recordatorio de tratamiento semanal
   */
  static sendTreatmentReminder = [
    validateParams(pacienteTreatmentSchema),
    validateBody(sendTreatmentReminderSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { pacienteId, treatmentType } = getValidatedParams(req);
      const { usuarioId } = getValidatedBody(req);
      
      const result = await WhatsAppService.sendWeeklyTreatmentReminder(
        pacienteId,
        treatmentType,
        usuarioId
      );
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          messageId: result.messageId,
          message: 'Recordatorio de tratamiento enviado'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    })
  ];
}

// Funciones auxiliares
async function findPendingAppointment(phoneNumber: string) {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    // Buscar cita pendiente para este número de teléfono
    const cita = await prisma.citas.findFirst({
      where: {
        pacientes: {
          telefono: phoneNumber
        },
        estado: 'PROGRAMADA',
        fecha_inicio: {
          gte: new Date()
        }
      },
      orderBy: {
        fecha_inicio: 'asc'
      }
    })
    
    return cita
  } finally {
    await prisma.$disconnect()
  }
}

async function getCitaWithDetails(citaId: string) {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    return await prisma.citas.findUnique({
      where: { id: citaId },
      include: {
        pacientes: true,
        usuarios: true,
        consultorios: true
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGeneralMessage(phoneNumber: string, message: string) {
  // Manejar mensajes generales no relacionados con citas
  console.log('Mensaje general de:', phoneNumber, ':', message)
  
  // Aquí podrías implementar lógica para:
  // - Agendar nuevas citas
  // - Consultar horarios
  // - Información del consultorio
  // etc.
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
} 