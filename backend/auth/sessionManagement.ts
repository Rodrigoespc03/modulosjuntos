import { Request, Response, NextFunction } from 'express';
import { GdprAuditLogger, AUDIT_ACTIVITIES, LEGAL_BASIS, DATA_CATEGORIES } from '../middleware/auditLogger';

/**
 * Sistema de Session Management Avanzado para Security Hardening
 * Implementa timeout automático, detección de dispositivos y alertas de seguridad
 */

// Configuración del sistema de sesiones
export const SESSION_CONFIG = {
  TIMEOUT_MINUTES: 30,           // Timeout por inactividad
  MAX_SESSIONS_PER_USER: 10,     // Máximo de sesiones concurrentes
  DEVICE_FINGERPRINT_TTL: 24 * 60 * 60 * 1000, // 24 horas para recordar dispositivo
  SUSPICIOUS_LOGIN_THRESHOLD: 3, // Intentos desde ubicaciones nuevas
  GEOLOCATION_ENABLED: true,     // Tracking de ubicación opcional
  SESSION_CLEANUP_INTERVAL: 5 * 60 * 1000, // Cleanup cada 5 minutos
  NOTIFICATION_COOLDOWN: 60 * 60 * 1000  // 1 hora entre notificaciones similares
};

// Interfaces para session management
export interface DeviceFingerprint {
  user_agent: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  device_id: string;
  is_trusted: boolean;
  first_seen: Date;
  last_seen: Date;
}

export interface SessionActivity {
  timestamp: Date;
  action: string;
  ip_address: string;
  user_agent: string;
  endpoint?: string;
  success: boolean;
  risk_score?: number;
}

export interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: 'NEW_DEVICE' | 'SUSPICIOUS_LOCATION' | 'CONCURRENT_SESSIONS' | 'UNUSUAL_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details: any;
  created_at: Date;
  acknowledged: boolean;
  acknowledged_at?: Date;
  acknowledged_by?: string;
}

export interface SessionInfo {
  session_id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  device_fingerprint: DeviceFingerprint;
  created_at: Date;
  last_activity: Date;
  is_active: boolean;
  timeout_at: Date;
  location?: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  risk_score: number;
  activities: SessionActivity[];
}

// Store avanzado para gestión de sesiones
class AdvancedSessionStore {
  private sessions: Map<string, SessionInfo> = new Map();
  private deviceFingerprints: Map<string, DeviceFingerprint[]> = new Map();
  private securityAlerts: Map<string, SecurityAlert[]> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private notificationCooldowns: Map<string, Date> = new Map();

  constructor() {
    // Iniciar cleanup automático
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, SESSION_CONFIG.SESSION_CLEANUP_INTERVAL);

