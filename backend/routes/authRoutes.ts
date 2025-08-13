import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validateBody } from '../middleware/validation';
import asyncHandler from '../utils/asyncHandler';
import { loginSchema, changePasswordSchema, registerSchema } from '../schemas/authSchemas';
import { 
  PasswordSecurityManager, 
  validatePasswordPolicy, 
  hashPasswordMiddleware 
} from '../middleware/passwordSecurity';
import { GdprAuditLogger, AUDIT_ACTIVITIES, LEGAL_BASIS, DATA_CATEGORIES } from '../middleware/auditLogger';
import { 
  loginRateLimit, 
  passwordChangeRateLimit, 
  passwordResetRateLimit,
  checkBlacklist 
} from '../middleware/advancedRateLimit';
import { 
  RefreshTokenManager, 
  generateSessionId, 
  sessionStore, 
  verifyRefreshToken 
} from '../auth/refreshTokens';
import { refreshTokenSchema, logoutSchema } from '../schemas/authSchemas';

const router = Router();
const prisma = new PrismaClient();

// POST /api/login - Login seguro con validación de contraseña y rate limiting
router.post('/login', [
  checkBlacklist,
  loginRateLimit,
  validateBody(loginSchema)
], asyncHandler(async (req, res) => {
  const { email, password, device_info } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Buscar usuario por email
    const user = await prisma.usuario.findUnique({ 
      where: { email },
      include: { 
        consultorio: true 
      }
    });
    
    if (!user) {
      // Log intento de login fallido
      GdprAuditLogger.log({
        activity_type: AUDIT_ACTIVITIES.LOGIN_FAILED,
        description: `Intento de login fallido para email no existente: ${email}`,
        legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: 'Seguridad del sistema',
        req,
        data_categories: [DATA_CATEGORIES.CONTACT_INFO],
        status: 'failed',
        error_message: 'Usuario no encontrado',
        additional_context: { email, client_ip: clientIP }
      });
      
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    // Verificar contraseña hasheada (o contraseña temporal para migración)
    let passwordValid = false;
    
    if (user.password && user.password.startsWith('$2b$')) {
      // Contraseña ya hasheada
      passwordValid = await PasswordSecurityManager.verifyPassword(password, user.password);
    } else {
      // Contraseña temporal para migración (solo para testing inicial)
      passwordValid = password === '123456';
      
      // Si es válida, hashear y actualizar
      if (passwordValid) {
        const hashedPassword = await PasswordSecurityManager.hashPassword(password);
        await prisma.usuario.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
      }
    }
    
    if (!passwordValid) {
      // Log intento de login fallido
      GdprAuditLogger.log({
        activity_type: AUDIT_ACTIVITIES.LOGIN_FAILED,
        description: `Intento de login fallido para usuario ${user.id}`,
        legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: 'Seguridad del sistema',
        req,
        user_id: user.id,
        organizacion_id: user.organizacion_id,
        data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
        status: 'failed',
        error_message: 'Contraseña incorrecta',
        additional_context: { client_ip: clientIP }
      });
      
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    // TODO: Verificar 2FA si está habilitado
    // if (user.two_factor_enabled && !req.body.totp_code) {
    //   return res.status(200).json({
    //     requires_2fa: true,
    //     message: 'Se requiere autenticación de dos factores'
    //   });
    // }
    
    // Generar session ID único
    const sessionId = generateSessionId();
    
    // Crear payload para tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      organizacion_id: user.organizacion_id
    };
    
    // Generar par de tokens seguros
    const tokenPair = RefreshTokenManager.generateTokenPair(tokenPayload, sessionId);
    
    // Registrar sesión
    sessionStore.createSession(sessionId, {
      user_id: user.id,
      ip_address: clientIP,
      user_agent: req.get('User-Agent') || 'unknown',
      refresh_token_id: tokenPair.refresh_token.substring(0, 10) // Solo los primeros 10 chars para ID
    });
    
    // Log login exitoso
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.LOGIN_SUCCESS,
      description: `Login exitoso para usuario ${user.id}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Acceso autorizado al sistema',
      req,
      user_id: user.id,
      organizacion_id: user.organizacion_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: { 
        client_ip: clientIP,
        device_info: device_info || {}
      }
    });
    
    res.json({ 
      success: true,
      ...tokenPair,
      session_id: sessionId,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        organizacion_id: user.organizacion_id,
        consultorio: user.consultorio
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.LOGIN_FAILED,
      description: `Error interno en login para email ${email}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Seguridad del sistema',
      req,
      data_categories: [DATA_CATEGORIES.CONTACT_INFO],
      status: 'failed',
      error_message: (error as Error).message,
      additional_context: { email, client_ip: clientIP }
    });
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Intente nuevamente más tarde'
    });
  }
}));

