import { Request, Response } from 'express';
import prisma from '../prisma';
import crypto from 'crypto';
import googleCalendarService from '../services/googleCalendarService';
import asyncHandler from '../utils/asyncHandler';
import { 
  createCitaSchema, 
  updateCitaSchema, 
  citaIdSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

export const getAllCitas = asyncHandler(async (req: Request, res: Response) => {
  const citas = await prisma.citas.findMany({
    include: {
      paciente: true,
      usuario: true,
      consultorio: true,
    },
    orderBy: { fecha_inicio: 'asc' },
  });
  res.json(citas);
});

export const createCita = [
  validateBody(createCitaSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = getValidatedBody(req);
    const { fecha_inicio, fecha_fin, descripcion, estado, color, es_recurrente, regla_recurrencia, id_serie, paciente_id, usuario_id, consultorio_id } = validatedData;
    
    let inicio = fecha_inicio ? new Date(fecha_inicio) : undefined;
    let fin = fecha_fin ? new Date(fecha_fin) : undefined;
    
    // Validar disponibilidad y bloqueos solo si hay fecha_inicio, fecha_fin y usuario_id
    if (inicio && fin && usuario_id) {
      const diaSemana = inicio.getDay();
      const disponibilidad = await prisma.disponibilidad_medico.findMany({
        where: {
          usuario_id: String(usuario_id),
          dia_semana: diaSemana
        }
      });
      
      console.log('usuario_id recibido:', usuario_id);
      console.log('Disponibilidades encontradas:', disponibilidad);
      console.log('Validando disponibilidad:');
      console.log('Cita inicio:', inicio, 'fin:', fin);
      
      disponibilidad.forEach((d: { hora_inicio: string; hora_fin: string }) => {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number);
        const [hFin, mFin] = d.hora_fin.split(':').map(Number);
        const slotIni = new Date(inicio);
        slotIni.setHours(hIni, mIni, 0, 0);
        const slotFin = new Date(inicio);
        slotFin.setHours(hFin, mFin, 0, 0);
        const dentro = inicio >= slotIni && fin <= slotFin;
        console.log(`Bloque: ${d.hora_inicio}-${d.hora_fin} | slotIni:`, slotIni, '| slotFin:', slotFin, '| dentro:', dentro);
      });
      
      const estaEnDisponibilidad = disponibilidad.some((d: { hora_inicio: string; hora_fin: string }) => {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number);
        const [hFin, mFin] = d.hora_fin.split(':').map(Number);
        const slotIni = new Date(inicio);
        slotIni.setHours(hIni, mIni, 0, 0);
        const slotFin = new Date(inicio);
        slotFin.setHours(hFin, mFin, 0, 0);
        return inicio >= slotIni && fin <= slotFin;
      });
      
      if (!estaEnDisponibilidad) {
        throw createConflictError('La cita está fuera del horario de disponibilidad del médico para ese día.');
      }
      
      // Validar bloqueos
      const bloqueo = await prisma.bloqueo_medico.findFirst({
        where: {
          usuario_id: String(usuario_id),
          OR: [
            {
              fecha_inicio: { lte: fin },
              fecha_fin: { gte: inicio }
            }
          ]
        }
      });
      
      if (bloqueo) {
        throw createConflictError('La cita se cruza con un bloqueo del médico.');
      }
    }
    
    const estadoValido = estado || 'PROGRAMADA';
    const citaData: any = {
      id: crypto.randomUUID(),
      paciente_id: String(paciente_id),
      usuario_id: String(usuario_id),
      consultorio_id: String(consultorio_id),
      fecha_inicio: inicio,
      fecha_fin: fin,
      descripcion: descripcion || null,
      estado: estadoValido as any,
      color: color || "#3B82F6",
      updated_at: new Date(),
    };
    
    if (typeof es_recurrente !== 'undefined') citaData.es_recurrente = es_recurrente;
    if (typeof regla_recurrencia !== 'undefined') citaData.regla_recurrencia = regla_recurrencia;
    if (typeof id_serie !== 'undefined') citaData.id_serie = id_serie;
    
    // Crear la cita localmente PRIMERO
    const cita = await prisma.citas.create({
      data: citaData,
    });

    // SOLO DESPUÉS de crear la cita exitosamente, intentar sincronizar con Google Calendar
    try {
      // Verificar si el usuario tiene Google Calendar configurado
      const isConnected = await googleCalendarService.isUserConnected(String(usuario_id));
      
      if (isConnected) {
        // Obtener datos del paciente y usuario para el evento de Google
        const paciente = await prisma.paciente.findUnique({
          where: { id: String(paciente_id) }
        });
        
        const usuario = await prisma.usuario.findUnique({
          where: { id: String(usuario_id) }
        });

        if (paciente && usuario) {
          // Convertir cita a formato de Google Calendar
          const googleEvent = googleCalendarService.convertCitaToGoogleEvent(cita, paciente, usuario);
          
          // Crear evento en Google Calendar
          const googleEventId = await googleCalendarService.createEvent(String(usuario_id), googleEvent);
          
          if (googleEventId) {
            console.log(`Cita sincronizada con Google Calendar: ${googleEventId}`);
            // Opcional: Guardar el ID del evento de Google en la cita local
            // await prisma.citas.update({
            //   where: { id: cita.id },
            //   data: { googleEventId: googleEventId }
            // })
          } else {
            console.log('No se pudo sincronizar la cita con Google Calendar, pero la cita local se creó correctamente');
          }
        }
      } else {
        console.log('Usuario no tiene Google Calendar configurado, cita creada solo localmente');
      }
    } catch (syncError) {
      // Si hay error en la sincronización, NO afectar la respuesta de la cita local
      console.error('Error sincronizando con Google Calendar:', syncError);
      console.log('La cita se creó localmente pero no se pudo sincronizar con Google Calendar');
    }

    res.json(cita);
  })
];

