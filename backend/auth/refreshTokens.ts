import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

/**
 * Sistema de JWT Refresh Tokens para Security Hardening
 * Implementa access tokens cortos y refresh tokens largos con rotación automática
 */

// Configuración de tokens
export const TOKEN_CONFIG = {
  ACCESS_TOKEN: {
    SECRET: process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro_2024',
    EXPIRES_IN: '15m', // Access tokens cortos para seguridad
    ISSUER: 'sistema-procura',
    AUDIENCE: 'procura-users'
  },
  
  REFRESH_TOKEN: {
    SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'tu_secreto_refresh_jwt_super_seguro_2024',
    EXPIRES_IN: '7d', // Refresh tokens más largos
    ISSUER: 'sistema-procura',
    AUDIENCE: 'procura-refresh'
  }
};

// Interfaces para los tokens
export interface TokenPayload {
  id: string;
  email: string;
  rol: string;
  organizacion_id: string;
  session_id?: string;
}

export interface RefreshTokenPayload {
  id: string;
  type: 'refresh';
  session_id: string;
  issued_at: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_expires_in: number;
}

// Blacklist de tokens comprometidos (en memoria para demo, usar Redis en producción)
class TokenBlacklist {
  private blacklistedTokens: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar tokens expirados cada hora
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup() {
    // En implementación real, verificar expiración de tokens
    // Por ahora, limpiar después de 24 horas
    console.log('🧹 Cleaning up expired blacklisted tokens');
  }

  addToken(token: string) {
    this.blacklistedTokens.add(token);
    console.log(`🚫 Token added to blacklist: ${token.substring(0, 20)}...`);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  clear() {
    this.blacklistedTokens.clear();
  }

  getStats() {
    return {
      blacklisted_count: this.blacklistedTokens.size,
      last_cleanup: new Date().toISOString()
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.blacklistedTokens.clear();
  }
}

// Instancia global del blacklist
export const tokenBlacklist = new TokenBlacklist();

// Store de sesiones activas (en memoria para demo)
class SessionStore {
  private sessions: Map<string, {
    user_id: string;
    created_at: Date;
    last_activity: Date;
    ip_address: string;
    user_agent: string;
    refresh_token_id: string;
  }> = new Map();

  createSession(sessionId: string, data: {
    user_id: string;
    ip_address: string;
    user_agent: string;
    refresh_token_id: string;
  }) {
    this.sessions.set(sessionId, {
      ...data,
      created_at: new Date(),
      last_activity: new Date()
    });
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  updateActivity(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.last_activity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  deleteSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  getUserSessions(userId: string) {
    const userSessions = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.user_id === userId) {
        userSessions.push({ session_id: sessionId, ...session });
      }
    }
    return userSessions;
  }

  deleteAllUserSessions(userId: string) {
    const sessionsToDelete = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.user_id === userId) {
        sessionsToDelete.push(sessionId);
      }
    }
    
    sessionsToDelete.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });
    
    return sessionsToDelete.length;
  }

  getStats() {
    return {
      total_sessions: this.sessions.size,
      sessions_by_user: this.getUserSessionCounts()
    };
  }

  private getUserSessionCounts() {
    const counts: Record<string, number> = {};
    for (const session of this.sessions.values()) {
      counts[session.user_id] = (counts[session.user_id] || 0) + 1;
    }
    return counts;
  }
}

// Instancia global del session store
export const sessionStore = new SessionStore();

// Clase principal para manejo de tokens
export class RefreshTokenManager {
  
