const fs = require('fs');
const path = require('path');

// Función para contar ocurrencias de schemas en archivos
function countSchemaUsage(directory, schemaNames) {
  const usage = {};
  schemaNames.forEach(name => usage[name] = 0);

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.git')) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          schemaNames.forEach(schemaName => {
            const regex = new RegExp(`\\b${schemaName}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
              usage[schemaName] += matches.length;
            }
          });
        } catch (error) {
          console.warn(`Error reading file ${filePath}:`, error.message);
        }
      }
    });
  }

  scanDirectory(directory);
  return usage;
}

// Función para analizar complejidad de schemas
function analyzeSchemaComplexity(schemaContent) {
  const lines = schemaContent.split('\n');
  const schemas = {};
  let currentSchema = null;
  let currentLines = 0;

  lines.forEach((line, index) => {
    const schemaMatch = line.match(/export const (\w+)Schema =/);
    if (schemaMatch) {
      if (currentSchema) {
        schemas[currentSchema] = {
          lines: currentLines,
          complexity: currentLines > 20 ? 'HIGH' : currentLines > 10 ? 'MEDIUM' : 'LOW'
        };
      }
      currentSchema = schemaMatch[1];
      currentLines = 1;
    } else if (currentSchema && line.trim()) {
      currentLines++;
    }
  });

  // Agregar el último schema
  if (currentSchema) {
    schemas[currentSchema] = {
      lines: currentLines,
      complexity: currentLines > 20 ? 'HIGH' : currentLines > 10 ? 'MEDIUM' : 'LOW'
    };
  }

  return schemas;
}

// Función para identificar schemas duplicados o similares
function findSimilarSchemas(schemaContent) {
  const schemas = {};
  const lines = schemaContent.split('\n');
  let currentSchema = null;
  let currentFields = [];

  lines.forEach(line => {
    const schemaMatch = line.match(/export const (\w+)Schema =/);
    if (schemaMatch) {
      if (currentSchema && currentFields.length > 0) {
        schemas[currentSchema] = [...currentFields];
      }
      currentSchema = schemaMatch[1];
      currentFields = [];
    } else if (currentSchema) {
      const fieldMatch = line.match(/(\w+):\s*z\./);
      if (fieldMatch) {
        currentFields.push(fieldMatch[1]);
      }
    }
  });

  // Agregar el último schema
  if (currentSchema && currentFields.length > 0) {
    schemas[currentSchema] = [...currentFields];
  }

  // Encontrar schemas similares
  const similar = [];
  const schemaNames = Object.keys(schemas);
  
  for (let i = 0; i < schemaNames.length; i++) {
    for (let j = i + 1; j < schemaNames.length; j++) {
      const schema1 = schemaNames[i];
      const schema2 = schemaNames[j];
      const fields1 = schemas[schema1];
      const fields2 = schemas[schema2];
      
      const commonFields = fields1.filter(field => fields2.includes(field));
      const similarity = commonFields.length / Math.max(fields1.length, fields2.length);
      
      if (similarity > 0.7) {
        similar.push({
          schema1,
          schema2,
          similarity: Math.round(similarity * 100),
          commonFields
        });
      }
    }
  }

  return similar;
}

// Función principal
function analyzeSchemas() {
  console.log('🔍 ANALIZANDO USO Y OPTIMIZACIÓN DE SCHEMAS\n');

  // Leer el archivo de schemas
  const schemaPath = path.join(__dirname, '..', 'schemas', 'validationSchemas.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Extraer nombres de schemas
  const schemaMatches = schemaContent.match(/export const (\w+)Schema =/g);
  const schemaNames = schemaMatches ? schemaMatches.map(match => match.replace('export const ', '').replace('Schema =', '')) : [];

  console.log(`📊 Total de schemas encontrados: ${schemaNames.length}\n`);

  // Analizar uso
  const usage = countSchemaUsage(path.join(__dirname, '..'), schemaNames);
  
  console.log('📈 USO DE SCHEMAS:');
  const sortedUsage = Object.entries(usage)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  sortedUsage.forEach(([schema, count]) => {
    console.log(`  ${schema}: ${count} usos`);
  });

  // Analizar complejidad
  const complexity = analyzeSchemaComplexity(schemaContent);
  
  console.log('\n🎯 COMPLEJIDAD DE SCHEMAS:');
  const highComplexity = Object.entries(complexity)
    .filter(([_, data]) => data.complexity === 'HIGH')
    .sort(([_, a], [__, b]) => b.lines - a.lines);

  if (highComplexity.length > 0) {
    console.log('  Schemas de alta complejidad:');
    highComplexity.forEach(([schema, data]) => {
      console.log(`    ${schema}: ${data.lines} líneas`);
    });
  } else {
    console.log('  ✅ No se encontraron schemas de alta complejidad');
  }

  // Encontrar schemas similares
  const similar = findSimilarSchemas(schemaContent);
  
  console.log('\n🔄 SCHEMAS SIMILARES:');
  if (similar.length > 0) {
    similar.forEach(({ schema1, schema2, similarity, commonFields }) => {
      console.log(`  ${schema1} ↔ ${schema2} (${similarity}% similar)`);
      console.log(`    Campos comunes: ${commonFields.join(', ')}`);
    });
  } else {
    console.log('  ✅ No se encontraron schemas similares');
  }

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES DE OPTIMIZACIÓN:');
  
  // Schemas no utilizados
  const unused = Object.entries(usage).filter(([_, count]) => count === 0);
  if (unused.length > 0) {
    console.log('  🗑️  Schemas no utilizados (considerar eliminar):');
    unused.forEach(([schema]) => console.log(`    - ${schema}`));
  }

  // Schemas de alta complejidad
  if (highComplexity.length > 0) {
    console.log('  🔧 Schemas de alta complejidad (considerar refactorizar):');
    highComplexity.forEach(([schema]) => console.log(`    - ${schema}`));
  }

  // Schemas similares
  if (similar.length > 0) {
    console.log('  🔄 Schemas similares (considerar consolidar):');
    similar.forEach(({ schema1, schema2 }) => {
      console.log(`    - ${schema1} y ${schema2}`);
    });
  }

  // Schemas más utilizados
  const mostUsed = sortedUsage.slice(0, 5);
  console.log('  ⚡ Schemas más utilizados (optimizar performance):');
  mostUsed.forEach(([schema, count]) => {
    console.log(`    - ${schema} (${count} usos)`);
  });

  console.log('\n📋 MÉTRICAS RESUMEN:');
  console.log(`  Total schemas: ${schemaNames.length}`);
  console.log(`  Schemas utilizados: ${sortedUsage.length}`);
  console.log(`  Schemas no utilizados: ${unused.length}`);
  console.log(`  Schemas de alta complejidad: ${highComplexity.length}`);
  console.log(`  Pares de schemas similares: ${similar.length}`);
}

// Ejecutar análisis
if (require.main === module) {
  analyzeSchemas();
}

module.exports = { analyzeSchemas }; 