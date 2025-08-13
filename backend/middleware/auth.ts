import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('=== DEBUG AUTHENTICATION ===');
  console.log('Headers:', req.headers);
  
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log('Token extraído:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

  if (!token) {
    console.log('ERROR: No token provided');
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_2024';
    console.log('Secret usado:', secret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, secret);
    console.log('Token decodificado exitosamente:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}; 