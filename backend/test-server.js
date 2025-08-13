const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middleware básico
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de ProCura Cobros funcionando');
});

// Ruta de login simplificada
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({ 
      where: { email } 
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Para pruebas, password fijo
    if (password !== '123456') {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      'tu_secreto_jwt_super_seguro_2024',
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de historial simplificada
app.get('/api/historial/estadisticas', (req, res) => {
  res.json({ 
    total_registros: 0,
    cambios_hoy: 0,
    cambios_semana: 0,
    cambios_mes: 0
  });
});

// Ruta de historial general
app.get('/api/historial/general', (req, res) => {
  res.json([]);
});

// Ruta de cobros simplificada
app.post('/api/cobros', async (req, res) => {
  try {
    const { paciente_id, monto, concepto, estado, fecha_cobro, metodo_pago } = req.body;
    
    const cobro = await prisma.cobro.create({
      data: {
        paciente_id,
        monto: parseFloat(monto),
        concepto,
        estado,
        fecha_cobro: new Date(fecha_cobro),
        metodo_pago
      }
    });

    res.status(201).json(cobro);
  } catch (error) {
    console.error('Error creando cobro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Manejo de errores
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Promesa no manejada:', err);
});

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Servidor de prueba corriendo en http://localhost:${PORT}`);
  console.log('Rutas disponibles:');
  console.log('- GET  /');
  console.log('- POST /api/auth/login');
  console.log('- GET  /api/historial/estadisticas');
  console.log('- GET  /api/historial/general');
  console.log('- POST /api/cobros');
}); 
 
 