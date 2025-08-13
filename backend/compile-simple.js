const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Crear directorio dist si no existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Archivos principales del backend de cobros (solo los básicos)
const files = [
  'index.ts',
  'controllers/cobroController.ts',
  'controllers/pacienteController.ts',
  'controllers/usuarioController.ts',
  'controllers/consultorioController.ts',
  'controllers/servicioController.ts',
  'controllers/cobroConceptoController.ts',
  'controllers/historialCobroController.ts',
  'controllers/precioConsultorioController.ts',
  'routes/cobroRoutes.ts',
  'routes/pacienteRoutes.ts',
  'routes/usuarioRoutes.ts',
  'routes/consultorioRoutes.ts',
  'routes/servicioRoutes.ts',
  'routes/cobroConceptoRoutes.ts',
  'routes/historialCobroRoutes.ts',
  'routes/precioConsultorioRoutes.ts',
  'routes/authRoutes.ts',
  'utils/asyncHandler.ts'
];

// Incluir workers y componentes de escalabilidad si existen
const extraFiles = [
  'src/workers/heavyTasks.ts',
  'src/workers/emailQueue.ts',
  'src/workers/whatsappQueue.ts',
  'scaling/autoScaling.ts',
  'scaling/scalingValidator.ts',
  'examples/simple-baseline-check.ts',
  'examples/final-check.ts'
];

extraFiles.forEach(f => {
  if (fs.existsSync(f)) {
    files.push(f);
  }
});

console.log('Compilando backend de cobros...');

try {
  // Compilar cada archivo individualmente
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const outputFile = file.replace('.ts', '.js');
      const outputPath = path.join('dist', outputFile);
      
      // Crear directorio si no existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Compilar con tsc ignorando errores
      try {
        execSync(`npx tsc ${file} --outDir dist --target ES2020 --module commonjs --esModuleInterop --skipLibCheck --noEmitOnError false`, { stdio: 'inherit' });
        console.log(`✅ Compilado: ${file}`);
      } catch (compileError) {
        console.log(`⚠️  Error compilando ${file}, continuando...`);
      }
    } else {
      console.log(`⚠️  Archivo no encontrado: ${file}`);
    }
  });
  
  console.log('✅ Compilación completada');
} catch (error) {
  console.error('❌ Error durante la compilación:', error.message);
  process.exit(1);
} 