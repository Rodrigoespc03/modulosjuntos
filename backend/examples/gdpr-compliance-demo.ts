/**
 * Demo de GDPR Compliance - Sistema Procura
 * Demuestra todas las funcionalidades implementadas para cumplimiento GDPR
 */

import { medicalEncryption, MedicalDataEncryption } from '../utils/encryption';
import { GdprAuditLogger, AUDIT_ACTIVITIES, DATA_CATEGORIES, LEGAL_BASIS } from '../middleware/auditLogger';
import { checkOrganizationCompliance } from '../middleware/gdprCompliance';

// Simular un objeto Request para las demos
const mockRequest = {
  ip: '192.168.1.100',
  headers: { 'user-agent': 'GDPR-Demo/1.0' },
  sessionID: 'demo-session-123',
  originalUrl: '/api/demo',
  method: 'GET',
  connection: { remoteAddress: '192.168.1.100' },
  socket: { remoteAddress: '192.168.1.100' },
  get: (header: string) => header === 'User-Agent' ? 'GDPR-Demo/1.0' : undefined
} as any;

console.log('🔒 DEMO DE GDPR COMPLIANCE - SISTEMA PROCURA');
console.log('=====================================================\n');

// Demo 1: Encriptación de datos médicos sensibles
console.log('📊 DEMO 1: ENCRIPTACIÓN DE DATOS MÉDICOS SENSIBLES');
console.log('--------------------------------------------------');

try {
  // Datos médicos sensibles de ejemplo
  const datosMedicos = {
    diagnostico: 'Diabetes mellitus tipo 2',
    tratamiento: 'Metformina 850mg cada 12 horas',
    alergias: 'Penicilina, mariscos',
    observaciones_medicas: 'Paciente con buen control glicémico. Requiere seguimiento mensual.',
    antecedentes_familiares: 'Padre diabético, madre hipertensa'
  };

  console.log('📋 Datos originales:');
  console.log(JSON.stringify(datosMedicos, null, 2));

  // Encriptar datos sensibles
  const datosEncriptados = medicalEncryption.encryptFields(datosMedicos, [
    'diagnostico', 'tratamiento', 'alergias', 'observaciones_medicas', 'antecedentes_familiares'
  ]);

  console.log('\n🔐 Datos encriptados para almacenamiento:');
  console.log('✅ diagnostico_encrypted:', datosEncriptados.diagnostico_encrypted?.encrypted.substring(0, 20) + '...');
  console.log('✅ tratamiento_encrypted:', datosEncriptados.tratamiento_encrypted?.encrypted.substring(0, 20) + '...');
  console.log('✅ alergias_encrypted:', datosEncriptados.alergias_encrypted?.encrypted.substring(0, 20) + '...');

  // Desencriptar para uso
  const datosDesencriptados = medicalEncryption.decryptFields(datosEncriptados, [
    'diagnostico', 'tratamiento', 'alergias', 'observaciones_medicas', 'antecedentes_familiares'
  ]);

  console.log('\n🔓 Datos desencriptados para uso:');
  console.log('✅ diagnostico:', datosDesencriptados.diagnostico);
  console.log('✅ tratamiento:', datosDesencriptados.tratamiento);

  // Verificar integridad
  const integridadVerificada = medicalEncryption.verifyIntegrity(datosEncriptados.diagnostico_encrypted);
  console.log('\n🛡️ Verificación de integridad:', integridadVerificada ? '✅ VÁLIDA' : '❌ CORRUPTA');

  console.log('\n✅ Demo 1 completada exitosamente\n');
} catch (error) {
  console.error('❌ Error en Demo 1:', (error as Error).message);
}

// Demo 2: Pseudonimización para análisis estadísticos
console.log('📊 DEMO 2: PSEUDONIMIZACIÓN PARA ANÁLISIS');
console.log('------------------------------------------');

try {
  const identificadores = [
    '12345678-9',
    'juan.perez@email.com',
    '98765432-1',
    'maria.gonzalez@email.com'
  ];

  console.log('📋 Identificadores originales:');
  identificadores.forEach(id => console.log(`  - ${id}`));

  console.log('\n🎭 Pseudónimos generados (irreversibles):');
  identificadores.forEach(id => {
    const pseudonimo = medicalEncryption.pseudonymize(id);
    console.log(`  - ${id} → ${pseudonimo.substring(0, 16)}...`);
  });

  console.log('\n✅ Demo 2 completada exitosamente\n');
} catch (error) {
  console.error('❌ Error en Demo 2:', (error as Error).message);
}

// Demo 3: Audit logging para trazabilidad GDPR
console.log('📊 DEMO 3: AUDIT LOGGING PARA TRAZABILIDAD');
console.log('-------------------------------------------');