  /**
   * Genera un par de tokens (access + refresh)
   */
  static generateTokenPair(payload: TokenPayload, sessionId: string): TokenPair {
    // Access token con información completa del usuario
    const accessToken = jwt.sign(
      {
        ...payload,
        session_id: sessionId,
        token_type: 'access'
      },
      TOKEN_CONFIG.ACCESS_TOKEN.SECRET,
      {
        expiresIn: TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
        issuer: TOKEN_CONFIG.ACCESS_TOKEN.ISSUER,
        audience: TOKEN_CONFIG.ACCESS_TOKEN.AUDIENCE,
        subject: payload.id
      } as jwt.SignOptions
    );

    // Refresh token con información mínima
    const refreshTokenPayload: RefreshTokenPayload = {
      id: payload.id,
      type: 'refresh',
      session_id: sessionId,
      issued_at: Date.now()
    };

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      TOKEN_CONFIG.REFRESH_TOKEN.SECRET,
      {
        expiresIn: TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN,
        issuer: TOKEN_CONFIG.REFRESH_TOKEN.ISSUER,
        audience: TOKEN_CONFIG.REFRESH_TOKEN.AUDIENCE,
        subject: payload.id
      } as jwt.SignOptions
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 15 * 60, // 15 minutos en segundos
      refresh_expires_in: 7 * 24 * 60 * 60 // 7 días en segundos
    };
  }

  /**
   * Verifica y decodifica un access token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      // Verificar si el token está en blacklist
      if (tokenBlacklist.isBlacklisted(token)) {
        throw new Error('Token is blacklisted');
      }

      const decoded = jwt.verify(token, TOKEN_CONFIG.ACCESS_TOKEN.SECRET, {
        issuer: TOKEN_CONFIG.ACCESS_TOKEN.ISSUER,
        audience: TOKEN_CONFIG.ACCESS_TOKEN.AUDIENCE
      }) as any;

      if (decoded.token_type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        id: decoded.id,
        email: decoded.email,
        rol: decoded.rol,
        organizacion_id: decoded.organizacion_id,
        session_id: decoded.session_id
      };
    } catch (error) {
      console.error('Access token verification failed:', (error as Error).message);
      return null;
    }
  }

  /**
   * Verifica y decodifica un refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      // Verificar si el token está en blacklist
      if (tokenBlacklist.isBlacklisted(token)) {
        throw new Error('Token is blacklisted');
      }

      const decoded = jwt.verify(token, TOKEN_CONFIG.REFRESH_TOKEN.SECRET, {
        issuer: TOKEN_CONFIG.REFRESH_TOKEN.ISSUER,
        audience: TOKEN_CONFIG.REFRESH_TOKEN.AUDIENCE
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        id: decoded.id,
        type: 'refresh',
        session_id: decoded.session_id,
        issued_at: decoded.issued_at
      };
    } catch (error) {
      console.error('Refresh token verification failed:', (error as Error).message);
      return null;
    }
  }

  /**
   * Renueva un access token usando un refresh token
   */
  static async refreshAccessToken(refreshToken: string, userPayload: TokenPayload): Promise<TokenPair | null> {
    try {
      const refreshPayload = this.verifyRefreshToken(refreshToken);
      if (!refreshPayload) {
        return null;
      }

      // Verificar que la sesión existe
      const session = sessionStore.getSession(refreshPayload.session_id);
      if (!session || session.user_id !== userPayload.id) {
        throw new Error('Invalid session');
      }

      // Actualizar actividad de la sesión
      sessionStore.updateActivity(refreshPayload.session_id);

      // Generar nuevo par de tokens (token rotation)
      const newTokenPair = this.generateTokenPair(userPayload, refreshPayload.session_id);

      // Invalidar el refresh token anterior (token rotation)
      tokenBlacklist.addToken(refreshToken);

      console.log(`🔄 Tokens refreshed for user ${userPayload.id}`);
      return newTokenPair;
    } catch (error) {
      console.error('Token refresh failed:', (error as Error).message);
      return null;
    }
  }

  /**
   * Invalida un token específico
   */
  static invalidateToken(token: string) {
    tokenBlacklist.addToken(token);
  }

  /**
   * Invalida toda la sesión de un usuario
   */
  static invalidateUserSession(userId: string, sessionId?: string) {
    if (sessionId) {
      // Invalidar sesión específica
      sessionStore.deleteSession(sessionId);
    } else {
      // Invalidar todas las sesiones del usuario
      const deletedCount = sessionStore.deleteAllUserSessions(userId);
      console.log(`🚫 Invalidated ${deletedCount} sessions for user ${userId}`);
    }
  }

  /**
   * Obtiene información de la sesión
   */
  static getSessionInfo(sessionId: string) {
    return sessionStore.getSession(sessionId);
  }

  /**
   * Obtiene todas las sesiones de un usuario
   */
  static getUserSessions(userId: string) {
    return sessionStore.getUserSessions(userId);
  }

  /**
   * Obtiene estadísticas del sistema de tokens
   */
  static getTokenStats() {
    return {
      blacklist: tokenBlacklist.getStats(),
      sessions: sessionStore.getStats(),
      config: {
        access_token_expires: TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
        refresh_token_expires: TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN
      }
    };
  }
}

// Middleware para verificar access tokens
export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Se requiere token de acceso válido'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = RefreshTokenManager.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid access token',
      message: 'Token de acceso inválido o expirado',
      hint: 'Use el refresh token para obtener un nuevo access token'
    });
  }

  // Verificar que la sesión existe
  if (decoded.session_id) {
    const session = sessionStore.getSession(decoded.session_id);
    if (!session) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'La sesión ha expirado'
      });
    }
    
    // Actualizar actividad de la sesión
    sessionStore.updateActivity(decoded.session_id);
  }

  // Agregar información del usuario al request
  (req as any).user = decoded;
  next();
};

// Middleware para verificar refresh tokens
export const verifyRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(400).json({
      error: 'Refresh token required',
      message: 'Se requiere refresh token'
    });
  }

  const decoded = RefreshTokenManager.verifyRefreshToken(refresh_token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Refresh token inválido o expirado',
      hint: 'Debe iniciar sesión nuevamente'
    });
  }

  // Agregar información del token al request
  (req as any).refreshTokenPayload = decoded;
  next();
};

// Utilidades para generar session IDs únicos
export const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

// Utilidades para extraer información del token
export const extractTokenInfo = (token: string): any => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded?.payload;
  } catch (error) {
    return null;
  }
};

// Cleanup al cerrar la aplicación
process.on('SIGINT', () => {
  tokenBlacklist.destroy();
});

process.on('SIGTERM', () => {
  tokenBlacklist.destroy();
});