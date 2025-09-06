import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log("Iniciando backend...");

const app: Application = express();
const prisma = new PrismaClient();

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Middleware de logging simplificado
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.send('API de ProCura Cobros funcionando');
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('healthy');
});

console.log('🔄 Cargando rutas...');

try {
  // Cargar rutas esenciales
  const authRoutes = require('./routes/authRoutes').default;
  const facturacionRoutes = require('./routes/facturacionRoutes').default;
  const whatsappRoutes = require('./routes/whatsappRoutes').default;
  const historialRoutes = require('./routes/historialRoutes').default;
  const notificationRoutes = require('./routes/notificationRoutes').default;
  
  console.log('✅ Rutas cargadas correctamente');
  
  // Registrar authRoutes
  app.use('/api', authRoutes);
  console.log('   ✅ Ruta /api registrada con authRoutes');
  
  // Registrar rutas de facturación
  app.use('/api/facturacion', facturacionRoutes);
  console.log('   ✅ Ruta /api/facturacion registrada con facturacionRoutes');
  
  // Registrar rutas de WhatsApp
  app.use('/api/whatsapp', whatsappRoutes);
  console.log('   ✅ Ruta /api/whatsapp registrada con whatsappRoutes');
  
  // Registrar rutas de historial
  app.use('/api/historial', historialRoutes);
  console.log('   ✅ Ruta /api/historial registrada con historialRoutes');
  
  // Registrar rutas de notificaciones
  app.use('/api/notifications', notificationRoutes);
  console.log('   ✅ Ruta /api/notifications registrada con notificationRoutes');
  
  // Agregar rutas básicas para testing
  app.get('/api/test', (req: Request, res: Response) => {
    res.json({ message: 'API funcionando correctamente' });
  });
  
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({ 
      status: 'running',
      timestamp: new Date().toISOString(),
      routes: ['/api/login', '/api/me', '/api/logout', '/api/test', '/api/status', '/api/facturacion', '/api/whatsapp', '/api/historial']
    });
  });
  
  // RUTAS BÁSICAS PARA EL FRONTEND
  // GET /api/pacientes - Lista de pacientes
  app.get('/api/pacientes', async (req: Request, res: Response) => {
    try {
      const pacientes = await prisma.$queryRaw`
        SELECT id, nombre, apellido, email, telefono, fecha_nacimiento, genero, direccion, documento_identidad, created_at, organizacion_id
        FROM pacientes 
        ORDER BY nombre
      `;
      res.json({ success: true, data: pacientes });
    } catch (error) {
      console.error('Error en /api/pacientes:', error);
      res.status(500).json({ error: 'Error obteniendo pacientes', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });

  // POST /api/pacientes - Crear nuevo paciente
  app.post('/api/pacientes', async (req: Request, res: Response) => {
    try {
      const { nombre, apellido, email, telefono, fecha_nacimiento, genero, direccion, documento_identidad } = req.body;
      
      // Validar campos requeridos
      if (!nombre || !apellido || !genero) {
        return res.status(400).json({ 
          error: 'Campos requeridos faltantes', 
          details: 'Nombre, apellido y género son obligatorios' 
        });
      }

      // Crear el paciente
      const nuevoPaciente = await prisma.pacientes.create({
        data: {
          nombre,
          apellido,
          email: email || null,
          telefono: telefono || null,
          fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
          genero,
          direccion: direccion || null,
          documento_identidad: documento_identidad || null,
          organizacion_id: '550e8400-e29b-41d4-a716-446655440000' // Usar la primera organización disponible
        }
      });

      console.log('✅ Paciente creado:', nuevoPaciente);
      res.status(201).json({ 
        success: true, 
        data: nuevoPaciente,
        message: 'Paciente creado exitosamente' 
      });
    } catch (error) {
      console.error('Error creando paciente:', error);
      res.status(500).json({ 
        error: 'Error creando paciente', 
        details: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  });
  
  // GET /api/usuarios - Lista de usuarios
  app.get('/api/usuarios', async (req: Request, res: Response) => {
    try {
      const usuarios = await prisma.$queryRaw`
        SELECT id, nombre, apellido, email, telefono, rol, consultorio_id, organizacion_id, created_at
        FROM usuarios 
        ORDER BY nombre
      `;
      res.json({ success: true, data: usuarios });
    } catch (error) {
      console.error('Error en /api/usuarios:', error);
      res.status(500).json({ error: 'Error obteniendo usuarios', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });
  
  // GET /api/consultorios - Lista de consultorios
  app.get('/api/consultorios', async (req: Request, res: Response) => {
    try {
      const consultorios = await prisma.$queryRaw`
        SELECT id, nombre, direccion, organizacion_id, created_at
        FROM consultorios 
        ORDER BY nombre
      `;
      res.json({ success: true, data: consultorios });
    } catch (error) {
      console.error('Error en /api/consultorios:', error);
      res.status(500).json({ error: 'Error obteniendo consultorios', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });
  
  // GET /api/cobros - Lista de cobros
  app.get('/api/cobros', async (req: Request, res: Response) => {
    try {
      const cobros = await prisma.$queryRaw`
        SELECT id, paciente_id, usuario_id, monto_total, fecha_cobro, estado, notas, metodo_pago, created_at
        FROM cobros 
        ORDER BY fecha_cobro DESC
      `;
      res.json({ success: true, data: cobros });
    } catch (error) {
      console.error('Error en /api/cobros:', error);
      res.status(500).json({ error: 'Error obteniendo cobros', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });
  
  // GET /api/servicios - Lista de servicios
  app.get('/api/servicios', async (req: Request, res: Response) => {
    try {
      const servicios = await prisma.$queryRaw`
        SELECT id, nombre, descripcion, precio_base, organizacion_id, created_at
        FROM servicios 
        ORDER BY nombre
      `;
      res.json({ success: true, data: servicios });
    } catch (error) {
      console.error('Error en /api/servicios:', error);
      res.status(500).json({ error: 'Error obteniendo servicios', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });
  
  // GET /api/permisos/mis-permisos - Permisos del usuario actual
  app.get('/api/permisos/mis-permisos', async (req: Request, res: Response) => {
    try {
      // Por ahora devolvemos permisos básicos y módulos disponibles
      const permisos = {
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_gestionar_usuarios: true,
        puede_ver_historial: true
      };
      
      // Módulos disponibles para el usuario
      const modulosDisponibles = [
        'cobros',
        'pacientes', 
        'usuarios',
        'citas',
        'inventario',
        'facturacion',
        'historial'
      ];
      
      // Rol del usuario (por defecto admin)
      const rol = 'ADMIN';
      
      // Información de la organización (por defecto)
      const organizacion = {
        nombre: 'ProCura',
        email: 'admin@organizacion.com',
        telefono: '+1234567890'
      };
      
      res.json({ 
        success: true, 
        data: {
          permisos,
          modulosDisponibles,
          rol,
          organizacion
        }
      });
    } catch (error) {
      console.error('Error en /api/permisos/mis-permisos:', error);
      res.status(500).json({ error: 'Error obteniendo permisos', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });
  
  console.log('   ✅ Rutas básicas del frontend agregadas');
  console.log('   📝 Rutas disponibles: /api/pacientes, /api/usuarios, /api/consultorios, /api/cobros, /api/servicios, /api/permisos/mis-permisos, /api/historial');
  
} catch (error) {
  console.error('❌ Error cargando rutas:', error);
}

// Middleware de manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`🚨 ERROR en ${req.method} ${req.url}:`, err.message);
  
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Error interno del servidor'
    });
  }
});

// Ruta 404 para rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Ruta ${req.originalUrl} no encontrada` 
  });
});

const PORT: number = parseInt(process.env.PORT || '3002', 10);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('✅ Sistema básico cargado con rutas del frontend');
  console.log('📝 Rutas disponibles: /api/pacientes, /api/usuarios, /api/consultorios, /api/cobros, /api/servicios, /api/permisos/mis-permisos, /api/historial');
});

export default app; 