import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  fechaCitaMedicaSchema,
  pacienteAvanzadoSchema,
  montoMedicoSchema,
  horarioMedicoSchema,
  imagenSchema,
  documentoPdfSchema 
} from '../schemas/advancedValidations';
import { 
  validateFechaCitaMedica,
  validateMontoMedico,
  validateHorarioMedico,
  validateTutorLegal,
  validateSeguroMedico,
  calculateAge,
  hasTimeOverlap
} from '../middleware/advancedValidation';

// ========================================
// DEMO DE VALIDACIONES AVANZADAS
// ========================================

/**
 * Ejemplo 1: Validación de fecha de cita médica
 */
export function demoValidacionFechaCita() {
  console.log('🏥 DEMO: Validación de Fecha de Cita Médica\n');

  // Casos de prueba
  const casos = [
    {
      nombre: 'Cita válida',
      data: {
        fecha_hora: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días en el futuro
        duracion: 60
      },
      esperado: true
    },
    {
      nombre: 'Cita en el pasado',
      data: {
        fecha_hora: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día en el pasado
        duracion: 60
      },
      esperado: false
    },
    {
      nombre: 'Cita en domingo',
      data: {
        fecha_hora: '2025-01-12T10:00:00Z', // Domingo
        duracion: 30
      },
      esperado: false
    },
    {
      nombre: 'Duración muy corta',
      data: {
        fecha_hora: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duracion: 10 // Menos de 15 minutos
      },
      esperado: false
    }
  ];

  casos.forEach(caso => {
    try {
      fechaCitaMedicaSchema.parse(caso.data);
      console.log(`✅ ${caso.nombre}: VÁLIDO`);
      if (!caso.esperado) console.log('   ⚠️  Se esperaba que fuera inválido');
    } catch (error: any) {
      const mensaje = error.errors?.[0]?.message || error.message || 'Error desconocido';
      console.log(`❌ ${caso.nombre}: INVÁLIDO - ${mensaje}`);
      if (caso.esperado) console.log('   ⚠️  Se esperaba que fuera válido');
    }
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Ejemplo 2: Validación de paciente avanzado con tutor legal
 */
export function demoValidacionPacienteAvanzado() {
  console.log('👶 DEMO: Validación de Paciente Avanzado\n');

  const casos = [
    {
      nombre: 'Menor con tutor legal',
      data: {
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '2010-05-15T00:00:00Z', // 14 años
        genero: 'M',
        telefono: '123456789',
        email: 'juan@example.com',
        es_menor: true,
        tutor_legal: {
          nombre: 'María Pérez',
          telefono: '987654321',
          relacion: 'MADRE'
        }
      },
      esperado: true
    },
    {
      nombre: 'Menor sin tutor legal',
      data: {
        nombre: 'Ana',
        apellido: 'García',
        fecha_nacimiento: '2015-03-20T00:00:00Z', // 9 años
        genero: 'F',
        telefono: '111222333',
        email: 'ana@example.com',
        es_menor: true
        // Sin tutor_legal
      },
      esperado: false
    },
    {
      nombre: 'Adulto con seguro médico válido',
      data: {
        nombre: 'Carlos',
        apellido: 'López',
        fecha_nacimiento: '1985-08-12T00:00:00Z', // 39 años
        genero: 'M',
        telefono: '444555666',
        email: 'carlos@example.com',
        es_menor: false,
        seguro_medico: {
          proveedor: 'SeguroSalud',
          numero_poliza: 'POL123456',
          vigencia_hasta: '2025-12-31T23:59:59Z'
        }
      },
      esperado: true
    },
    {
      nombre: 'Adulto con seguro médico vencido',
      data: {
        nombre: 'Laura',
        apellido: 'Martín',
        fecha_nacimiento: '1990-11-05T00:00:00Z',
        genero: 'F',
        telefono: '777888999',
        email: 'laura@example.com',
        es_menor: false,
        seguro_medico: {
          proveedor: 'SeguroSalud',
          numero_poliza: 'POL789012',
          vigencia_hasta: '2023-12-31T23:59:59Z' // Vencido
        }
      },
      esperado: false
    }
  ];

  casos.forEach(caso => {
    try {
      pacienteAvanzadoSchema.parse(caso.data);
      console.log(`✅ ${caso.nombre}: VÁLIDO`);
      if (!caso.esperado) console.log('   ⚠️  Se esperaba que fuera inválido');
    } catch (error: any) {
      const mensaje = error.errors?.[0]?.message || error.message || 'Error desconocido';
      console.log(`❌ ${caso.nombre}: INVÁLIDO - ${mensaje}`);
      if (caso.esperado) console.log('   ⚠️  Se esperaba que fuera válido');
    }
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Ejemplo 3: Validación de montos médicos con métodos de pago
 */
export function demoValidacionMontoMedico() {
  console.log('💰 DEMO: Validación de Montos Médicos\n');

  const casos = [
    {
      nombre: 'Pago completo en efectivo',
      data: {
        monto_total: 100.00,
        metodos_pago: [
          { metodo: 'EFECTIVO', monto: 100.00 }
        ]
      },
      esperado: true
    },
    {
      nombre: 'Pago mixto (efectivo + tarjeta)',
      data: {
        monto_total: 150.00,
        metodos_pago: [
          { metodo: 'EFECTIVO', monto: 50.00 },
          { metodo: 'TARJETA_CREDITO', monto: 100.00, referencia: 'TXN123456' }
        ]
      },
      esperado: true
    },
    {
      nombre: 'Monto total no coincide',
      data: {
        monto_total: 100.00,
        metodos_pago: [
          { metodo: 'EFECTIVO', monto: 80.00 }
        ]
      },
      esperado: false
    },
    {
      nombre: 'Múltiples pagos en efectivo',
      data: {
        monto_total: 200.00,
        metodos_pago: [
          { metodo: 'EFECTIVO', monto: 100.00 },
          { metodo: 'EFECTIVO', monto: 100.00 }
        ]
      },
      esperado: false
    },
    {
      nombre: 'Pago con seguro médico',
      data: {
        monto_total: 300.00,
        metodos_pago: [
          { metodo: 'SEGURO', monto: 250.00, referencia: 'POL789012' },
          { metodo: 'EFECTIVO', monto: 50.00 }
        ]
      },
      esperado: true
    }
  ];

  casos.forEach(caso => {
    try {
      montoMedicoSchema.parse(caso.data);
      console.log(`✅ ${caso.nombre}: VÁLIDO`);
      if (!caso.esperado) console.log('   ⚠️  Se esperaba que fuera inválido');
    } catch (error: any) {
      const mensaje = error.errors?.[0]?.message || error.message || 'Error desconocido';
      console.log(`❌ ${caso.nombre}: INVÁLIDO - ${mensaje}`);
      if (caso.esperado) console.log('   ⚠️  Se esperaba que fuera válido');
    }
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Ejemplo 4: Validación de archivos
 */
export function demoValidacionArchivos() {
  console.log('📁 DEMO: Validación de Archivos\n');

  const casos = [
    {
      nombre: 'Imagen JPEG válida',
      data: {
        filename: 'foto_perfil.jpg',
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024 // 2MB
      },
      schema: imagenSchema,
      esperado: true
    },
    {
      nombre: 'Imagen PNG válida',
      data: {
        filename: 'radiografia.png',
        mimetype: 'image/png',
        size: 4 * 1024 * 1024 // 4MB
      },
      schema: imagenSchema,
      esperado: true
    },
    {
      nombre: 'Imagen muy grande',
      data: {
        filename: 'imagen_grande.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024 // 10MB - excede el límite de 5MB
      },
      schema: imagenSchema,
      esperado: false
    },
    {
      nombre: 'Archivo no imagen',
      data: {
        filename: 'documento.pdf',
        mimetype: 'application/pdf',
        size: 1 * 1024 * 1024
      },
      schema: imagenSchema,
      esperado: false
    },
    {
      nombre: 'PDF válido',
      data: {
        filename: 'informe_medico.pdf',
        mimetype: 'application/pdf',
        size: 3 * 1024 * 1024 // 3MB
      },
      schema: documentoPdfSchema,
      esperado: true
    },
    {
      nombre: 'PDF muy grande',
      data: {
        filename: 'informe_completo.pdf',
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024 // 15MB - excede el límite de 10MB
      },
      schema: documentoPdfSchema,
      esperado: false
    }
  ];

  casos.forEach(caso => {
    try {
      caso.schema.parse(caso.data);
      console.log(`✅ ${caso.nombre}: VÁLIDO`);
      if (!caso.esperado) console.log('   ⚠️  Se esperaba que fuera inválido');
    } catch (error: any) {
      const mensaje = error.errors?.[0]?.message || error.message || 'Error desconocido';
      console.log(`❌ ${caso.nombre}: INVÁLIDO - ${mensaje}`);
      if (caso.esperado) console.log('   ⚠️  Se esperaba que fuera válido');
    }
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Ejemplo 5: Utilidades de validación
 */
export function demoUtilidadesValidacion() {
  console.log('🛠️  DEMO: Utilidades de Validación\n');

  // Cálculo de edad
  console.log('📅 Cálculo de Edad:');
  const fechasNacimiento = [
    { fecha: '1990-01-15T00:00:00Z', expected: 35 },
    { fecha: '2010-06-20T00:00:00Z', expected: 14 },
    { fecha: '2020-12-31T00:00:00Z', expected: 4 }
  ];

  fechasNacimiento.forEach(({ fecha, expected }) => {
    const edad = calculateAge(fecha);
    console.log(`   Nacido: ${fecha.split('T')[0]} → Edad: ${edad} años ${edad === expected ? '✅' : '❌'}`);
  });

  console.log('\n⏰ Solapamiento de Horarios:');
  const horarios = [
    { inicio1: '09:00', fin1: '10:00', inicio2: '10:00', fin2: '11:00', esperado: false },
    { inicio1: '09:00', fin1: '10:30', inicio2: '10:00', fin2: '11:00', esperado: true },
    { inicio1: '14:00', fin1: '15:00', inicio2: '16:00', fin2: '17:00', esperado: false },
    { inicio1: '08:00', fin1: '12:00', inicio2: '10:00', fin2: '11:00', esperado: true }
  ];

  horarios.forEach(({ inicio1, fin1, inicio2, fin2, esperado }) => {
    const overlap = hasTimeOverlap(inicio1, fin1, inicio2, fin2);
    const resultado = overlap ? 'SÍ' : 'NO';
    const status = overlap === esperado ? '✅' : '❌';
    console.log(`   ${inicio1}-${fin1} vs ${inicio2}-${fin2}: ${resultado} ${status}`);
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Función principal para ejecutar todas las demos
 */
export function ejecutarTodasLasDemos() {
  console.log('🚀 EJECUTANDO DEMOS DE VALIDACIONES AVANZADAS\n');
  console.log('='.repeat(60) + '\n');

  demoValidacionFechaCita();
  demoValidacionPacienteAvanzado();
  demoValidacionMontoMedico();
  demoValidacionArchivos();
  demoUtilidadesValidacion();

  console.log('🎉 TODAS LAS DEMOS COMPLETADAS\n');
  console.log('📋 RESUMEN:');
  console.log('  ✅ Validaciones de fechas médicas implementadas');
  console.log('  ✅ Validaciones de pacientes con tutores legales');
  console.log('  ✅ Validaciones de montos y métodos de pago');
  console.log('  ✅ Validaciones de archivos (imágenes y PDFs)');
  console.log('  ✅ Utilidades de validación avanzadas');
  console.log('\n💡 Estas validaciones pueden integrarse en controllers reales para mejorar la robustez del sistema médico.');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarTodasLasDemos();
}