import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { HistorialService } from '../services/historialService';
import asyncHandler from '../utils/asyncHandler';
import { 
  createCobroSchema, 
  updateCobroSchema, 
  cobroIdSchema,
  createCobroConceptoSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

console.log("INICIANDO CONTROLADOR COBROS!!!");
process.on('uncaughtException', function (err) {
  console.error('Excepción no capturada en controlador:', err);
});
process.on('unhandledRejection', function (err) {
  console.error('Promesa no manejada en controlador:', err);
});
console.log("Antes de crear PrismaClient");
const prisma = new PrismaClient();
console.log("Después de crear PrismaClient");

export const getAllCobros = asyncHandler(async (req: Request, res: Response) => {
  console.log("Entrando a getAllCobros");
  
  // Obtener parámetros de query para filtros
  const { estado, mostrarCancelados } = req.query;
  
  // Construir filtros
  const whereClause: any = {};
  
  // Si no se especifica mostrarCancelados o es false, excluir CANCELADO
  if (mostrarCancelados !== 'true') {
    whereClause.estado = {
      not: 'CANCELADO'
    };
  }
  
  // Si se especifica un estado específico, usarlo
  if (estado && estado !== 'TODOS') {
    whereClause.estado = estado;
  }
  
  console.log("🔍 DEBUG - Filtros aplicados:", whereClause);
  
  const cobros = await prisma.cobro.findMany({
    where: whereClause,
    include: {
      paciente: true,
      usuario: true,
      conceptos: { 
        include: { 
          servicio: true 
        } 
      },
      historial: true,
      metodos_pago: true,
    },
  });
  
  console.log(`🔍 DEBUG - Cobros encontrados: ${cobros.length}`);
  res.json(cobros);
});

export const getAllCobrosIncludingCancelled = asyncHandler(async (req: Request, res: Response) => {
  console.log("Entrando a getAllCobrosIncludingCancelled");
  const cobros = await prisma.cobro.findMany({
    include: {
      paciente: true,
      usuario: true,
      conceptos: { 
        include: { 
          servicio: true 
        } 
      },
      historial: true,
      metodos_pago: true,
    },
  });
  console.log(`🔍 DEBUG - Todos los cobros encontrados (incluyendo cancelados): ${cobros.length}`);
  res.json(cobros);
});

export const getCobroById = [
  validateParams(cobroIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Entrando a getCobroById");
    const { id } = getValidatedParams(req);
    
    const cobro = await prisma.cobro.findUnique({
      where: { id },
      include: {
        paciente: true,
        usuario: true,
        conceptos: { 
          include: { 
            servicio: true 
          } 
        },
        historial: true,
        metodos_pago: true,
      },
    });

    if (!cobro) {
      throw createNotFoundError('Cobro no encontrado');
    }

    res.json(cobro);
  })
];

export const createCobro = [
  validateBody(createCobroSchema),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Entrando a createCobro");
    console.log("Body recibido en createCobro:", JSON.stringify(req.body, null, 2));
    
    const validatedData = getValidatedBody(req);
    const { paciente_id, usuario_id, fecha_cobro, monto_total, estado, notas, pagos } = validatedData;
    console.log("Pagos recibidos:", pagos);
  
    // Crear el cobro (sin metodo_pago único)
    const cobro = await prisma.cobro.create({
      data: {
        paciente_id,
        usuario_id,
        fecha_cobro: new Date(fecha_cobro),
        monto_total: parseFloat(monto_total),
        estado,
        notas: notas || null,
      },
    });
    
    // Crear los métodos de pago asociados
    for (const pago of pagos) {
      console.log("Creando metodoPagoCobro:", pago);
      await prisma.metodoPagoCobro.create({
        data: {
          cobro_id: cobro.id,
          metodo_pago: pago.metodo,
          monto: parseFloat(pago.monto),
        },
      });
    }
    
    // Buscar el cobro completo con métodos de pago
    const cobroCompleto = await prisma.cobro.findUnique({
      where: { id: cobro.id },
      include: {
        paciente: true,
        usuario: true,
        conceptos: { include: { servicio: true } },
        historial: true,
        metodos_pago: true,
      },
    });
    console.log("Cobro completo después de crear:", JSON.stringify(cobroCompleto, null, 2));
    
    // Registrar en el historial
    try {
      console.log("🔍 DEBUG - Intentando registrar historial para cobro:", cobro.id);
      await HistorialService.registrarCreacionCobro(
        cobro.id,
        usuario_id,
        cobroCompleto,
        req.ip,
        req.get('User-Agent')
      );
      console.log("✅ Historial registrado para creación de cobro");
    } catch (historialError) {
      console.error("❌ Error registrando historial:", historialError);
      console.error("❌ Detalles del error:", historialError);
      // No fallamos la operación principal por un error en el historial
    }
    
    res.json(cobroCompleto);
  })
];

