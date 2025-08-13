# Configuración de Variables de Entorno

## Crear archivo .env

Crea un archivo `.env` en el directorio `backend/` con el siguiente contenido:

```env
# Configuración de la base de datos
DATABASE_URL="sqlite:./prisma/dev.db"

# Configuración JWT
JWT_SECRET="tu-secreto-jwt-aqui"

# Configuración del servidor
PORT=3002
NODE_ENV=development

# Configuración de HuliPractice (Expedientes Médicos)
HULI_API_KEY="_CgwYr2Mj69qy8d8-j1mbWbq9rMPiLBpaDbR8lRy-juZI"
HULI_ORGANIZATION_ID="106829"
HULI_USER_ID="112252"
HULI_BASE_URL="https://api.hulipractice.com/v1"

# Configuración de Google Calendar (opcional)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/api/auth/google/callback"

# Configuración de WhatsApp (opcional)
TWILIO_ACCOUNT_SID="tu-twilio-account-sid"
TWILIO_AUTH_TOKEN="tu-twilio-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+1234567890"

# Configuración de Facturación (opcional)
FACTURACION_API_KEY="tu-api-key-facturacion"
FACTURACION_URL="https://api.facturacion.ejemplo.com"
```

## Variables Requeridas para Huli

### HULI_API_KEY
- **Valor**: `_CgwYr2Mj69qy8d8-j1mbWbq9rMPiLBpaDbR8lRy-juZI`
- **Descripción**: API key proporcionada por HuliPractice
- **Estado**: ACTIVE

### HULI_ORGANIZATION_ID
- **Valor**: `106829`
- **Descripción**: ID de la organización en HuliPractice

### HULI_USER_ID
- **Valor**: `112252`
- **Descripción**: ID del usuario en HuliPractice

### HULI_BASE_URL
- **Valor**: `https://api.hulipractice.com/v1`
- **Descripción**: URL base de la API de HuliPractice

## Verificación

Para verificar que la configuración es correcta:

1. Asegúrate de que el archivo `.env` esté en el directorio `backend/`
2. Reinicia el servidor después de crear/modificar el archivo
3. Ejecuta el script de prueba:

```bash
cd backend
node test-huli-integration.js
```

## Notas de Seguridad

- **NUNCA** subas el archivo `.env` al repositorio
- El archivo `.env` ya está incluido en `.gitignore`
- Mantén las credenciales de Huli seguras
- Rota las API keys periódicamente 