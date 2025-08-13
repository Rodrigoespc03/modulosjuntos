import { Request, Response } from 'express';
import { HistorialService } from '../services/historialService';
import asyncHandler from '../utils/asyncHandler';
import { z } from 'zod';
import { 
  cobroIdSchema,
  usuarioIdSchema,
  paginationSchema,
  dateRangeSchema
} from '../schemas/validationSchemas';
import { validateParams, validateQuery, getValidatedParams, getValidatedQuery } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

/**
 * Obtiene el historial de un cobro específico
 */
export const getHistorialCobro = [
  validateParams(cobroIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: cobroId } = getValidatedParams(req);
    
    const historial = await HistorialService.obtenerHistorialCobro(cobroId);
    res.json(historial);
  })
];

/**
 * Obtiene el historial general con filtros
 */
export const getHistorialGeneral = [
  validateQuery(paginationSchema.merge(dateRangeSchema).extend({
    usuarioId: z.string().uuid().optional(),
    tipoCambio: z.string().optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    console.log('🔍 DEBUG - getHistorialGeneral llamado');
    console.log('🔍 DEBUG - Query params:', req.query);
    console.log('🔍 DEBUG - req.tenantFilter completo:', (req as any).tenantFilter);
    console.log('🔍 DEBUG - req.user:', (req as any).user);
    
    const validatedQuery = getValidatedQuery(req);
    const { 
      fechaDesde, 
      fechaHasta, 
      usuarioId, 
      tipoCambio, 
      limit = 50, 
      offset = 0 
    } = validatedQuery;
    
    const filtros: any = {
      limit,
      offset
    };
    
    if (fechaDesde) filtros.fechaDesde = new Date(fechaDesde);
    if (fechaHasta) filtros.fechaHasta = new Date(fechaHasta);
    if (usuarioId) filtros.usuarioId = usuarioId;
    if (tipoCambio) filtros.tipoCambio = tipoCambio;
    
    console.log('🔍 DEBUG - obtenerHistorialGeneral llamado con filtros:', JSON.stringify(filtros, null, 2));
    
    // Agregar el filtro de organización desde el middleware
    if ((req as any).tenantFilter?.organizacion_id) {
      filtros.organizacionId = (req as any).tenantFilter.organizacion_id;
      console.log('🔍 DEBUG - Filtro de organización aplicado:', filtros.organizacionId);
    } else {
      console.log('❌ DEBUG - NO se encontró tenantFilter.organizacion_id');
      console.log('❌ DEBUG - req.tenantFilter:', (req as any).tenantFilter);
      console.log('❌ DEBUG - req.user?.organizacion_id:', (req as any).user?.organizacion_id);
    }
    
    const historial = await HistorialService.obtenerHistorialGeneral(filtros);
    
    console.log(`🔍 DEBUG - Historial encontrado: ${historial.length} registros`);
    if (historial.length > 0) {
      console.log('🔍 DEBUG - Primer registro created_at:', historial[0].created_at);
      console.log('🔍 DEBUG - Primer registro tipo_cambio:', historial[0].tipo_cambio);
    } else {
      console.log('🔍 DEBUG - No hay registros encontrados');
    }
    
    console.log(`🔍 DEBUG - Historial retornado al frontend: ${historial.length} registros`);
    res.json(historial);
  })
];

/**
 * Obtiene estadísticas del historial
 */
export const getEstadisticasHistorial = asyncHandler(async (req: Request, res: Response) => {
  const estadisticas = await HistorialService.obtenerEstadisticasHistorial();
  res.json(estadisticas);
});

/**
 * Exporta el historial a diferentes formatos
 */
export const exportarHistorial = [
  validateQuery(dateRangeSchema.extend({
    formato: z.enum(['json', 'csv', 'excel']).optional().default('json'),
    usuarioId: z.string().uuid().optional(),
    tipoCambio: z.string().optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getValidatedQuery(req);
    const { formato = 'json', fechaDesde, fechaHasta, usuarioId, tipoCambio } = validatedQuery;
    
    const filtros: any = {};
    if (fechaDesde) filtros.fechaDesde = new Date(fechaDesde);
    if (fechaHasta) filtros.fechaHasta = new Date(fechaHasta);
    if (usuarioId) filtros.usuarioId = usuarioId;
    if (tipoCambio) filtros.tipoCambio = tipoCambio;
    
    const historial = await HistorialService.obtenerHistorialGeneral(filtros);
    
    switch (formato) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="historial.csv"');
        
        // Crear CSV
        const csvHeader = 'Fecha,Usuario,Tipo Cambio,Descripción,Paciente\n';
        const csvData = historial.map(registro => 
          `${registro.created_at},${registro.usuario.nombre} ${registro.usuario.apellido},${registro.tipo_cambio},${registro.detalles_antes || ''},${registro.cobro?.paciente?.nombre || ''} ${registro.cobro?.paciente?.apellido || ''}`
        ).join('\n');
        
        res.send(csvHeader + csvData);
        break;
        
      case 'excel':
        // Aquí podrías implementar la exportación a Excel
        res.status(501).json({ error: 'Exportación a Excel no implementada aún' });
        break;
        
      default:
        res.json(historial);
    }
  })
];

/**
 * Obtiene el historial de actividad de un usuario específico
 */
export const getHistorialUsuario = [
  validateParams(usuarioIdSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: usuarioId } = getValidatedParams(req);
    const { limit = 50, offset = 0 } = getValidatedQuery(req);
    
    const historial = await HistorialService.obtenerHistorialGeneral({
      usuarioId,
      limit,
      offset
    });
    
    res.json(historial);
  })
];

/**
 * Busca en el historial por texto
 */
export const buscarHistorial = [
  validateQuery(paginationSchema.extend({
    q: z.string().min(1, 'El término de búsqueda es requerido')
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 50, offset = 0 } = getValidatedQuery(req);
    
    // Implementar búsqueda en el historial
    // Por ahora, obtenemos todo y filtramos
    const historial = await HistorialService.obtenerHistorialGeneral({
      limit,
      offset
    });
    
    // Filtrar por término de búsqueda
    const termino = q.toLowerCase();
    const resultados = historial.filter(registro => 
      registro.usuario.nombre.toLowerCase().includes(termino) ||
      registro.usuario.apellido.toLowerCase().includes(termino) ||
      registro.tipo_cambio.toLowerCase().includes(termino) ||
      (registro.cobro?.paciente?.nombre || '').toLowerCase().includes(termino) ||
      (registro.cobro?.paciente?.apellido || '').toLowerCase().includes(termino)
    );
    
    res.json(resultados);
  })
];