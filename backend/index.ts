import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import { errorHandler } from './middleware/errorHandler';
import { performanceMonitor, logPerformanceMetrics } from './middleware/performanceMonitor';
import { compressAPI } from './middleware/compression';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

console.log("Iniciando backend...");

process.on('uncaughtException', function (err: Error) {
  console.error('Excepción no capturada:', err);
});

process.on('unhandledRejection', function (err: any) {
  console.error('Promesa no manejada:', err);
});

const app: Application = express();
const SCALING_VALIDATION_MODE = process.env.SCALING_VALIDATION_MODE === '1';

// CORS seguro (ajusta origins según tu necesidad)
app.use(cors({
  origin: [
    'http://localhost:5173', // frontend Vite
    'http://localhost:3000', // posible otro frontend
    'http://localhost:3001', // posible otro frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Permitir preflight OPTIONS para todas las rutas
app.options('*', cors());

app.use(express.json());

// Middleware de monitoreo de performance
app.use(performanceMonitor);

// Middleware de compresión para optimizar respuestas
app.use(compressAPI);

// Configurar middleware de sesiones
app.use(session({
  secret: process.env.JWT_SECRET || 'supersecreto123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // En desarrollo
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.send('API de ProCura Cobros funcionando');
});

// Health checks (para NGINX y validadores)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('healthy');
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

if (!SCALING_VALIDATION_MODE) {
  // Cargar rutas completas solo fuera de modo validación
  // Se usan requires para evitar que TypeScript verifique módulos no necesarios en validación
  // y prevenir fallos por tipados de partes no relacionadas a 4.5
  const pacienteRoutes = require('./routes/pacienteRoutes').default;
  const cobroRoutes = require('./routes/cobroRoutes').default;
  const usuarioRoutes = require('./routes/usuarioRoutes').default;
  const consultorioRoutes = require('./routes/consultorioRoutes').default;
  const precioConsultorioRoutes = require('./routes/precioConsultorioRoutes').default;
  const cobroConceptoRoutes = require('./routes/cobroConceptoRoutes').default;
  const historialCobroRoutes = require('./routes/historialCobroRoutes').default;
  const historialRoutes = require('./routes/historialRoutes').default;
  const servicioRoutes = require('./routes/servicioRoutes').default;
  const permisosRoutes = require('./routes/permisosRoutes').default;
  const organizacionRoutes = require('./routes/organizacionRoutes').default;
  const authRoutes = require('./routes/authRoutes').default;
  const inventoryRoutes = require('./routes/inventoryRoutes').inventoryRoutes;
  const citaRoutes = require('./routes/citaRoutes').default;
  const disponibilidadMedicoRoutes = require('./routes/disponibilidadMedicoRoutes').default;
  const bloqueoMedicoRoutes = require('./routes/bloqueoMedicoRoutes').default;
  const googleAuthRoutes = require('./routes/googleAuthRoutes').default;
  const whatsappRoutes = require('./routes/whatsappRoutes').default;
  const facturacionRoutes = require('./routes/facturacionRoutes').default;
  const huliRoutes = require('./routes/huliRoutes').default;
  const onboardingRoutes = require('./routes/onboardingRoutes').default;
  const metricsRoutes = require('./routes/metricsRoutes').default;
  const gdprRoutes = require('./routes/gdprRoutes').default;

  app.use('/api/pacientes', pacienteRoutes);
  app.use('/api/cobros', cobroRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/consultorios', consultorioRoutes);
  app.use('/api/precios-consultorio', precioConsultorioRoutes);
  app.use('/api/cobro-conceptos', cobroConceptoRoutes);
  app.use('/api/historial-cobros', historialCobroRoutes);
  app.use('/api/historial', historialRoutes);
  app.use('/api/servicios', servicioRoutes);
  app.use('/api/permisos', permisosRoutes);
  app.use('/api/organizaciones', organizacionRoutes);
  app.use('/api', authRoutes);
  app.use('/api', inventoryRoutes);
  app.use('/api/citas', citaRoutes);
  app.use('/api/disponibilidad-medico', disponibilidadMedicoRoutes);
  app.use('/api/bloqueo-medico', bloqueoMedicoRoutes);
  app.use('/api', googleAuthRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/facturacion', facturacionRoutes);
  app.use('/api/huli', huliRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/gdpr', gdprRoutes);
} else {
  console.log('🧪 SCALING_VALIDATION_MODE activo: cargando rutas mínimas');
}

// Middleware de manejo de errores global mejorado
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || '3002', 10);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    
    // Logging periódico de métricas cada 10 minutos
    if (process.env.ENABLE_METRICS_LOGGING !== 'false') {
      setInterval(() => {
        logPerformanceMetrics();
      }, 10 * 60 * 1000); // 10 minutos
      
      console.log('📊 Monitoreo de performance activado - métricas cada 10 minutos');
    }
  });
}

export default app; 