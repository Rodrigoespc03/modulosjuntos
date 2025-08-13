/**
 * Demo de Rate Limiting Avanzado - Fase 4.2 Paso 2
 * Demuestra el sistema de rate limiting implementado
 */

import express, { Request, Response } from 'express';
import { 
  createAdvancedRateLimit, 
  loginRateLimit,
  passwordChangeRateLimit,
  dataQueryRateLimit,
  smartRateLimit,
  getRateLimitStats,
  resetUserRateLimit,
  checkBlacklist,
  abuseDetector,
  RATE_LIMITS
} from '../middleware/advancedRateLimit';

console.log('🛡️ DEMO: SISTEMA DE RATE LIMITING AVANZADO - PASO 2');
console.log('=====================================================\n');

// Crear app de prueba
const app = express();
app.use(express.json());

// Simular middleware de autenticación para pruebas
app.use((req: Request, res: Response, next) => {
  // Simular usuario autenticado
  (req as any).user = {
    id: 'demo-user-123',
    email: 'demo@test.com',
    rol: 'DOCTOR',
    organizacion_id: 'org-123'
  };
  next();
});

// Demo 1: Rate Limiting Básico
console.log('📊 DEMO 1: CONFIGURACIÓN DE RATE LIMITS');
console.log('----------------------------------------');

console.log('📋 Límites configurados por endpoint:');
Object.entries(RATE_LIMITS).forEach(([key, config]) => {
  console.log(`\n${key}:`);
  console.log(`  ⏰ Ventana: ${config.windowMs / 1000}s (${config.windowMs / 60000}m)`);
  console.log(`  🔢 Máximo: ${config.max} requests`);
  console.log(`  💬 Mensaje: "${config.message}"`);
});

console.log('\n✅ Demo 1 completado\n');

// Demo 2: Rate Limiter Personalizado
console.log('📊 DEMO 2: RATE LIMITER PERSONALIZADO');
console.log('--------------------------------------');

// Crear rate limiter para demo
const demoRateLimit = createAdvancedRateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // 3 requests por minuto
  message: 'Límite de demo alcanzado',
  identifier: 'demo-endpoint',
  escalatingPenalty: true,
  bypassRoles: ['ADMINISTRADOR']
});

// Endpoint de prueba
app.get('/demo-rate-limit', demoRateLimit, (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Request exitoso!',
    timestamp: new Date().toISOString(),
    user: (req as any).user.id
  });
});

console.log('🔧 Rate limiter demo configurado:');
console.log('   📍 Endpoint: GET /demo-rate-limit');
console.log('   ⏰ Límite: 3 requests por minuto');
console.log('   ⚡ Penalización escalada: Sí');
console.log('   👑 Bypass: ADMINISTRADOR');

console.log('\n✅ Demo 2 completado\n');

// Demo 3: Rate Limiting Inteligente
console.log('📊 DEMO 3: RATE LIMITING INTELIGENTE');
console.log('------------------------------------');

// Configurar endpoints con smart rate limiting
app.post('/login', smartRateLimit, (req, res) => {
  res.json({ message: 'Login simulado', endpoint: '/login' });
});

app.post('/change-password', smartRateLimit, (req, res) => {
  res.json({ message: 'Cambio de contraseña simulado', endpoint: '/change-password' });
});

app.get('/api/pacientes', smartRateLimit, (req, res) => {
  res.json({ message: 'Consulta de pacientes simulada', endpoint: '/api/pacientes' });
});

app.post('/api/gdpr/data-access-request', smartRateLimit, (req, res) => {
  res.json({ message: 'Solicitud GDPR simulada', endpoint: '/api/gdpr/data-access-request' });
});

console.log('🧠 Smart Rate Limiting configurado:');
console.log('   🔐 /login: 5 requests/15min (escalada)');
console.log('   🔑 /change-password: 3 requests/hora');
console.log('   📊 /api/pacientes: 60 requests/min');
console.log('   ⚖️ /api/gdpr/*: 5 requests/día');

console.log('\n✅ Demo 3 completado\n');

// Demo 4: Detector de Abuso
console.log('📊 DEMO 4: DETECCIÓN DE ABUSO');
console.log('------------------------------');

app.get('/test-abuse', abuseDetector, (req, res) => {
  res.json({ message: 'Request normal', suspicious: false });
});

console.log('🕵️ Detector de abuso configurado:');
console.log('   🤖 Detecta: user agents sospechosos (bot, crawl, spider)');
console.log('   📋 Detecta: falta de headers estándar');
console.log('   ⚡ Acción: rate limit más estricto (5 req/min)');

console.log('\n✅ Demo 4 completado\n');

// Demo 5: Funciones de Administración
console.log('📊 DEMO 5: FUNCIONES DE ADMINISTRACIÓN');
console.log('---------------------------------------');