export const updateCobro = [
  validateParams(cobroIdSchema),
  validateBody(updateCobroSchema),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("🔍 DEBUG - Entrando a updateCobro");
    console.log("🔍 DEBUG - Headers:", req.headers);
    console.log("🔍 DEBUG - User:", (req as any).user);
    
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const { paciente_id, usuario_id, fecha_cobro, monto_total, estado, metodo_pago, notas, pagos } = validatedData;

    console.log("🔍 DEBUG - Body recibido en updateCobro:", JSON.stringify(req.body, null, 2));

    // Obtener el cobro anterior para el historial
    const cobroAnterior = await prisma.cobro.findUnique({
      where: { id },
      include: {
        paciente: true,
        usuario: true,
        conceptos: { include: { servicio: true } },
        historial: true,
        metodos_pago: true,
      },
    });

    if (!cobroAnterior) {
      throw createNotFoundError('Cobro no encontrado');
    }

    const updateData: any = {};
    if (paciente_id) updateData.paciente_id = paciente_id;
    if (usuario_id) updateData.usuario_id = usuario_id;
    if (fecha_cobro) updateData.fecha_cobro = new Date(fecha_cobro);
    if (monto_total) updateData.monto_total = parseFloat(monto_total);
    if (estado) updateData.estado = estado;
    if (metodo_pago) updateData.metodo_pago = metodo_pago;
    if (notas !== undefined) updateData.notas = notas;

    // Actualizar el cobro
    const cobro = await prisma.cobro.update({
      where: { id },
      data: updateData,
    });

    // Si se envía pagos, borrar los métodos de pago existentes y crear los nuevos
    if (pagos !== undefined) {
      await prisma.metodoPagoCobro.deleteMany({ where: { cobro_id: id } });
      for (const pago of pagos) {
        await prisma.metodoPagoCobro.create({
          data: {
            cobro_id: id,
            metodo_pago: pago.metodo,
            monto: parseFloat(pago.monto),
          },
        });
      }
    }

    // Buscar el cobro completo actualizado
    const cobroCompleto = await prisma.cobro.findUnique({
      where: { id: cobro.id },
      include: {
        paciente: true,
        usuario: true,
        conceptos: { include: { servicio: true } },
        historial: true,
        metodos_pago: true,
      },
    });
    
    // Registrar en el historial
    try {
      await HistorialService.registrarEdicionCobro(
        cobro.id,
        usuario_id || cobroAnterior.usuario_id,
        cobroAnterior,
        cobroCompleto,
        'Cobro actualizado',
        req.ip,
        req.get('User-Agent')
      );
      console.log("✅ Historial registrado para actualización de cobro");
    } catch (historialError) {
      console.error("❌ Error registrando historial:", historialError);
      // No fallamos la operación principal por un error en el historial
    }
    
    res.json(cobroCompleto);
  })
];

