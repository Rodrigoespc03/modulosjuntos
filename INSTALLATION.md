# 🚀 Guía de Instalación - Sistema de Cobros ProCura

Esta guía te llevará paso a paso para instalar y configurar el Sistema de Cobros ProCura en tu entorno local.

## 📋 Prerrequisitos

### Software Requerido
- **Node.js** 18.0 o superior
- **npm** 8.0 o superior (viene con Node.js)
- **Git** para clonar el repositorio
- **PostgreSQL** o cuenta en **Neon Database**

### Cuentas de Servicios Externos
- **Gmail** (para notificaciones por email)
- **Meta Business** (opcional, para WhatsApp)
- **Nimbus** (opcional, para facturación)

## 🔧 Instalación Paso a Paso

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/modulo-de-cobros.git
cd modulo-de-cobros
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install

# Instalar dependencias del módulo de inventario
cd ../inventory-module
npm install

# Volver a la raíz
cd ..
```

### Paso 3: Configurar Base de Datos

#### Opción A: Usar Neon Database (Recomendado)

1. **Crear cuenta en [Neon](https://neon.tech)**
2. **Crear nueva base de datos**
3. **Copiar la connection string**

#### Opción B: PostgreSQL Local

1. **Instalar PostgreSQL**
2. **Crear base de datos**:
   ```sql
   CREATE DATABASE procura_cobros;
   ```

### Paso 4: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar el archivo .env
nano .env
```

#### Configuración Mínima Requerida

```env
# Base de datos (REQUERIDO)
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"

# Servidor (REQUERIDO)
NODE_ENV=development
JWT_SECRET="tu_jwt_secret_super_seguro_aqui"
PORT=3002

# Email (REQUERIDO para notificaciones)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu_email@gmail.com"
SMTP_PASS="tu_app_password_de_gmail"
FROM_EMAIL="tu_email@gmail.com"
```

### Paso 5: Configurar Gmail para Emails

#### 5.1 Habilitar 2-Step Verification
1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. Activa **2-Step Verification**

#### 5.2 Generar App Password
1. En **2-Step Verification**, busca **App passwords**
2. Selecciona **Mail** como aplicación
3. Copia la contraseña generada (16 caracteres)
4. Usa esta contraseña en `SMTP_PASS`

### Paso 6: Configurar Base de Datos

```bash
cd backend

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push

# (Opcional) Ver datos en Prisma Studio
npx prisma studio
```

### Paso 7: Ejecutar el Sistema

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- **Backend** en http://localhost:3002
- **Frontend** en http://localhost:5173
- **Módulo de Inventario** en http://localhost:3000

## ✅ Verificación de Instalación

### 1. Verificar Backend
```bash
curl http://localhost:3002/health
```
**Respuesta esperada**: `healthy`

### 2. Verificar Frontend
- Abrir http://localhost:5173
- Deberías ver la página de login

### 3. Verificar Base de Datos
```bash
cd backend
npx prisma studio
```
- Deberías ver las tablas creadas

### 4. Probar Sistema de Email
```bash
# Usar el endpoint de prueba (requiere autenticación)
curl -X POST http://localhost:3002/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token" \
  -d '{"toEmail": "tu_email@gmail.com", "toName": "Test User"}'
```

## 🔧 Configuración Avanzada

### Configurar WhatsApp Business (Opcional)

1. **Crear cuenta en [Meta Business](https://business.facebook.com)**
2. **Configurar WhatsApp Business API**
3. **Obtener credenciales**:
   - Phone Number ID
   - Access Token
4. **Agregar al .env**:
   ```env
   WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id"
   WHATSAPP_ACCESS_TOKEN="tu_access_token"
   ```

### Configurar Nimbus para Facturación (Opcional)

1. **Crear cuenta en [Nimbus](https://nimbus.com)**
2. **Obtener API Key**
3. **Agregar al .env**:
   ```env
   NIMBUS_API_URL="https://api.nimbus.com"
   NIMBUS_API_KEY="tu_api_key"
   NIMBUS_COMPANY_ID="tu_company_id"
   ```

## 🚨 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate
```

### Error: "Database connection failed"
1. Verificar `DATABASE_URL` en `.env`
2. Verificar que la base de datos esté corriendo
3. Verificar credenciales

### Error: "Email sending failed"
1. Verificar App Password de Gmail
2. Verificar que 2-Step Verification esté activado
3. Revisar logs del servidor

### Error: "Port 3002 already in use"
```bash
# Encontrar proceso
netstat -ano | findstr :3002

# Terminar proceso
taskkill /PID <PID> /F
```

### Error: "JWT_SECRET not defined"
1. Agregar `JWT_SECRET` al archivo `.env`
2. Reiniciar el servidor

## 📊 Estructura de Archivos Después de la Instalación

```
modulo-de-cobros/
├── .env                    # Variables de entorno (NO subir a Git)
├── .gitignore             # Archivos ignorados por Git
├── README.md              # Documentación principal
├── INSTALLATION.md        # Esta guía
├── env.example            # Ejemplo de variables de entorno
├── package.json           # Scripts del proyecto
├── backend/               # API Backend
│   ├── .env              # Variables de entorno del backend
│   ├── prisma/
│   │   ├── schema.prisma # Esquema de base de datos
│   │   └── migrations/   # Migraciones aplicadas
│   └── node_modules/     # Dependencias del backend
├── frontend/             # Aplicación React
│   ├── src/              # Código fuente
│   └── node_modules/     # Dependencias del frontend
└── inventory-module/     # Módulo de inventario
    └── node_modules/     # Dependencias del inventario
```

## 🎯 Próximos Pasos

Después de la instalación exitosa:

1. **Crear usuario administrador** (si no existe)
2. **Configurar organizaciones** en la base de datos
3. **Probar flujo completo**:
   - Crear paciente
   - Crear cobro
   - Enviar notificación
4. **Configurar backup** de base de datos
5. **Configurar monitoreo** (opcional)

## 📞 Soporte

Si encuentras problemas durante la instalación:

1. **Revisar logs** del servidor
2. **Verificar configuración** de variables de entorno
3. **Consultar documentación** en README.md
4. **Crear issue** en GitHub con detalles del error

---

**¡Instalación completada! 🎉**

El sistema está listo para usar. Ve a http://localhost:5173 para comenzar.