// POST /api/change-password - Cambio de contraseña con políticas seguras y rate limiting
router.post('/change-password', [
  checkBlacklist,
  passwordChangeRateLimit,
  validateBody(changePasswordSchema),
  validatePasswordPolicy,
  hashPasswordMiddleware
], asyncHandler(async (req, res) => {
  const { current_password, new_password, logout_other_sessions } = req.body;
  const userId = (req as any).user?.id; // Asumiendo que viene del middleware de auth
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Debe estar autenticado para cambiar la contraseña'
    });
  }
  
  try {
    // Obtener usuario actual
    const user = await prisma.usuario.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar contraseña actual
    const currentPasswordValid = await PasswordSecurityManager.verifyPassword(
      current_password, 
      user.password || ''
    );
    
    if (!currentPasswordValid) {
      GdprAuditLogger.log({
        activity_type: AUDIT_ACTIVITIES.UNAUTHORIZED_ACCESS,
        description: `Intento de cambio de contraseña con contraseña actual incorrecta`,
        legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: 'Seguridad del sistema',
        req,
        user_id: userId,
        organizacion_id: user.organizacion_id,
        data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
        status: 'failed',
        error_message: 'Contraseña actual incorrecta'
      });
      
      return res.status(400).json({
        error: 'Current password invalid',
        message: 'La contraseña actual es incorrecta'
      });
    }
    
    // Verificar que no esté en el historial (el middleware ya hasheó la nueva)
    const newPasswordHash = (req as any).hashedPassword;
    const historyCheck = await PasswordSecurityManager.checkPasswordHistory(userId, current_password);
    
    if (!historyCheck) {
      return res.status(400).json({
        error: 'Password in history',
        message: 'No puedes reutilizar una de tus últimas 5 contraseñas'
      });
    }
    
    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: userId },
      data: { 
        password: newPasswordHash,
        // TODO: Agregar campos de fecha de cambio, etc.
      }
    });
    
    // Guardar en historial
    await PasswordSecurityManager.savePasswordHistory(userId, newPasswordHash);
    
    // Log cambio exitoso
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.DATA_UPDATE,
      description: `Contraseña cambiada exitosamente para usuario ${userId}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Seguridad del usuario',
      req,
      user_id: userId,
      organizacion_id: user.organizacion_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: {
        logout_other_sessions,
        password_strength: (req as any).passwordStrength
      }
    });
    
    // TODO: Si se solicita, invalidar otras sesiones
    if (logout_other_sessions) {
      // Implementar invalidación de tokens/sesiones
      console.log(`Invalidating other sessions for user ${userId}`);
    }
    
    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente',
      password_strength: (req as any).passwordStrength,
      recommendations: (req as any).passwordStrength < 80 ? [
        'Considera usar una contraseña más larga',
        'Incluye más símbolos especiales',
        'Evita patrones predecibles'
      ] : []
    });
    
  } catch (error) {
    console.error('Error changing password:', error);
    
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.DATA_UPDATE,
      description: `Error cambiando contraseña para usuario ${userId}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Seguridad del sistema',
      req,
      user_id: userId,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      status: 'failed',
      error_message: (error as Error).message
    });
    
    res.status(500).json({
      error: 'Password change failed',
      message: 'Error interno del servidor'
    });
  }
}));

// GET /api/password-policy - Obtener políticas de contraseña
router.get('/password-policy', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    policy: {
      min_length: 12,
      max_length: 128,
      require_uppercase: true,
      require_lowercase: true,
      require_digits: true,
      require_symbols: true,
      forbidden_patterns: [
        'Secuencias consecutivas (123456)',
        'Repeticiones excesivas (aaaa)',
        'Palabras comunes (password)',
        'Información personal'
      ],
      password_history: 5,
      strength_levels: {
        weak: '0-40',
        fair: '41-60', 
        good: '61-80',
        strong: '81-100'
      }
    },
    examples: {
      good: 'MyS3cur3P@ssw0rd!',
      bad: ['123456', 'password', 'qwerty']
    }
  });
}));

