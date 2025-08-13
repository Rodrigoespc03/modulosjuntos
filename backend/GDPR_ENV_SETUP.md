# 🔒 CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA GDPR

## Variables Críticas Requeridas

Agrega estas variables a tu archivo `.env`:

```bash
# CRÍTICO: Claves de encriptación para datos médicos
# En producción, usar claves aleatorias seguras y almacenar en key management
MEDICAL_ENCRYPTION_KEY=super-secure-medical-key-256-bits-min-change-in-production
PSEUDONYM_SALT=pseudonym-salt-for-irreversible-hashing-change-in-production

# Configuración GDPR
GDPR_COMPLIANCE_ENABLED=true
GDPR_DATA_RETENTION_DAYS=3650  # 10 años para datos médicos
GDPR_AUTOMATIC_DELETION=false
GDPR_AUDIT_LOGGING=true
GDPR_BREACH_NOTIFICATION_EMAIL=dpo@clinic.com

# Data Protection Officer (DPO)
DPO_NAME=Data Protection Officer
DPO_EMAIL=dpo@clinic.com
DPO_PHONE=+34-900-000-000

# Transferencias internacionales
GDPR_INTERNATIONAL_TRANSFERS=false
GDPR_APPROVED_COUNTRIES=ES,FR,DE,IT

# Gestión de consentimientos
GDPR_EXPLICIT_CONSENT_REQUIRED=true
GDPR_CONSENT_RENEWAL_DAYS=730  # 2 años

# Configuración de seguridad
GDPR_PASSWORD_MIN_LENGTH=12
GDPR_PASSWORD_REQUIRE_SYMBOLS=true
GDPR_SESSION_TIMEOUT_MINUTES=30
GDPR_MAX_LOGIN_ATTEMPTS=5

# Auditoría y monitoreo
GDPR_AUDIT_RETENTION_DAYS=2555  # 7 años para logs de auditoría
GDPR_SUSPICIOUS_ACTIVITY_THRESHOLD=10
GDPR_BREACH_DETECTION_ENABLED=true

# Derechos del titular
GDPR_ACCESS_REQUEST_RESPONSE_DAYS=30
GDPR_ERASURE_REQUEST_RESPONSE_DAYS=30
GDPR_PORTABILITY_FORMATS=json,csv,pdf

# Notificaciones
GDPR_DPA_NOTIFICATION_HOURS=72
GDPR_INDIVIDUAL_NOTIFICATION_HOURS=72

# Desarrollo/Testing (NO USAR EN PRODUCCIÓN)
GDPR_DEMO_MODE=true
GDPR_SKIP_VERIFICATION=false
```

## ⚠️ IMPORTANTE PARA PRODUCCIÓN

### 1. Claves de Encriptación
- Generar claves aleatorias de 256 bits mínimo
- Usar servicios como AWS KMS, Azure Key Vault, o HSM
- NUNCA hardcodear claves en código

### 2. Data Protection Officer
- Designar DPO certificado si procesas >5000 registros/año
- Actualizar información de contacto real
- Establecer procedimientos de contacto

### 3. Configuración de Seguridad
- Passwords de mínimo 12 caracteres con símbolos
- Sessions timeout de máximo 30 minutos
- Límites estrictos de intentos de login

### 4. Monitoreo
- Configurar alertas automáticas
- Revisar logs de auditoría semanalmente
- Establecer procedimientos de breach response

## 🚀 Comandos de Verificación

```bash
# Verificar que las variables están configuradas
node -e "console.log('MEDICAL_ENCRYPTION_KEY:', process.env.MEDICAL_ENCRYPTION_KEY ? '✅ Configurada' : '❌ Faltante')"

# Ejecutar demo de GDPR
npx ts-node examples/gdpr-compliance-demo.ts

# Compilar y verificar
npm run build
```