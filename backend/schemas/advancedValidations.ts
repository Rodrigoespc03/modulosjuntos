import { z } from 'zod';

// ========================================
// VALIDACIONES AVANZADAS - DOMINIO MÉDICO
// ========================================

// Validación de horarios médicos
export const horarioMedicoSchema = z.object({
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  hora_fin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
}).refine(
  (data) => {
    const [horaInicioH, horaInicioM] = data.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = data.hora_fin.split(':').map(Number);
    const inicioMinutos = horaInicioH * 60 + horaInicioM;
    const finMinutos = horaFinH * 60 + horaFinM;
    return finMinutos > inicioMinutos;
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['hora_fin']
  }
);

// Validación de fechas de citas médicas
export const fechaCitaMedicaSchema = z.object({
  fecha_hora: z.string().datetime('Fecha y hora inválida'),
  duracion: z.number().int().min(15, 'Duración mínima 15 minutos').max(480, 'Duración máxima 8 horas'),
}).refine(
  (data) => {
    const fechaCita = new Date(data.fecha_hora);
    const ahora = new Date();
    const unAnoAdelante = new Date();
    unAnoAdelante.setFullYear(unAnoAdelante.getFullYear() + 1);
    
    return fechaCita > ahora && fechaCita < unAnoAdelante;
  },
  {
    message: 'La cita debe ser programada entre ahora y un año en el futuro',
    path: ['fecha_hora']
  }
).refine(
  (data) => {
    const fechaCita = new Date(data.fecha_hora);
    const diaSemana = fechaCita.getDay();
    const hora = fechaCita.getHours();
    
    // No permitir citas los domingos (0) o fuera del horario laboral (6:00-22:00)
    return diaSemana !== 0 && hora >= 6 && hora <= 22;
  },
  {
    message: 'Las citas solo pueden ser programadas de lunes a sábado entre 6:00 y 22:00',
    path: ['fecha_hora']
  }
);

// Validación de montos médicos
export const montoMedicoSchema = z.object({
  monto_total: z.number().positive('El monto debe ser positivo'),
  metodos_pago: z.array(z.object({
    metodo: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'SEGURO']),
    monto: z.number().positive('El monto debe ser positivo'),
    referencia: z.string().optional(),
  })).min(1, 'Debe especificar al menos un método de pago'),
}).refine(
  (data) => {
    const totalPagos = data.metodos_pago.reduce((sum, pago) => sum + pago.monto, 0);
    return Math.abs(totalPagos - data.monto_total) < 0.01; // Tolerancia de 1 centavo
  },
  {
    message: 'La suma de los métodos de pago debe igualar el monto total',
    path: ['metodos_pago']
  }
).refine(
  (data) => {
    // Validar que no hay más de un pago en efectivo
    const pagosEfectivo = data.metodos_pago.filter(p => p.metodo === 'EFECTIVO');
    return pagosEfectivo.length <= 1;
  },
  {
    message: 'Solo se permite un pago en efectivo por transacción',
    path: ['metodos_pago']
  }
);

// ========================================
// VALIDACIONES DE ARCHIVOS
// ========================================

// Validación de archivos de imagen
export const imagenSchema = z.object({
  filename: z.string().min(1, 'Nombre de archivo requerido'),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']).refine(
    (value) => ['image/jpeg', 'image/png', 'image/webp'].includes(value),
    { message: 'Solo se permiten archivos JPEG, PNG o WebP' }
  ),
  size: z.number().max(5 * 1024 * 1024, 'El archivo no puede exceder 5MB'),
  buffer: z.instanceof(Buffer).optional(),
}).refine(
  (data) => {
    // Validar extensión del archivo
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.webp'];
    const extension = data.filename.toLowerCase().substring(data.filename.lastIndexOf('.'));
    return extensionesPermitidas.includes(extension);
  },
  {
    message: 'Extensión de archivo no permitida',
    path: ['filename']
  }
);

// Validación de documentos PDF
export const documentoPdfSchema = z.object({
  filename: z.string().min(1, 'Nombre de archivo requerido'),
  mimetype: z.literal('application/pdf'),
  size: z.number().max(10 * 1024 * 1024, 'El archivo no puede exceder 10MB'),
  buffer: z.instanceof(Buffer).optional(),
}).refine(
  (data) => {
    return data.filename.toLowerCase().endsWith('.pdf');
  },
  {
    message: 'El archivo debe tener extensión .pdf',
    path: ['filename']
  }
);

// ========================================
// VALIDACIONES CONDICIONALES AVANZADAS
// ========================================