// POST /api/generate-password - Generar contraseña segura
router.post('/generate-password', asyncHandler(async (req, res) => {
  const { length = 16 } = req.body;
  
  if (length < 12 || length > 128) {
    return res.status(400).json({
      error: 'Invalid length',
      message: 'La longitud debe estar entre 12 y 128 caracteres'
    });
  }
  
  const password = PasswordSecurityManager.generateSecurePassword(length);
  const strength = PasswordSecurityManager.calculatePasswordStrength(password);
  const validation = PasswordSecurityManager.validatePasswordPolicy(password);
  
  res.json({
    success: true,
    password,
    strength,
    validation,
    warning: 'Esta contraseña se genera solo para demostración. En producción, el cliente debe generar contraseñas localmente.'
  });
}));

// POST /api/refresh - Renovar access token con refresh token
router.post('/refresh', [
  checkBlacklist,
  validateBody(refreshTokenSchema),
  verifyRefreshToken
], asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  const refreshPayload = (req as any).refreshTokenPayload;
  
  try {
    // Obtener información completa del usuario
    const user = await prisma.usuario.findUnique({
      where: { id: refreshPayload.id },
      include: { consultorio: true }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Usuario no encontrado'
      });
    }
    
    // Crear payload para nuevo token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      organizacion_id: user.organizacion_id
    };
    
    // Renovar tokens
    const newTokenPair = await RefreshTokenManager.refreshAccessToken(refresh_token, tokenPayload);
    
    if (!newTokenPair) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'No se pudo renovar el token'
      });
    }
    
    // Log renovación exitosa
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.LOGIN_SUCCESS,
      description: `Token renovado para usuario ${user.id}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Continuidad de sesión',
      req,
      user_id: user.id,
      organizacion_id: user.organizacion_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: {
        session_id: refreshPayload.session_id,
        refresh_method: 'automatic'
      }
    });
    
    res.json({
      success: true,
      ...newTokenPair,
      session_id: refreshPayload.session_id,
      message: 'Token renovado exitosamente'
    });
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Error interno del servidor'
    });
  }
}));

// POST /api/logout - Cerrar sesión e invalidar tokens
router.post('/logout', [
  validateBody(logoutSchema)
], asyncHandler(async (req, res) => {
  const { all_sessions, token } = req.body;
  const authHeader = req.headers.authorization;
  
  try {
    let accessToken = token;
    
    // Si no se proporciona token, usar el del header
    if (!accessToken && authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }
    
    if (!accessToken) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Se requiere token para cerrar sesión'
      });
    }
    
    // Verificar y obtener información del token
    const tokenPayload = RefreshTokenManager.verifyAccessToken(accessToken);
    
    if (tokenPayload) {
      if (all_sessions) {
        // Cerrar todas las sesiones del usuario
        RefreshTokenManager.invalidateUserSession(tokenPayload.id);
        
        GdprAuditLogger.log({
          activity_type: AUDIT_ACTIVITIES.LOGOUT,
          description: `Logout global para usuario ${tokenPayload.id}`,
          legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
          purpose: 'Seguridad de sesión',
          req,
          user_id: tokenPayload.id,
          organizacion_id: tokenPayload.organizacion_id,
          data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
          additional_context: { logout_type: 'all_sessions' }
        });
        
        res.json({
          success: true,
          message: 'Todas las sesiones han sido cerradas'
        });
      } else {
        // Cerrar solo la sesión actual
        if (tokenPayload.session_id) {
          RefreshTokenManager.invalidateUserSession(tokenPayload.id, tokenPayload.session_id);
        }
        
        GdprAuditLogger.log({
          activity_type: AUDIT_ACTIVITIES.LOGOUT,
          description: `Logout para usuario ${tokenPayload.id}`,
          legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
          purpose: 'Seguridad de sesión',
          req,
          user_id: tokenPayload.id,
          organizacion_id: tokenPayload.organizacion_id,
          data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
          additional_context: { 
            logout_type: 'current_session',
            session_id: tokenPayload.session_id 
          }
        });
        
        res.json({
          success: true,
          message: 'Sesión cerrada exitosamente'
        });
      }
      
      // Invalidar el access token actual
      RefreshTokenManager.invalidateToken(accessToken);
    } else {
      res.json({
        success: true,
        message: 'Token ya era inválido'
      });
    }
    
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Error cerrando sesión'
    });
  }
}));

// GET /api/sessions - Obtener sesiones activas del usuario
router.get('/sessions', [
  verifyRefreshToken // Reutilizar middleware pero ajustar
], asyncHandler(async (req, res) => {
  // TODO: Implementar middleware de verificación de access token aquí
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Se requiere token de acceso'
    });
  }

  const accessToken = authHeader.split(' ')[1];
  const tokenPayload = RefreshTokenManager.verifyAccessToken(accessToken);

  if (!tokenPayload) {
    return res.status(401).json({
      error: 'Invalid access token',
      message: 'Token de acceso inválido'
    });
  }

  try {
    const sessions = RefreshTokenManager.getUserSessions(tokenPayload.id);
    
    res.json({
      success: true,
      current_session: tokenPayload.session_id,
      sessions: sessions.map(session => ({
        session_id: session.session_id,
        created_at: session.created_at,
        last_activity: session.last_activity,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        is_current: session.session_id === tokenPayload.session_id
      }))
    });
    
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      error: 'Failed to get sessions',
      message: 'Error obteniendo sesiones'
    });
  }
}));

// DELETE /api/sessions/:sessionId - Terminar sesión específica
router.delete('/sessions/:sessionId', [
  // TODO: Agregar middleware de verificación de access token
], asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Se requiere token de acceso'
    });
  }

  const accessToken = authHeader.split(' ')[1];
  const tokenPayload = RefreshTokenManager.verifyAccessToken(accessToken);

  if (!tokenPayload) {
    return res.status(401).json({
      error: 'Invalid access token',
      message: 'Token de acceso inválido'
    });
  }

  try {
    // Verificar que la sesión pertenece al usuario
    const session = RefreshTokenManager.getSessionInfo(sessionId);
    
    if (!session || session.user_id !== tokenPayload.id) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'Sesión no encontrada'
      });
    }
    
    // Terminar la sesión
    RefreshTokenManager.invalidateUserSession(tokenPayload.id, sessionId);
    
    GdprAuditLogger.log({
      activity_type: AUDIT_ACTIVITIES.LOGOUT,
      description: `Sesión específica terminada por usuario ${tokenPayload.id}`,
      legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
      purpose: 'Gestión de sesiones',
      req,
      user_id: tokenPayload.id,
      organizacion_id: tokenPayload.organizacion_id,
      data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
      additional_context: { terminated_session_id: sessionId }
    });
    
    res.json({
      success: true,
      message: 'Sesión terminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      message: 'Error terminando sesión'
    });
  }
}));

// GET /api/token-info - Obtener información del token actual
router.get('/token-info', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Se requiere token de acceso'
    });
  }

  const accessToken = authHeader.split(' ')[1];
  const tokenPayload = RefreshTokenManager.verifyAccessToken(accessToken);

  if (!tokenPayload) {
    return res.status(401).json({
      error: 'Invalid access token',
      message: 'Token de acceso inválido'
    });
  }

  try {
    const sessionInfo = RefreshTokenManager.getSessionInfo(tokenPayload.session_id || '');
    const tokenStats = RefreshTokenManager.getTokenStats();
    
    res.json({
      success: true,
      token_info: {
        user_id: tokenPayload.id,
        email: tokenPayload.email,
        rol: tokenPayload.rol,
        organizacion_id: tokenPayload.organizacion_id,
        session_id: tokenPayload.session_id
      },
      session_info: sessionInfo ? {
        created_at: sessionInfo.created_at,
        last_activity: sessionInfo.last_activity,
        ip_address: sessionInfo.ip_address,
        user_agent: sessionInfo.user_agent
      } : null,
      system_stats: process.env.NODE_ENV === 'development' ? tokenStats : undefined
    });
    
  } catch (error) {
    console.error('Error getting token info:', error);
    res.status(500).json({
      error: 'Failed to get token info',
      message: 'Error obteniendo información del token'
    });
  }
}));

export default router; 