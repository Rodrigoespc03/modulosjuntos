import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodObject } from 'zod';
import { 
  imagenSchema, 
  documentoPdfSchema, 
  horarioMedicoSchema,
  fechaCitaMedicaSchema,
  montoMedicoSchema 
} from '../schemas/advancedValidations';
import { createBadRequestError } from './errorHandler';

// ========================================
// MIDDLEWARE PARA VALIDACIÓN DE ARCHIVOS
// ========================================

// Configuración de multer para archivos temporales
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
});

/**
 * Middleware para validar imágenes subidas
 */
export const validateImage = [
  upload.single('imagen'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw createBadRequestError('No se proporcionó ningún archivo de imagen');
    }

    try {
      imagenSchema.parse({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      });
      
      // Agregar datos validados al request
      (req as any).validatedFile = req.file;
      next();
    } catch (error: any) {
      throw createBadRequestError(`Error en validación de imagen: ${error.message}`);
    }
  }
];

/**
 * Middleware para validar documentos PDF subidos
 */
export const validatePdf = [
  upload.single('documento'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw createBadRequestError('No se proporcionó ningún documento PDF');
    }

    try {
      documentoPdfSchema.parse({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      });
      
      // Agregar datos validados al request
      (req as any).validatedFile = req.file;
      next();
    } catch (error: any) {
      throw createBadRequestError(`Error en validación de documento PDF: ${error.message}`);
    }
  }
];

/**
 * Middleware para validar múltiples archivos (imágenes y documentos)
 */
export const validateMultipleFiles = [
  upload.fields([
    { name: 'imagenes', maxCount: 5 },
    { name: 'documentos', maxCount: 3 }
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    try {
      // Validar imágenes si existen
      if (files.imagenes) {
        files.imagenes.forEach((file, index) => {
          imagenSchema.parse({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer,
          });
        });
      }

      // Validar documentos si existen
      if (files.documentos) {
        files.documentos.forEach((file, index) => {
          documentoPdfSchema.parse({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer,
          });
        });
      }

      // Agregar archivos validados al request
      (req as any).validatedFiles = files;
      next();
    } catch (error: any) {
      throw createBadRequestError(`Error en validación de archivos: ${error.message}`);
    }
  }
];

// ========================================
// MIDDLEWARE PARA VALIDACIONES DE NEGOCIO
// ========================================

/**
 * Middleware para validar horarios médicos
 */
export const validateHorarioMedico = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hora_inicio, hora_fin } = req.body;
    
    horarioMedicoSchema.parse({ hora_inicio, hora_fin });
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de horario médico: ${error.message}`);
  }
};

/**
 * Middleware para validar fechas de citas médicas
 */
export const validateFechaCitaMedica = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha_hora, duracion } = req.body;
    
    fechaCitaMedicaSchema.parse({ fecha_hora, duracion });
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de fecha de cita médica: ${error.message}`);
  }
};

/**
 * Middleware para validar montos y métodos de pago médicos
 */
export const validateMontoMedico = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { monto_total, metodos_pago } = req.body;
    
    montoMedicoSchema.parse({ monto_total, metodos_pago });
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de monto médico: ${error.message}`);
  }
};

// ========================================
// MIDDLEWARE PARA VALIDACIONES CONDICIONALES
// ========================================

/**
 * Middleware para validar que un paciente menor de edad tenga tutor
 */
export const validateTutorLegal = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha_nacimiento, tutor_legal } = req.body;
    
    if (fecha_nacimiento) {
      const fechaNacimiento = new Date(fecha_nacimiento);
      const ahora = new Date();
      const edad = ahora.getFullYear() - fechaNacimiento.getFullYear();
      
      if (edad < 18 && !tutor_legal) {
        throw createBadRequestError('Los pacientes menores de edad deben tener un tutor legal registrado');
      }
    }
    
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de tutor legal: ${error.message}`);
  }
};

/**
 * Middleware para validar que no hay conflictos de horarios médicos
 */
export const validateConflictoHorarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctor_id, fecha_hora, duracion } = req.body;
    
    if (doctor_id && fecha_hora && duracion) {
      // Aquí irían las validaciones de conflictos con la base de datos
      // Por ejemplo, verificar citas existentes, disponibilidad del médico, etc.
      
      const fechaCita = new Date(fecha_hora);
      const fechaFin = new Date(fechaCita.getTime() + (duracion * 60000)); // duracion en minutos
      
      // Simulación de validación de conflictos
      // En un caso real, esto consultaría la base de datos
      console.log(`Validando disponibilidad para doctor ${doctor_id} desde ${fechaCita} hasta ${fechaFin}`);
    }
    
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de conflictos de horarios: ${error.message}`);
  }
};

// ========================================
// MIDDLEWARE PARA VALIDACIONES MÉDICAS ESPECÍFICAS
// ========================================

/**
 * Middleware para validar medicamentos y productos médicos
 */
export const validateMedicamento = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha_vencimiento, requiere_receta, principio_activo } = req.body;
    
    // Validar fecha de vencimiento
    if (fecha_vencimiento) {
      const fechaVencimiento = new Date(fecha_vencimiento);
      const ahora = new Date();
      const tresMeses = new Date();
      tresMeses.setMonth(tresMeses.getMonth() + 3);
      
      if (fechaVencimiento <= tresMeses) {
        throw createBadRequestError('Los medicamentos deben tener al menos 3 meses antes del vencimiento');
      }
    }
    
    // Si requiere receta, debe tener principio activo
    if (requiere_receta && !principio_activo) {
      throw createBadRequestError('Los medicamentos que requieren receta deben especificar el principio activo');
    }
    
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de medicamento: ${error.message}`);
  }
};

/**
 * Middleware para validar seguros médicos
 */
export const validateSeguroMedico = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seguro_medico } = req.body;
    
    if (seguro_medico) {
      const { vigencia_hasta } = seguro_medico;
      
      if (vigencia_hasta) {
        const fechaVigencia = new Date(vigencia_hasta);
        const ahora = new Date();
        
        if (fechaVigencia <= ahora) {
          throw createBadRequestError('El seguro médico no puede estar vencido');
        }
      }
    }
    
    next();
  } catch (error: any) {
    throw createBadRequestError(`Error en validación de seguro médico: ${error.message}`);
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Función helper para validar rangos de fechas
 */
export const isValidDateRange = (fechaInicio: string, fechaFin: string): boolean => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  return fin > inicio;
};

/**
 * Función helper para calcular edad
 */
export const calculateAge = (fechaNacimiento: string): number => {
  const nacimiento = new Date(fechaNacimiento);
  const ahora = new Date();
  
  let edad = ahora.getFullYear() - nacimiento.getFullYear();
  const mesActual = ahora.getMonth();
  const diaActual = ahora.getDate();
  const mesNacimiento = nacimiento.getMonth();
  const diaNacimiento = nacimiento.getDate();
  
  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
    edad--;
  }
  
  return edad;
};

/**
 * Función helper para validar solapamiento de horarios
 */
export const hasTimeOverlap = (
  inicio1: string, 
  fin1: string, 
  inicio2: string, 
  fin2: string
): boolean => {
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const start1 = timeToMinutes(inicio1);
  const end1 = timeToMinutes(fin1);
  const start2 = timeToMinutes(inicio2);
  const end2 = timeToMinutes(fin2);
  
  return (start1 < end2) && (start2 < end1);
};