// Validación condicional para pacientes
export const pacienteAvanzadoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido: z.string().min(2, 'Apellido requerido'),
  fecha_nacimiento: z.string().datetime('Fecha de nacimiento inválida'),
  genero: z.enum(['M', 'F', 'O']),
  telefono: z.string().min(7, 'Teléfono mínimo 7 dígitos'),
  email: z.string().email('Email inválido'),
  es_menor: z.boolean().default(false),
  tutor_legal: z.object({
    nombre: z.string().min(2, 'Nombre del tutor requerido'),
    telefono: z.string().min(7, 'Teléfono del tutor requerido'),
    relacion: z.enum(['PADRE', 'MADRE', 'TUTOR', 'OTRO']),
  }).optional(),
  seguro_medico: z.object({
    proveedor: z.string().min(1, 'Proveedor de seguro requerido'),
    numero_poliza: z.string().min(1, 'Número de póliza requerido'),
    vigencia_hasta: z.string().datetime('Fecha de vigencia inválida'),
  }).optional(),
}).refine(
  (data) => {
    const fechaNacimiento = new Date(data.fecha_nacimiento);
    const ahora = new Date();
    const edad = ahora.getFullYear() - fechaNacimiento.getFullYear();
    const esMenor = edad < 18;
    
    return data.es_menor === esMenor;
  },
  {
    message: 'El campo es_menor debe coincidir con la edad calculada',
    path: ['es_menor']
  }
).refine(
  (data) => {
    // Si es menor de edad, debe tener tutor legal
    return !data.es_menor || data.tutor_legal;
  },
  {
    message: 'Los menores de edad deben tener un tutor legal registrado',
    path: ['tutor_legal']
  }
).refine(
  (data) => {
    // Si tiene seguro médico, verificar que no esté vencido
    if (!data.seguro_medico) return true;
    
    const vigenciaHasta = new Date(data.seguro_medico.vigencia_hasta);
    const ahora = new Date();
    
    return vigenciaHasta > ahora;
  },
  {
    message: 'El seguro médico no puede estar vencido',
    path: ['seguro_medico', 'vigencia_hasta']
  }
);

// ========================================
// VALIDACIONES DE NEGOCIO ESPECÍFICAS
// ========================================

// Validación de disponibilidad médica
export const disponibilidadMedicaAvanzadaSchema = z.object({
  doctor_id: z.string().uuid('ID de doctor inválido'),
  dias_semana: z.array(z.number().int().min(0).max(6, 'Día de semana inválido')).min(1, 'Debe especificar al menos un día'),
  horarios: z.array(horarioMedicoSchema).min(1, 'Debe especificar al menos un horario'),
  fecha_inicio: z.string().datetime('Fecha de inicio inválida'),
  fecha_fin: z.string().datetime('Fecha de fin inválida').optional(),
  excepciones: z.array(z.object({
    fecha: z.string().datetime('Fecha de excepción inválida'),
    motivo: z.string().min(1, 'Motivo requerido'),
    todo_el_dia: z.boolean().default(true),
    hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    hora_fin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  })).default([]),
}).refine(
  (data) => {
    if (!data.fecha_fin) return true;
    return new Date(data.fecha_fin) > new Date(data.fecha_inicio);
  },
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin']
  }
).refine(
  (data) => {
    // Validar que no hay solapamiento de horarios en el mismo día
    for (const dia of data.dias_semana) {
      const horariosDelDia = data.horarios;
      for (let i = 0; i < horariosDelDia.length; i++) {
        for (let j = i + 1; j < horariosDelDia.length; j++) {
          const horario1 = horariosDelDia[i];
          const horario2 = horariosDelDia[j];
          
          const inicio1 = horario1.hora_inicio;
          const fin1 = horario1.hora_fin;
          const inicio2 = horario2.hora_inicio;
          const fin2 = horario2.hora_fin;
          
          // Verificar solapamiento
          if ((inicio1 < fin2) && (inicio2 < fin1)) {
            return false;
          }
        }
      }
    }
    return true;
  },
  {
    message: 'No puede haber solapamiento de horarios en el mismo día',
    path: ['horarios']
  }
);

// ========================================
// VALIDACIONES DE INVENTARIO MÉDICO
// ========================================

export const inventarioMedicoSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  lote: z.string().min(1, 'Número de lote requerido'),
  fecha_vencimiento: z.string().datetime('Fecha de vencimiento inválida'),
  cantidad: z.number().int().positive('Cantidad debe ser positiva'),
  precio_unitario: z.number().positive('Precio unitario debe ser positivo'),
  requiere_receta: z.boolean().default(false),
  temperatura_almacenamiento: z.object({
    minima: z.number(),
    maxima: z.number(),
    unidad: z.enum(['C', 'F']).default('C'),
  }).optional(),
  principio_activo: z.string().min(1, 'Principio activo requerido').optional(),
}).refine(
  (data) => {
    const fechaVencimiento = new Date(data.fecha_vencimiento);
    const ahora = new Date();
    const tresMesesAdelante = new Date();
    tresMesesAdelante.setMonth(tresMesesAdelante.getMonth() + 3);
    
    return fechaVencimiento > tresMesesAdelante;
  },
  {
    message: 'Los productos médicos deben tener al menos 3 meses antes del vencimiento',
    path: ['fecha_vencimiento']
  }
).refine(
  (data) => {
    if (!data.temperatura_almacenamiento) return true;
    
    return data.temperatura_almacenamiento.maxima > data.temperatura_almacenamiento.minima;
  },
  {
    message: 'La temperatura máxima debe ser mayor que la mínima',
    path: ['temperatura_almacenamiento', 'maxima']
  }
);

// ========================================
// TIPOS TYPESCRIPT AVANZADOS
// ========================================

export type HorarioMedicoInput = z.infer<typeof horarioMedicoSchema>;
export type FechaCitaMedicaInput = z.infer<typeof fechaCitaMedicaSchema>;
export type MontoMedicoInput = z.infer<typeof montoMedicoSchema>;
export type ImagenInput = z.infer<typeof imagenSchema>;
export type DocumentoPdfInput = z.infer<typeof documentoPdfSchema>;
export type PacienteAvanzadoInput = z.infer<typeof pacienteAvanzadoSchema>;
export type DisponibilidadMedicaAvanzadaInput = z.infer<typeof disponibilidadMedicaAvanzadaSchema>;
export type InventarioMedicoInput = z.infer<typeof inventarioMedicoSchema>;