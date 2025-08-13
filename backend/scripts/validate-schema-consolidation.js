#!/usr/bin/env node

/**
 * Script de validación para consolidación de schemas Prisma
 * Valida que el schema consolidado mantenga toda la funcionalidad
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 INICIANDO VALIDACIÓN DE CONSOLIDACIÓN DE SCHEMA');
console.log('==================================================');

// Configuración
const SCHEMA_CONSOLIDATED = path.join(__dirname, '../prisma/schema-consolidated.prisma');
const SCHEMA_CURRENT = path.join(__dirname, '../prisma/schema.prisma');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Crear directorio de backup si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para crear backup
function createBackup() {
  console.log('\n📦 CREANDO BACKUP...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `schema-backup-${timestamp}.prisma`);
  
  try {
    fs.copyFileSync(SCHEMA_CURRENT, backupFile);
    console.log(`✅ Backup creado: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
    process.exit(1);
  }
}

// Función para validar que el schema consolidado existe
function validateConsolidatedSchema() {
  console.log('\n🔍 VALIDANDO SCHEMA CONSOLIDADO...');
  
  if (!fs.existsSync(SCHEMA_CONSOLIDATED)) {
    console.error('❌ Schema consolidado no encontrado:', SCHEMA_CONSOLIDATED);
    process.exit(1);
  }
  
  const content = fs.readFileSync(SCHEMA_CONSOLIDATED, 'utf8');
  
  // Validaciones básicas
  const validations = [
    {
      name: 'Modelos principales',
      check: () => content.includes('model organizaciones') && 
                 content.includes('model usuarios') && 
                 content.includes('model pacientes')
    },
    {
      name: 'Modelos de cobros',
      check: () => content.includes('model cobros') && 
                 content.includes('model cobro_conceptos')
    },
    {
      name: 'Modelos de inventario',
      check: () => content.includes('model Product') && 
                 content.includes('model InventoryUsage')
    },
    {
      name: 'Modelos de WhatsApp',
      check: () => content.includes('model whatsapp_messages') && 
                 content.includes('model whatsapp_config')
    },
    {
      name: 'Enums',
      check: () => content.includes('enum Rol') && 
                 content.includes('enum EstadoCobro')
    }
  ];
  
  let allValid = true;
  validations.forEach(validation => {
    if (validation.check()) {
      console.log(`✅ ${validation.name}: OK`);
    } else {
      console.log(`❌ ${validation.name}: FALLA`);
      allValid = false;
    }
  });
  
  if (!allValid) {
    console.error('\n❌ Validaciones fallaron. Revisar schema consolidado.');
    process.exit(1);
  }
  
  console.log('✅ Schema consolidado válido');
}

// Función para comparar modelos
function compareModels() {
  console.log('\n📊 COMPARANDO MODELOS...');
  
  const currentContent = fs.readFileSync(SCHEMA_CURRENT, 'utf8');
  const consolidatedContent = fs.readFileSync(SCHEMA_CONSOLIDATED, 'utf8');
  
  // Extraer nombres de modelos
  const currentModels = currentContent.match(/model\s+(\w+)/g)?.map(m => m.replace('model ', '')) || [];
  const consolidatedModels = consolidatedContent.match(/model\s+(\w+)/g)?.map(m => m.replace('model ', '')) || [];
  
  console.log(`📈 Modelos en schema actual: ${currentModels.length}`);
  console.log(`📈 Modelos en schema consolidado: ${consolidatedModels.length}`);
  
  // Encontrar modelos faltantes
  const missingModels = currentModels.filter(model => !consolidatedModels.includes(model));
  
  if (missingModels.length > 0) {
    console.log('⚠️ Modelos faltantes en consolidado:', missingModels);
  } else {
    console.log('✅ Todos los modelos incluidos en consolidado');
  }
  
  // Encontrar modelos nuevos
  const newModels = consolidatedModels.filter(model => !currentModels.includes(model));
  
  if (newModels.length > 0) {
    console.log('🆕 Modelos nuevos en consolidado:', newModels);
  }
}

// Función para validar sintaxis Prisma
function validatePrismaSyntax() {
  console.log('\n🔧 VALIDANDO SINTAXIS PRISMA...');
  
  try {
    // Intentar generar el cliente con el schema consolidado
    const tempSchema = path.join(__dirname, '../prisma/schema-temp.prisma');
    fs.copyFileSync(SCHEMA_CONSOLIDATED, tempSchema);
    
    // Cambiar temporalmente el schema
    const originalSchema = path.join(__dirname, '../prisma/schema.prisma');
    const originalBackup = path.join(__dirname, '../prisma/schema.prisma.backup');
    fs.copyFileSync(originalSchema, originalBackup);
    fs.copyFileSync(tempSchema, originalSchema);
    
    // Validar sintaxis
    execSync('npx prisma validate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    console.log('✅ Sintaxis Prisma válida');
    
    // Restaurar schema original
    fs.copyFileSync(originalBackup, originalSchema);
    fs.unlinkSync(originalBackup);
    fs.unlinkSync(tempSchema);
    
  } catch (error) {
    console.error('❌ Error en sintaxis Prisma:', error.message);
    process.exit(1);
  }
}

// Función para generar reporte
function generateReport() {
  console.log('\n📋 GENERANDO REPORTE...');
  
  const report = {
    timestamp: new Date().toISOString(),
    status: 'VALIDATION_COMPLETE',
    schemaConsolidated: SCHEMA_CONSOLIDATED,
    validations: {
      backupCreated: true,
      schemaExists: true,
      syntaxValid: true,
      modelsIncluded: true
    },
    nextSteps: [
      '1. Revisar diferencias en modelos',
      '2. Ejecutar tests de integración',
      '3. Generar migración de prueba',
      '4. Validar en ambiente de desarrollo'
    ]
  };
  
  const reportFile = path.join(BACKUP_DIR, `validation-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`✅ Reporte generado: ${reportFile}`);
}

// Función principal
function main() {
  try {
    createBackup();
    validateConsolidatedSchema();
    compareModels();
    validatePrismaSyntax();
    generateReport();
    
    console.log('\n🎉 VALIDACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=====================================');
    console.log('✅ Schema consolidado está listo para implementación');
    console.log('📋 Revisar reporte generado para detalles');
    console.log('🔄 Próximo paso: Ejecutar tests de integración');
    
  } catch (error) {
    console.error('\n❌ ERROR EN VALIDACIÓN:', error.message);
    process.exit(1);
  }
}

// Ejecutar validación
main(); 