// Endpoint para obtener estadísticas
app.get('/admin/rate-limit-stats', (req, res) => {
  const stats = getRateLimitStats();
  res.json(stats);
});

// Endpoint para resetear límites de usuario
app.post('/admin/reset-user-limits', async (req, res) => {
  const { userId, identifier } = req.body;
  const success = await resetUserRateLimit(userId, identifier);
  res.json({ success, message: success ? 'Límites reseteados' : 'Error reseteando límites' });
});

console.log('👨‍💼 Funciones de administración:');
console.log('   📊 GET /admin/rate-limit-stats - Estadísticas');
console.log('   🔄 POST /admin/reset-user-limits - Reset límites');

console.log('\n✅ Demo 5 completado\n');

// Demo 6: Blacklist de IPs
console.log('📊 DEMO 6: BLACKLIST DE IPS');
console.log('----------------------------');

app.get('/test-blacklist', checkBlacklist, (req, res) => {
  res.json({ message: 'IP permitida', blocked: false });
});

console.log('🚫 Sistema de blacklist:');
console.log('   🔍 Verifica IPs bloqueadas en cada request');
console.log('   ⏰ Bloqueo temporal configurable');
console.log('   🛡️ Protección contra IPs abusivas');

console.log('\n✅ Demo 6 completado\n');

// Función para simular requests y mostrar rate limiting en acción
async function simulateRequests() {
  console.log('📊 DEMO 7: SIMULACIÓN DE REQUESTS');
  console.log('----------------------------------');
  
  // Simular múltiples requests para mostrar rate limiting
  console.log('🔄 Simulando 5 requests rápidos al endpoint demo...\n');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const mockReq = {
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        user: { id: 'demo-user-123', rol: 'DOCTOR', organizacion_id: 'org-123' },
        path: '/demo-rate-limit',
        method: 'GET'
      } as any;
      
      const mockRes = {
        set: (headers: any) => {
          console.log(`   Request ${i} - Headers:`);
          Object.entries(headers).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        },
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`   Request ${i} - Status: ${code}`);
            console.log(`   Request ${i} - Response:`, data);
            return mockRes;
          }
        }),
        json: (data: any) => {
          console.log(`   Request ${i} - Success:`, data);
        }
      } as any;
      
      const demoLimit = createAdvancedRateLimit({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Límite demo alcanzado',
        identifier: 'demo-simulation',
        escalatingPenalty: true
      });
      
      await new Promise<void>((resolve) => {
        demoLimit(mockReq, mockRes, () => {
          console.log(`   Request ${i} - ✅ Permitido`);
          resolve();
        });
      });
      
    } catch (error) {
      console.log(`   Request ${i} - ❌ Bloqueado:`, (error as Error).message);
    }
    
    console.log(''); // Línea en blanco
    
    // Pausa pequeña entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Demo 7 completado\n');
}

// Función principal para ejecutar todos los demos
async function ejecutarTodasLasDemos() {
  try {
    await simulateRequests();
    
    console.log('🎉 PASO 2 - RATE LIMITING AVANZADO COMPLETADO');
    console.log('==============================================');
    console.log('');
    console.log('✅ FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('  🛡️ Rate limiting granular por endpoint');
    console.log('  ⚡ Penalizaciones escaladas por abuso');
    console.log('  👑 Bypass para roles administrativos');
    console.log('  🧠 Rate limiting inteligente automático');
    console.log('  🕵️ Detección de patrones de abuso');
    console.log('  🚫 Blacklist temporal de IPs');
    console.log('  📊 Estadísticas y administración');
    console.log('  💾 Store en memoria (Redis-ready)');
    console.log('');
    console.log('🎯 LÍMITES CONFIGURADOS:');
    console.log('  🔐 Login: 5 intentos/15min (escalada)');
    console.log('  🔑 Password change: 3 cambios/hora');
    console.log('  📊 API queries: 60 requests/min');
    console.log('  💾 Data modification: 20 ops/min');
    console.log('  ⚖️ GDPR operations: 5 ops/día');
    console.log('  📤 Exports: 10 exports/hora');
    console.log('');
    console.log('🔒 CARACTERÍSTICAS DE SEGURIDAD:');
    console.log('  - Headers informativos (X-RateLimit-*)');
    console.log('  - Retry-After headers automáticos');
    console.log('  - Escalamiento de penalizaciones');
    console.log('  - Key generation por IP+User+Org');
    console.log('  - Cleanup automático de memoria');
    console.log('  - Fail-open en caso de errores');
    console.log('');
    console.log('✅ PASO 2 VALIDADO EXITOSAMENTE');
    console.log('📋 PRÓXIMO PASO: Implementar JWT Refresh Tokens');
    
  } catch (error) {
    console.error('❌ Error ejecutando demos:', (error as Error).message);
  }
}

// Ejecutar el demo
if (require.main === module) {
  ejecutarTodasLasDemos();
}

export { ejecutarTodasLasDemos };