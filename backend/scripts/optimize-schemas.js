const fs = require('fs');
const path = require('path');

// Función para optimizar schemas
function optimizeSchemas() {
  console.log('🔧 OPTIMIZANDO SCHEMAS...\n');

  const schemaPath = path.join(__dirname, '..', 'schemas', 'validationSchemas.ts');
  let content = fs.readFileSync(schemaPath, 'utf8');

  // 1. Agregar schemas base reutilizables
  const baseSchemas = `
// ========================================
// SCHEMAS BASE REUTILIZABLES
// ========================================

// Schema base para IDs UUID
export const uuidSchema = z.string().uuid('El ID debe ser un UUID válido');

// Schema base para IDs con nombre específico
export const createIdSchema = (name: string) => z.object({
  id: uuidSchema
});

// Schema base para paginación
export const basePaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Schema base para rangos de fechas
export const baseDateRangeSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Schema base para búsqueda
export const baseSearchSchema = z.object({
  search: z.string().optional(),
});

`;

  // Insertar schemas base después de los enums
  const enumEndIndex = content.indexOf('export const TipoCambioEnum');
  const insertIndex = content.indexOf('}', enumEndIndex) + 1;
  content = content.slice(0, insertIndex) + baseSchemas + content.slice(insertIndex);

  // 2. Reemplazar schemas de ID individuales
  const idSchemas = [
    'usuarioIdSchema',
    'pacienteIdSchema', 
    'consultorioIdSchema',
    'cobroIdSchema',
    'citaIdSchema',
    'servicioIdSchema',
    'cobroConceptoIdSchema',
    'precioConsultorioIdSchema',
    'historialCobroIdSchema',
    'organizacionIdSchema',
    'stepIdSchema'
  ];

  idSchemas.forEach(schemaName => {
    const pattern = new RegExp(`export const ${schemaName} = z\\.object\\(\\{[^}]+\\}\\);`, 'g');
    const replacement = `export const ${schemaName} = createIdSchema('${schemaName.replace('IdSchema', '').toLowerCase()}');`;
    content = content.replace(pattern, replacement);
  });

  // 3. Optimizar schema de paginación
  content = content.replace(
    /export const paginationSchema = z\.object\(\{[^}]+\}\);/, 
    'export const paginationSchema = basePaginationSchema;'
  );

  // 4. Optimizar schema de rango de fechas
  content = content.replace(
    /export const dateRangeSchema = z\.object\(\{[^}]+\}\);/, 
    'export const dateRangeSchema = baseDateRangeSchema;'
  );

  // 5. Eliminar schemas no utilizados (según el análisis)
  const unusedSchemas = [
    'createConfiguracionPermisosSchema',
    'updateConfiguracionPermisosSchema', 
    'createMetodoPagoCobroSchema',
    'updateMetodoPagoCobroSchema'
  ];

  unusedSchemas.forEach(schemaName => {
    const pattern = new RegExp(`export const ${schemaName}[^;]+;`, 'g');
    content = content.replace(pattern, '');
  });

  // 6. Optimizar schemas complejos
  // Simplificar registerOrganizationSchema
  content = content.replace(
    /export const registerOrganizationSchema = z\.object\(\{[^}]+\}\)\.refine\([^)]+\);/s,
    `export const registerOrganizationSchema = z.object({
  // Datos de la clínica
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  ruc: z.string().min(11, 'El RUC debe tener 11 dígitos').max(11, 'El RUC debe tener 11 dígitos'),
  email: z.string().email('El email debe ser válido'),
  telefono: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos'),
  ciudad: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  
  // Datos del administrador
  adminNombre: z.string().min(2, 'El nombre del administrador debe tener al menos 2 caracteres'),
  adminEmail: z.string().email('El email del administrador debe ser válido'),
  adminPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  adminPasswordConfirm: z.string().min(6, 'La confirmación de contraseña debe tener al menos 6 caracteres'),
  
  // Configuración
  tipoClinica: z.string().optional(),
  numMedicos: z.string().optional(),
  modulos: z.array(z.string()).optional(),
  plan: z.string().optional()
}).refine(
  (data) => data.adminPassword === data.adminPasswordConfirm,
  {
    message: 'Las contraseñas no coinciden',
    path: ['adminPasswordConfirm']
  }
);`
  );

  // Guardar el archivo optimizado
  fs.writeFileSync(schemaPath, content);
  
  console.log('✅ Schemas optimizados exitosamente!');
  console.log('\n📋 OPTIMIZACIONES APLICADAS:');
  console.log('  ✅ Schemas base reutilizables agregados');
  console.log('  ✅ Schemas de ID consolidados');
  console.log('  ✅ Schemas de paginación y fechas optimizados');
  console.log('  ✅ Schemas no utilizados eliminados');
  console.log('  ✅ Schemas complejos simplificados');
}

// Ejecutar optimización
if (require.main === module) {
  optimizeSchemas();
}

module.exports = { optimizeSchemas }; 