    console.log('🔐 Advanced Session Management initialized');
  }

  /**
   * Crea una nueva sesión con detección de dispositivo
   */
  createSession(sessionData: {
    session_id: string;
    user_id: string;
    ip_address: string;
    user_agent: string;
    device_info?: any;
    location?: any;
  }): SessionInfo {
    const now = new Date();
    
    // Generar fingerprint del dispositivo
    const deviceFingerprint = this.generateDeviceFingerprint(
      sessionData.user_agent,
      sessionData.device_info,
      sessionData.user_id
    );

    // Verificar si es un dispositivo nuevo
    const isNewDevice = this.isNewDevice(sessionData.user_id, deviceFingerprint);

    // Calcular score de riesgo inicial
    const riskScore = this.calculateRiskScore({
      ip_address: sessionData.ip_address,
      user_agent: sessionData.user_agent,
      location: sessionData.location,
      is_new_device: isNewDevice,
      user_id: sessionData.user_id
    });

    const sessionInfo: SessionInfo = {
      session_id: sessionData.session_id,
      user_id: sessionData.user_id,
      ip_address: sessionData.ip_address,
      user_agent: sessionData.user_agent,
      device_fingerprint: deviceFingerprint,
      created_at: now,
      last_activity: now,
      is_active: true,
      timeout_at: new Date(now.getTime() + SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000),
      location: sessionData.location,
      risk_score: riskScore,
      activities: [{
        timestamp: now,
        action: 'SESSION_CREATED',
        ip_address: sessionData.ip_address,
        user_agent: sessionData.user_agent,
        success: true,
        risk_score: riskScore
      }]
    };

    // Guardar sesión
    this.sessions.set(sessionData.session_id, sessionInfo);

    // Verificar límites de sesiones concurrentes
    this.checkConcurrentSessionLimits(sessionData.user_id);

    // Generar alertas si es necesario
    if (isNewDevice) {
      this.createSecurityAlert(sessionData.user_id, {
        alert_type: 'NEW_DEVICE',
        severity: 'MEDIUM',
        message: 'New device detected',
        details: {
          device_fingerprint: deviceFingerprint,
          ip_address: sessionData.ip_address,
          location: sessionData.location
        }
      });
    }

    if (riskScore > 70) {
      this.createSecurityAlert(sessionData.user_id, {
        alert_type: 'SUSPICIOUS_LOCATION',
        severity: 'HIGH',
        message: 'Login from suspicious location',
        details: {
          risk_score: riskScore,
          ip_address: sessionData.ip_address,
          location: sessionData.location
        }
      });
    }

    console.log(`🔐 Session created: ${sessionData.session_id} (risk: ${riskScore})`);
    return sessionInfo;
  }

  /**
   * Actualiza la actividad de una sesión
   */
  updateActivity(sessionId: string, activity: {
    action: string;
    endpoint?: string;
    success: boolean;
    ip_address?: string;
  }): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.is_active) {
      return false;
    }

    const now = new Date();
    
    // Verificar si la sesión ha expirado
    if (now > session.timeout_at) {
      this.expireSession(sessionId, 'TIMEOUT');
      return false;
    }

    // Actualizar última actividad y timeout
    session.last_activity = now;
    session.timeout_at = new Date(now.getTime() + SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000);

    // Registrar actividad
    const sessionActivity: SessionActivity = {
      timestamp: now,
      action: activity.action,
      ip_address: activity.ip_address || session.ip_address,
      user_agent: session.user_agent,
      endpoint: activity.endpoint,
      success: activity.success
    };

    session.activities.push(sessionActivity);

    // Mantener solo las últimas 50 actividades por performance
    if (session.activities.length > 50) {
      session.activities = session.activities.slice(-50);
    }

    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Obtiene información completa de una sesión
   */
  getSession(sessionId: string): SessionInfo | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    // Verificar si la sesión ha expirado
    if (new Date() > session.timeout_at && session.is_active) {
      this.expireSession(sessionId, 'TIMEOUT');
      return undefined;
    }

    return session;
  }

  /**
   * Obtiene todas las sesiones activas de un usuario
   */
  getUserSessions(userId: string): SessionInfo[] {
    const userSessions: SessionInfo[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.user_id === userId && session.is_active) {
        // Verificar expiración
        if (new Date() > session.timeout_at) {
          this.expireSession(session.session_id, 'TIMEOUT');
        } else {
          userSessions.push(session);
        }
      }
    }

    return userSessions.sort((a, b) => b.last_activity.getTime() - a.last_activity.getTime());
  }

  /**
   * Termina una sesión específica
   */
  terminateSession(sessionId: string, reason: string = 'USER_LOGOUT'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.is_active = false;
    
    // Registrar terminación
    session.activities.push({
      timestamp: new Date(),
      action: 'SESSION_TERMINATED',
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      success: true
    });

    this.sessions.set(sessionId, session);
    
    console.log(`🔐 Session terminated: ${sessionId} (reason: ${reason})`);
    return true;
  }

  /**
   * Termina todas las sesiones de un usuario
   */
  terminateAllUserSessions(userId: string, exceptSessionId?: string): number {
    let terminatedCount = 0;
    
    for (const session of this.sessions.values()) {
      if (session.user_id === userId && 
          session.is_active && 
          session.session_id !== exceptSessionId) {
        this.terminateSession(session.session_id, 'ADMIN_LOGOUT_ALL');
        terminatedCount++;
      }
    }

    return terminatedCount;
  }

  /**
   * Expira una sesión por timeout
   */
  private expireSession(sessionId: string, reason: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.is_active = false;
    
    session.activities.push({
      timestamp: new Date(),
      action: 'SESSION_EXPIRED',
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      success: true
    });

    this.sessions.set(sessionId, session);
    
    console.log(`⏰ Session expired: ${sessionId} (reason: ${reason})`);
  }

  /**
   * Genera fingerprint único del dispositivo
   */
  private generateDeviceFingerprint(userAgent: string, deviceInfo: any = {}, userId: string): DeviceFingerprint {
    const deviceId = this.hashDeviceInfo(userAgent, deviceInfo);
    const now = new Date();

    // Verificar si ya existe este dispositivo
    const userDevices = this.deviceFingerprints.get(userId) || [];
    const existingDevice = userDevices.find(d => d.device_id === deviceId);

    if (existingDevice) {
      existingDevice.last_seen = now;
      return existingDevice;
    }

    // Crear nuevo fingerprint
    const fingerprint: DeviceFingerprint = {
      user_agent: userAgent,
      screen_resolution: deviceInfo.screen_resolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      platform: deviceInfo.platform,
      device_id: deviceId,
      is_trusted: false, // Nuevo dispositivo no es trusted por defecto
      first_seen: now,
      last_seen: now
    };

    // Guardar dispositivo
    userDevices.push(fingerprint);
    this.deviceFingerprints.set(userId, userDevices);

    return fingerprint;
  }

  /**
   * Verifica si es un dispositivo nuevo
   */
  private isNewDevice(userId: string, fingerprint: DeviceFingerprint): boolean {
    const userDevices = this.deviceFingerprints.get(userId) || [];
    const deviceAge = Date.now() - fingerprint.first_seen.getTime();
    
    // Considerar nuevo si es la primera vez que se ve este device_id
    // o si fue visto hace más del TTL configurado
    return deviceAge < 1000 || // Menos de 1 segundo = nuevo
           deviceAge > SESSION_CONFIG.DEVICE_FINGERPRINT_TTL;
  }

  /**
   * Calcula score de riesgo para una sesión
   */
  private calculateRiskScore(data: {
    ip_address: string;
    user_agent: string;
    location?: any;
    is_new_device: boolean;
    user_id: string;
  }): number {
    let riskScore = 0;

    // Dispositivo nuevo (+30 puntos)
    if (data.is_new_device) {
      riskScore += 30;
    }

    // User agent sospechoso (+20 puntos)
    if (this.isSuspiciousUserAgent(data.user_agent)) {
      riskScore += 20;
    }

    // IP address sospechosa (+25 puntos)
    if (this.isSuspiciousIP(data.ip_address)) {
      riskScore += 25;
    }

    // Ubicación inusual (+15 puntos)
    if (data.location && this.isUnusualLocation(data.user_id, data.location)) {
      riskScore += 15;
    }

    // Múltiples sesiones recientes (+10 puntos)
    const recentSessions = this.getRecentUserSessions(data.user_id, 60); // Última hora
    if (recentSessions.length > 3) {
      riskScore += 10;
    }

    return Math.min(riskScore, 100); // Máximo 100
  }

  /**
   * Verifica límites de sesiones concurrentes
   */
  private checkConcurrentSessionLimits(userId: string): void {
    const userSessions = this.getUserSessions(userId);
    
    if (userSessions.length > SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
      // Terminar las sesiones más antiguas
      const sessionsToTerminate = userSessions
        .sort((a, b) => a.last_activity.getTime() - b.last_activity.getTime())
        .slice(0, userSessions.length - SESSION_CONFIG.MAX_SESSIONS_PER_USER);

      sessionsToTerminate.forEach(session => {
        this.terminateSession(session.session_id, 'CONCURRENT_LIMIT_EXCEEDED');
      });

      this.createSecurityAlert(userId, {
        alert_type: 'CONCURRENT_SESSIONS',
        severity: 'MEDIUM',
        message: `Too many concurrent sessions (${userSessions.length}/${SESSION_CONFIG.MAX_SESSIONS_PER_USER})`,
        details: {
          terminated_sessions: sessionsToTerminate.length,
          max_allowed: SESSION_CONFIG.MAX_SESSIONS_PER_USER
        }
      });
    }
  }

  /**
   * Crea una alerta de seguridad
   */
  private createSecurityAlert(userId: string, alertData: {
    alert_type: SecurityAlert['alert_type'];
    severity: SecurityAlert['severity'];
    message: string;
    details: any;
  }): void {
    // Verificar cooldown para evitar spam
    const cooldownKey = `${userId}:${alertData.alert_type}`;
    const lastNotification = this.notificationCooldowns.get(cooldownKey);
    
    if (lastNotification && 
        Date.now() - lastNotification.getTime() < SESSION_CONFIG.NOTIFICATION_COOLDOWN) {
      return; // Skip durante cooldown
    }

    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      user_id: userId,
      alert_type: alertData.alert_type,
      severity: alertData.severity,
      message: alertData.message,
      details: alertData.details,
      created_at: new Date(),
      acknowledged: false
    };

    // Guardar alerta
    const userAlerts = this.securityAlerts.get(userId) || [];
    userAlerts.push(alert);
    this.securityAlerts.set(userId, userAlerts);

    // Actualizar cooldown
    this.notificationCooldowns.set(cooldownKey, new Date());

    console.log(`🚨 Security alert: ${alert.alert_type} for user ${userId} (${alert.severity})`);
  }

  /**
   * Obtiene alertas de seguridad de un usuario
   */
  getSecurityAlerts(userId: string, unacknowledgedOnly: boolean = false): SecurityAlert[] {
    const userAlerts = this.securityAlerts.get(userId) || [];
    
    if (unacknowledgedOnly) {
      return userAlerts.filter(alert => !alert.acknowledged);
    }
    
    return userAlerts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Marca una alerta como reconocida
   */
  acknowledgeAlert(userId: string, alertId: string, acknowledgedBy: string): boolean {
    const userAlerts = this.securityAlerts.get(userId) || [];
    const alert = userAlerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledged_at = new Date();
      alert.acknowledged_by = acknowledgedBy;
      
      this.securityAlerts.set(userId, userAlerts);
      return true;
    }
    
    return false;
  }

  /**
   * Cleanup de sesiones expiradas
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.is_active && now > session.timeout_at) {
        this.expireSession(sessionId, 'TIMEOUT');
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  // Métodos de utilidad privados
  private hashDeviceInfo(userAgent: string, deviceInfo: any): string {
    const data = `${userAgent}:${deviceInfo.screen_resolution || ''}:${deviceInfo.timezone || ''}:${deviceInfo.platform || ''}`;
    return Buffer.from(data).toString('base64').substring(0, 16);
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = ['bot', 'crawler', 'spider', 'scraper', 'headless'];
    return suspiciousPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );
  }

  private isSuspiciousIP(ipAddress: string): boolean {
    // Implementación simple - en producción usar servicios como MaxMind
    const suspiciousRanges = ['127.0.0.1', '0.0.0.0'];
    return suspiciousRanges.includes(ipAddress);
  }

  private isUnusualLocation(userId: string, location: any): boolean {
    // Implementación simple - en producción comparar con ubicaciones históricas
    return false; // Por ahora no consideramos ubicaciones inusuales
  }

  private getRecentUserSessions(userId: string, minutesBack: number): SessionInfo[] {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
    const sessions: SessionInfo[] = [];

    for (const session of this.sessions.values()) {
      if (session.user_id === userId && session.created_at > cutoff) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getSystemStats() {
    const stats = {
      total_sessions: this.sessions.size,
      active_sessions: 0,
      expired_sessions: 0,
      total_devices: 0,
      trusted_devices: 0,
      total_alerts: 0,
      unacknowledged_alerts: 0,
      avg_session_duration: 0,
      high_risk_sessions: 0
    };

    let totalDuration = 0;
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      if (session.is_active) {
        stats.active_sessions++;
        activeSessions++;
        totalDuration += Date.now() - session.created_at.getTime();
      } else {
        stats.expired_sessions++;
      }

      if (session.risk_score > 70) {
        stats.high_risk_sessions++;
      }
    }

    for (const devices of this.deviceFingerprints.values()) {
      stats.total_devices += devices.length;
      stats.trusted_devices += devices.filter(d => d.is_trusted).length;
    }

    for (const alerts of this.securityAlerts.values()) {
      stats.total_alerts += alerts.length;
      stats.unacknowledged_alerts += alerts.filter(a => !a.acknowledged).length;
    }

    if (activeSessions > 0) {
      stats.avg_session_duration = Math.round(totalDuration / activeSessions / 1000 / 60); // minutos
    }

    return stats;
  }

  /**
   * Destructor para cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    this.deviceFingerprints.clear();
    this.securityAlerts.clear();
    this.notificationCooldowns.clear();
    console.log('🔐 Advanced Session Management destroyed');
  }
}

// Instancia global del session store avanzado
export const advancedSessionStore = new AdvancedSessionStore();

// Middleware para verificar timeout de sesión
export const sessionTimeoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = (req as any).user?.session_id;
  
  if (sessionId) {
    const session = advancedSessionStore.getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'Su sesión ha expirado por inactividad',
        code: 'SESSION_TIMEOUT'
      });
    }

    // Actualizar actividad
    advancedSessionStore.updateActivity(sessionId, {
      action: 'API_REQUEST',
      endpoint: req.originalUrl,
      success: true,
      ip_address: req.ip || req.connection.remoteAddress || 'unknown'
    });
  }

  next();
};

// Middleware para logging de actividad avanzado
export const activityLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = (req as any).user?.session_id;
  const userId = (req as any).user?.id;
  
  if (sessionId && userId) {
    // Log en el sistema avanzado
    advancedSessionStore.updateActivity(sessionId, {
      action: `${req.method}_${req.originalUrl}`,
      endpoint: req.originalUrl,
      success: true, // Se actualizará en el response
      ip_address: req.ip || req.connection.remoteAddress || 'unknown'
    });

    // Log GDPR si es endpoint sensible
    if (req.originalUrl.includes('/pacientes') || 
        req.originalUrl.includes('/citas') || 
        req.originalUrl.includes('/gdpr')) {
      GdprAuditLogger.log({
        activity_type: AUDIT_ACTIVITIES.DATA_ACCESS,
        description: `API access: ${req.method} ${req.originalUrl}`,
        legal_basis: LEGAL_BASIS.LEGITIMATE_INTERESTS,
        purpose: 'System functionality',
        req,
        user_id: userId,
        data_categories: [DATA_CATEGORIES.PERSONAL_IDENTIFIERS],
        additional_context: {
          session_id: sessionId,
          user_agent: req.get('User-Agent'),
          endpoint: req.originalUrl
        }
      });
    }
  }

  next();
};

// Cleanup al cerrar la aplicación
process.on('SIGINT', () => {
  advancedSessionStore.destroy();
});

process.on('SIGTERM', () => {
  advancedSessionStore.destroy();
});