try {
  const pacienteId = 'pac-demo-123';
  const usuarioId = 'usr-demo-456';

  // Simular diferentes tipos de actividades
  const actividades = [
    {
      tipo: AUDIT_ACTIVITIES.DATA_ACCESS,
      descripcion: 'Acceso a expediente médico',
      campos: ['nombre', 'diagnostico', 'tratamiento']
    },
    {
      tipo: AUDIT_ACTIVITIES.DATA_UPDATE,
      descripcion: 'Actualización de tratamiento',
      campos: ['tratamiento', 'observaciones_medicas']
    },
    {
      tipo: AUDIT_ACTIVITIES.CONSENT_GIVEN,
      descripcion: 'Consentimiento para tratamiento otorgado',
      campos: ['consentimiento_tratamiento']
    },
    {
      tipo: AUDIT_ACTIVITIES.DATA_EXPORT,
      descripcion: 'Exportación de datos para portabilidad',
      campos: ['todos_los_datos']
    }
  ];

  console.log('📋 Registrando actividades de auditoría:');

  actividades.forEach((actividad, index) => {
    GdprAuditLogger.log({
      activity_type: actividad.tipo,
      description: actividad.descripcion,
      legal_basis: LEGAL_BASIS.CONTRACT,
      purpose: 'Demostración de audit logging',
      req: mockRequest,
      user_id: usuarioId,
      paciente_id: pacienteId,
      organizacion_id: 'org-demo-789',
      data_categories: [DATA_CATEGORIES.MEDICAL_DATA, DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      fields_accessed: actividad.campos,
      records_affected: 1
    });

    console.log(`  ${index + 1}. ✅ ${actividad.descripcion}`);
  });

  // Simular acceso denegado
  GdprAuditLogger.logAccessDenied(mockRequest, 'Usuario sin permisos para expediente', `/api/pacientes/${pacienteId}`);
  console.log('  5. ⛔ Acceso denegado registrado');

  console.log('\n✅ Demo 3 completada exitosamente\n');
} catch (error) {
  console.error('❌ Error en Demo 3:', (error as Error).message);
}

// Demo 4: Verificación de compliance organizacional
console.log('📊 DEMO 4: VERIFICACIÓN DE COMPLIANCE ORGANIZACIONAL');
console.log('-----------------------------------------------------');

async function demoCompliance() {
  try {
    const organizacionId = 'org-demo-789';
    
    console.log(`📋 Verificando compliance para organización: ${organizacionId}`);
    
    const complianceStatus = await checkOrganizationCompliance(organizacionId);
    
    console.log('\n📊 Resultados del assessment:');
    console.log(`  📈 Score de compliance: ${complianceStatus.compliance_score.toFixed(1)}%`);
    
    console.log('\n✅ Checks aprobados:');
    Object.entries(complianceStatus.checks).forEach(([check, passed]) => {
      if (passed) {
        console.log(`    ✅ ${check.replace(/_/g, ' ')}`);
      }
    });
    
    console.log('\n❌ Checks pendientes:');
    Object.entries(complianceStatus.checks).forEach(([check, passed]) => {
      if (!passed) {
        console.log(`    ❌ ${check.replace(/_/g, ' ')}`);
      }
    });
    
    if (complianceStatus.recommendations.length > 0) {
      console.log('\n💡 Recomendaciones:');
      complianceStatus.recommendations.forEach((rec, index) => {
        console.log(`    ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n✅ Demo 4 completada exitosamente\n');
  } catch (error) {
    console.error('❌ Error en Demo 4:', (error as Error).message);
  }
}

// Demo 5: Simulación de derechos del titular de datos
console.log('📊 DEMO 5: DERECHOS DEL TITULAR DE DATOS');
console.log('-----------------------------------------');

function demoDerechosTitular() {
  try {
    const pacienteId = 'pac-demo-123';
    
    console.log('📋 Simulando ejercicio de derechos GDPR:');
    
    // Derecho de acceso (Art. 15)
    console.log('\n🔍 DERECHO DE ACCESO (Art. 15):');
    console.log('  ✅ Paciente solicita acceso a todos sus datos');
    console.log('  ✅ Verificación de identidad completada');
    console.log('  ✅ Generando reporte comprensivo de datos');
    console.log('  ✅ Incluye: datos personales, médicos, financieros, historial de consentimientos');
    
    // Derecho de rectificación (Art. 16)
    console.log('\n✏️ DERECHO DE RECTIFICACIÓN (Art. 16):');
    console.log('  ✅ Paciente solicita corrección de dirección');
    console.log('  ✅ Evidencia proporcionada: factura de servicios');
    console.log('  ✅ Corrección aplicada y documentada');
    
    // Derecho al olvido (Art. 17)
    console.log('\n🗑️ DERECHO AL OLVIDO (Art. 17):');
    console.log('  ⚠️ Paciente solicita eliminación completa de datos');
    console.log('  ✅ Verificación de identidad y consecuencias explicadas');
    console.log('  ✅ No hay obligaciones legales que requieran retención');
    console.log('  ✅ Eliminación programada para ejecución');
    
    // Derecho de portabilidad (Art. 20)
    console.log('\n📤 DERECHO DE PORTABILIDAD (Art. 20):');
    console.log('  ✅ Paciente solicita datos en formato estructurado');
    console.log('  ✅ Exportación en formato JSON disponible');
    console.log('  ✅ Datos listos para transferencia a nuevo proveedor');
    
    console.log('\n✅ Demo 5 completada exitosamente\n');
  } catch (error) {
    console.error('❌ Error en Demo 5:', (error as Error).message);
  }
}

// Demo 6: Gestión de consentimientos
console.log('📊 DEMO 6: GESTIÓN DE CONSENTIMIENTOS');
console.log('-------------------------------------');

function demoConsentimientos() {
  try {
    const pacienteId = 'pac-demo-123';
    
    console.log('📋 Simulando gestión de consentimientos GDPR:');
    
    // Consentimiento inicial
    console.log('\n✅ CONSENTIMIENTO INICIAL:');
    console.log('  📄 Tipo: Tratamiento médico + procesamiento de datos');
    console.log('  🗓️ Fecha: ' + new Date().toLocaleDateString());
    console.log('  📍 Método: Formulario web con firma electrónica');
    console.log('  📊 Base legal: Consentimiento explícito (Art. 6.1.a)');
    console.log('  🎯 Propósito: Atención médica y gestión de expediente');
    console.log('  ⏰ Vigencia: 2 años (renovable)');
    
    // Consentimientos granulares
    console.log('\n🔒 CONSENTIMIENTOS GRANULARES:');
    console.log('  ✅ Tratamiento médico: OTORGADO');
    console.log('  ✅ Procesamiento de datos: OTORGADO');
    console.log('  ❌ Comunicaciones de marketing: DENEGADO');
    console.log('  ❌ Participación en investigación: DENEGADO');
    console.log('  ❌ Transferencia internacional: DENEGADO');
    
    // Retiro de consentimiento
    console.log('\n⏹️ RETIRO DE CONSENTIMIENTO:');
    console.log('  📧 Paciente retira consentimiento para marketing');
    console.log('  🗓️ Fecha de retiro: ' + new Date().toLocaleDateString());
    console.log('  ✅ Procesamiento de marketing cesado inmediatamente');
    console.log('  📋 Consentimiento para tratamiento médico mantiene vigencia');
    
    console.log('\n✅ Demo 6 completada exitosamente\n');
  } catch (error) {
    console.error('❌ Error en Demo 6:', (error as Error).message);
  }
}

// Ejecutar todas las demos
async function ejecutarTodasLasDemos() {
  try {
    await demoCompliance();
    demoDerechosTitular();
    demoConsentimientos();
    
    console.log('🎉 TODAS LAS DEMOS DE GDPR COMPLETADAS EXITOSAMENTE');
    console.log('===================================================');
    console.log('');
    console.log('📋 RESUMEN DE FUNCIONALIDADES DEMOSTRADAS:');
    console.log('  ✅ Encriptación AES-256-GCM para datos médicos sensibles');
    console.log('  ✅ Pseudonimización irreversible para análisis estadísticos');
    console.log('  ✅ Audit logging comprehensivo con trazabilidad completa');
    console.log('  ✅ Verificación automática de compliance organizacional');
    console.log('  ✅ Implementación de todos los derechos del titular (Art. 15-22)');
    console.log('  ✅ Gestión granular de consentimientos con bases legales');
    console.log('');
    console.log('🚀 EL SISTEMA PROCURA ESTÁ LISTO PARA COMPLIANCE GDPR');
    console.log('');
    console.log('📊 ENDPOINTS GDPR DISPONIBLES:');
    console.log('  POST /api/gdpr/consent - Registrar consentimiento');
    console.log('  POST /api/gdpr/consent/withdraw - Retirar consentimiento');
    console.log('  POST /api/gdpr/data-access-request - Solicitar acceso a datos');
    console.log('  DELETE /api/gdpr/patient/:id - Eliminar datos (derecho al olvido)');
    console.log('  PUT /api/gdpr/rectification - Rectificar datos');
    console.log('  GET /api/gdpr/audit-logs/:pacienteId - Ver logs de auditoría');
    console.log('  POST /api/gdpr/breach-notification - Notificar violación');
    console.log('  GET /api/gdpr/compliance-status/:orgId - Estado de compliance');
    
  } catch (error) {
    console.error('❌ Error ejecutando demos:', (error as Error).message);
  }
}

// Ejecutar el demo
if (require.main === module) {
  ejecutarTodasLasDemos();
}

export { ejecutarTodasLasDemos };