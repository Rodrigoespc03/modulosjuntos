import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Función para generar token JWT
function generateToken(user: any) {
  const payload = {
    id: user.id,
    email: user.email,
    rol: user.rol,
    organizacion_id: user.organizacion_id
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '24h'
  });
}

// POST /api/login - Login completo con JWT
router.post('/login', async (req, res) => {
  console.log('🚀 LOGIN REQUEST RECIBIDO');
  console.log('   Body:', req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Email o password faltantes');
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }
    
    console.log('🔍 Buscando usuario en base de datos...');
    
    // Buscar usuario usando SQL directo para evitar problemas de Prisma
    const users = await prisma.$queryRaw`
      SELECT id, nombre, apellido, email, password, rol, organizacion_id
      FROM usuarios 
      WHERE email = ${email}
    `;
    
    console.log('   Usuarios encontrados:', users.length);
    
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = users[0];
    console.log('   Usuario encontrado:', user.nombre, user.apellido);
    console.log('   Tiene password:', user.password ? 'SÍ' : 'NO');
    
    // Verificar contraseña
    let passwordValid = false;
    
    if (user.password && user.password.startsWith('$2b$')) {
      console.log('   Verificando contraseña hasheada...');
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      console.log('   Verificando contraseña temporal...');
      passwordValid = password === '123456';
    }
    
    console.log('   Contraseña válida:', passwordValid);
    
    if (!passwordValid) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    console.log('✅ Login exitoso, generando token JWT...');
    
    // Generar token JWT
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        organizacion_id: user.organizacion_id
      }
    });
    
    console.log('✅ Respuesta con token enviada exitosamente');
    
  } catch (error) {
    console.error('❌ ERROR en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// GET /api/me - Obtener usuario actual (protegido)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Obtener usuario actualizado de la base de datos
      const users = await prisma.$queryRaw`
        SELECT id, nombre, apellido, email, rol, organizacion_id
        FROM usuarios 
        WHERE id = ${decoded.id}
      `;
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const user = users[0];
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          organizacion_id: user.organizacion_id
        }
      });
      
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
  } catch (error) {
    console.error('❌ ERROR en /me:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// POST /api/logout - Logout
router.post('/logout', (req, res) => {
  // En JWT, el logout se maneja en el frontend eliminando el token
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

export default router; 