export const deleteCita = [
  validateParams(citaIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    
    // Obtener información de la cita antes de eliminarla
    const cita = await prisma.citas.findUnique({
      where: { id },
      include: {
        usuario: true,
        paciente: true
      }
    });

    if (!cita) {
      throw createNotFoundError('Cita no encontrada');
    }

    // Eliminar la cita localmente PRIMERO
    await prisma.citas.delete({ where: { id } });

    // SOLO DESPUÉS de eliminar exitosamente, intentar sincronizar con Google Calendar
    try {
      const isConnected = await googleCalendarService.isUserConnected(cita.usuario_id);
      
      if (isConnected && cita.googleEventId) {
        // Eliminar evento de Google Calendar
        const success = await googleCalendarService.deleteEvent(cita.usuario_id, cita.googleEventId);
        
        if (success) {
          console.log(`Evento eliminado de Google Calendar: ${cita.googleEventId}`);
        } else {
          console.log('No se pudo eliminar el evento de Google Calendar, pero la cita local se eliminó correctamente');
        }
      }
    } catch (syncError) {
      console.error('Error eliminando de Google Calendar:', syncError);
      console.log('La cita se eliminó localmente pero no se pudo eliminar de Google Calendar');
    }

    res.json({ message: 'Cita eliminada' });
  })
];