export const deleteCobro = [
  validateParams(cobroIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Entrando a deleteCobro");
    const { id } = getValidatedParams(req);
  
    // Obtener el cobro antes de eliminarlo para el historial
    const cobroAEliminar = await prisma.cobro.findUnique({
      where: { id },
      include: {
        paciente: true,
        usuario: true,
        conceptos: { include: { servicio: true } },
        historial: true,
        metodos_pago: true,
      },
    });
    
    if (!cobroAEliminar) {
      throw createNotFoundError('Cobro no encontrado');
    }
    
    // Registrar en el historial ANTES de eliminar el cobro
    try {
      await HistorialService.registrarEliminacionCobro(
        id,
        cobroAEliminar.usuario_id,
        cobroAEliminar,
        req.ip,
        req.get('User-Agent')
      );
      console.log("✅ Historial registrado para eliminación de cobro");
    } catch (historialError) {
      console.error("❌ Error registrando historial:", historialError);
      // No fallamos la operación principal por un error en el historial
    }
    
    // En lugar de eliminar físicamente, marcar como CANCELADO
    await prisma.cobro.update({
      where: { id },
      data: { 
        estado: 'CANCELADO',
        updated_at: new Date()
      }
    });
    
    console.log("✅ Cobro marcado como CANCELADO en lugar de eliminarlo físicamente");
    
    res.json({ message: 'Cobro eliminado' });
  })
];

export const addServicioToCobro = [
  validateParams(cobroIdSchema),
  validateBody(createCobroConceptoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Entrando a addServicioToCobro");
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const { servicio_id, cantidad, precio_unitario, consultorio_id } = validatedData;
  
    // Verificar que el cobro existe
    const cobro = await prisma.cobro.findUnique({ where: { id } });
    if (!cobro) {
      throw createNotFoundError('Cobro no encontrado');
    }
    
    // Verificar que el servicio existe
    const servicio = await prisma.servicio.findUnique({ where: { id: servicio_id } });
    if (!servicio) {
      throw createNotFoundError('Servicio no encontrado');
    }
    
    // Crear el concepto de cobro
    const concepto = await prisma.cobroConcepto.create({
      data: {
        cobro_id: id,
        servicio_id,
        precio_unitario: parseFloat(precio_unitario),
        cantidad: parseInt(cantidad),
        subtotal: parseFloat(precio_unitario) * parseInt(cantidad),
        consultorio_id,
      },
    });
    
    // Actualizar el monto total del cobro
    const conceptos = await prisma.cobroConcepto.findMany({
      where: { cobro_id: id },
    });
    const nuevoMontoTotal = conceptos.reduce((total, concepto) => {
      return total + concepto.subtotal;
    }, 0);
    
    await prisma.cobro.update({
      where: { id },
      data: { monto_total: nuevoMontoTotal },
    });
    
    res.json(concepto);
  })
];

export const addConceptoToCobro = [
  validateParams(cobroIdSchema),
  validateBody(createCobroConceptoSchema),
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Entrando a addConceptoToCobro");
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const { servicio_id, cantidad, precio_unitario, consultorio_id } = validatedData;
    
    // Verificar que el cobro existe
    const cobro = await prisma.cobro.findUnique({ where: { id } });
    if (!cobro) {
      throw createNotFoundError('Cobro no encontrado');
    }
    
    // Verificar que el servicio existe
    const servicio = await prisma.servicio.findUnique({ where: { id: servicio_id } });
    if (!servicio) {
      throw createNotFoundError('Servicio no encontrado');
    }
    
    // Crear el concepto de cobro
    const concepto = await prisma.cobroConcepto.create({
      data: {
        cobro_id: id,
        servicio_id,
        precio_unitario: parseFloat(precio_unitario),
        cantidad: parseInt(cantidad),
        subtotal: parseFloat(precio_unitario) * parseInt(cantidad),
        consultorio_id,
      },
    });
    
    // Actualizar el monto total del cobro
    const conceptos = await prisma.cobroConcepto.findMany({
      where: { cobro_id: id },
    });
    const nuevoMontoTotal = conceptos.reduce((total, concepto) => {
      return total + concepto.subtotal;
    }, 0);
    
    await prisma.cobro.update({
      where: { id },
      data: { monto_total: nuevoMontoTotal },
    });
    
    res.json(concepto);
  })
]; 