export const updateCita = [
  validateParams(citaIdSchema),
  validateBody(updateCitaSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const { fecha_inicio, fecha_fin, descripcion, estado, color, es_recurrente, regla_recurrencia, id_serie, usuario_id } = validatedData;
    
    const updateData: any = {};
    let inicio = fecha_inicio ? new Date(fecha_inicio) : undefined;
    let fin = fecha_fin ? new Date(fecha_fin) : undefined;
    
    // Validar disponibilidad y bloqueos solo si hay fecha_inicio, fecha_fin y usuario_id
    if (inicio && fin && usuario_id) {
      const diaSemana = inicio.getDay();
      const disponibilidad = await prisma.disponibilidad_medico.findMany({
        where: {
          usuario_id: String(usuario_id),
          dia_semana: diaSemana
        }
      });
      
      console.log('usuario_id recibido (update):', usuario_id);
      console.log('Disponibilidades encontradas (update):', disponibilidad);
      console.log('Validando disponibilidad (update):');
      console.log('Cita inicio:', inicio, 'fin:', fin);
      
      disponibilidad.forEach((d: { hora_inicio: string; hora_fin: string }) => {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number);
        const [hFin, mFin] = d.hora_fin.split(':').map(Number);
        const slotIni = new Date(inicio);
        slotIni.setHours(hIni, mIni, 0, 0);
        const slotFin = new Date(inicio);
        slotFin.setHours(hFin, mFin, 0, 0);
        const dentro = inicio >= slotIni && fin <= slotFin;
        console.log(`Bloque: ${d.hora_inicio}-${d.hora_fin} | slotIni:`, slotIni, '| slotFin:', slotFin, '| dentro:', dentro);
      });
      
      const estaEnDisponibilidad = disponibilidad.some((d: { hora_inicio: string; hora_fin: string }) => {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number);
        const [hFin, mFin] = d.hora_fin.split(':').map(Number);
        const slotIni = new Date(inicio);
        slotIni.setHours(hIni, mIni, 0, 0);
        const slotFin = new Date(inicio);
        slotFin.setHours(hFin, mFin, 0, 0);
        return inicio >= slotIni && fin <= slotFin;
      });
      
      if (!estaEnDisponibilidad) {
        throw createConflictError('La cita está fuera del horario de disponibilidad del médico para ese día.');
      }
      
      // Validar bloqueos (excluyendo la cita actual)
      const bloqueo = await prisma.bloqueo_medico.findFirst({
        where: {
          usuario_id: String(usuario_id),
          OR: [
            {
              fecha_inicio: { lte: fin },
              fecha_fin: { gte: inicio }
            }
          ]
        }
      });
      
      if (bloqueo) {
        throw createConflictError('La cita se cruza con un bloqueo del médico.');
      }
    }
    
    if (fecha_inicio) updateData.fecha_inicio = inicio;
    if (fecha_fin) updateData.fecha_fin = fin;
    if (descripcion) updateData.descripcion = descripcion;
    if (estado) updateData.estado = estado;
    if (color) updateData.color = color;
    if (typeof es_recurrente !== 'undefined') updateData.es_recurrente = es_recurrente;
    if (typeof regla_recurrencia !== 'undefined') updateData.regla_recurrencia = regla_recurrencia;
    if (typeof id_serie !== 'undefined') updateData.id_serie = id_serie;
    
    // Actualizar la cita localmente PRIMERO
    const cita = await prisma.citas.update({
      where: { id },
      data: updateData,
      include: {
        usuario: true,
        paciente: true
      }
    });

    // SOLO DESPUÉS de actualizar exitosamente, intentar sincronizar con Google Calendar
    try {
      const isConnected = await googleCalendarService.isUserConnected(cita.usuario_id);
      
      if (isConnected && cita.googleEventId) {
        // Convertir cita actualizada a formato de Google Calendar
        const googleEvent = googleCalendarService.convertCitaToGoogleEvent(cita, cita.paciente, cita.usuario);
        
        // Actualizar evento en Google Calendar
        const success = await googleCalendarService.updateEvent(cita.usuario_id, cita.googleEventId, googleEvent);
        
        if (success) {
          console.log(`Evento actualizado en Google Calendar: ${cita.googleEventId}`);
        } else {
          console.log('No se pudo actualizar el evento en Google Calendar, pero la cita local se actualizó correctamente');
        }
      }
    } catch (syncError) {
      console.error('Error actualizando en Google Calendar:', syncError);
      console.log('La cita se actualizó localmente pero no se pudo actualizar en Google Calendar');
    }

    res.json(cita);
  })
]; 