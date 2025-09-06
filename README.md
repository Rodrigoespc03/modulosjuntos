# 🏥 Sistema de Cobros ProCura

Sistema integral de gestión de cobros médicos con facturación automática, notificaciones por WhatsApp y Email, y gestión completa de pacientes.

## 🚀 Características Principales

### 📋 Gestión de Pacientes
- ✅ Registro completo de pacientes
- ✅ Historial médico
- ✅ Gestión de consultorios
- ✅ Sistema de permisos por roles

### 💰 Sistema de Cobros
- ✅ Creación de cobros con múltiples conceptos
- ✅ Cálculo automático de totales
- ✅ Múltiples métodos de pago
- ✅ Historial de transacciones

### 📧 Sistema de Notificaciones
- ✅ **WhatsApp Business API** (principal)
- ✅ **Email SMTP** (fallback automático)
- ✅ Plantillas HTML profesionales
- ✅ Recordatorios de citas
- ✅ Notificaciones de cobros

### 🧾 Facturación Automática
- ✅ Integración con **Nimbus API**
- ✅ Generación automática de facturas
- ✅ Envío por email al paciente
- ✅ Gestión de estados de facturación

### 📊 Dashboard y Reportes
- ✅ Estadísticas en tiempo real
- ✅ Gráficos de ingresos
- ✅ Reportes de conceptos más cobrados
- ✅ Historial detallado de transacciones

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** + **Express.js**
- **TypeScript** para tipado estático
- **Prisma ORM** para base de datos
- **PostgreSQL** (Neon Database)
- **JWT** para autenticación
- **Nodemailer** para emails
- **WhatsApp Business API**

### Frontend
- **React 18** + **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **React Hook Form** + **Zod** para formularios
- **Axios** para peticiones HTTP
- **Lucide React** para iconos

### Base de Datos
- **PostgreSQL** (Neon Cloud)
- **Prisma** como ORM
- **Migraciones** automáticas

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- PostgreSQL (o cuenta en Neon)
- Cuenta de Gmail para emails
- Cuenta de WhatsApp Business (opcional)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/modulo-de-cobros.git
cd modulo-de-cobros
```

### 2. Instalar dependencias
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
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar las variables según tu configuración
nano .env
```

### 4. Configurar la base de datos
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. Ejecutar el sistema
```bash
# Desde la raíz del proyecto
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno Principales

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@host:5432/database"

# Servidor
PORT=3002
JWT_SECRET="tu_jwt_secret_super_seguro"

# Email (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu_email@gmail.com"
SMTP_PASS="tu_app_password"

# WhatsApp (opcional)
WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id"
WHATSAPP_ACCESS_TOKEN="tu_access_token"

# Nimbus (facturación)
NIMBUS_API_URL="https://api.nimbus.com"
NIMBUS_API_KEY="tu_api_key"
```

### Configuración de Gmail

1. **Habilitar 2-Step Verification** en tu cuenta de Google
2. **Generar App Password**:
   - Ve a Google Account → Security → 2-Step Verification
   - Selecciona "App passwords"
   - Genera una contraseña para "Mail"
   - Usa esta contraseña en `SMTP_PASS`

### Configuración de WhatsApp Business

1. **Crear cuenta de Meta Business**
2. **Configurar WhatsApp Business API**
3. **Obtener Phone Number ID y Access Token**
4. **Configurar webhook** (opcional)

## 🚀 Uso del Sistema

### 1. Acceso al Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

### 2. Flujo de Trabajo

#### Crear un Paciente
1. Ir a **Pacientes** → **Nuevo Paciente**
2. Llenar datos básicos (nombre, apellido, email, teléfono)
3. Guardar paciente

#### Crear un Cobro
1. Ir a **Cobros** → **Nuevo Cobro**
2. Seleccionar paciente
3. Agregar conceptos y cantidades
4. Seleccionar método de pago
5. **Opcional**: Marcar "Solicitar factura"
6. Guardar cobro

#### Sistema de Notificaciones
- **Automático**: Al crear cobro con factura
- **Manual**: Desde el módulo de notificaciones
- **Fallback**: Si WhatsApp falla, envía email automáticamente

## 📁 Estructura del Proyecto

```
modulo-de-cobros/
├── backend/                 # API Backend
│   ├── controllers/         # Controladores de rutas
│   ├── middleware/          # Middleware personalizado
│   ├── routes/             # Definición de rutas
│   ├── services/           # Lógica de negocio
│   ├── prisma/             # Esquema y migraciones
│   └── utils/              # Utilidades
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios de API
│   │   ├── hooks/          # Custom hooks
│   │   └── types/          # Tipos TypeScript
├── inventory-module/       # Módulo de inventario
└── docs/                   # Documentación
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `GET /api/me` - Obtener usuario actual
- `POST /api/logout` - Cerrar sesión

### Pacientes
- `GET /api/pacientes` - Listar pacientes
- `POST /api/pacientes` - Crear paciente
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

### Cobros
- `GET /api/cobros` - Listar cobros
- `POST /api/cobros` - Crear cobro
- `GET /api/cobros/:id` - Obtener cobro específico

### Notificaciones
- `POST /api/notifications/appointment-reminder` - Recordatorio de cita
- `POST /api/notifications/payment-notification` - Notificación de cobro
- `POST /api/notifications/test-email` - Probar email
- `GET /api/notifications/available-methods` - Métodos disponibles

### Facturación
- `POST /api/facturacion/enviar-nimbus` - Enviar a Nimbus
- `GET /api/facturacion/estado/:id` - Estado de factura

## 🧪 Testing

### Ejecutar Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Probar Sistema de Email
```bash
# Usar el endpoint de prueba
curl -X POST http://localhost:3002/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token" \
  -d '{"toEmail": "test@example.com", "toName": "Test User"}'
```

## 🚨 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar conexión
cd backend
npx prisma db push
```

### Error de Email
1. Verificar App Password de Gmail
2. Revisar logs del servidor
3. Probar con endpoint de test

### Error de WhatsApp
1. Verificar credenciales de Meta Business
2. El sistema automáticamente usa email como fallback

### Puerto en Uso
```bash
# Encontrar proceso usando puerto 3002
netstat -ano | findstr :3002

# Terminar proceso
taskkill /PID <PID> /F
```

## 📈 Monitoreo y Logs

### Logs del Sistema
- **Backend**: Logs en consola con timestamps
- **Frontend**: Logs en DevTools
- **Base de datos**: Logs de Prisma

### Métricas de Rendimiento
- Tiempo de respuesta de API
- Uso de memoria
- Conexiones a base de datos

## 🔒 Seguridad

### Medidas Implementadas
- ✅ **JWT** para autenticación
- ✅ **Bcrypt** para hash de contraseñas
- ✅ **Rate limiting** en endpoints
- ✅ **CORS** configurado
- ✅ **Validación** de entrada con Zod
- ✅ **Sanitización** de datos

### Recomendaciones
- Cambiar `JWT_SECRET` en producción
- Usar HTTPS en producción
- Configurar firewall
- Monitorear logs de seguridad

## 🤝 Contribución

### Cómo Contribuir
1. Fork el repositorio
2. Crear branch para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push al branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- **TypeScript** estricto
- **ESLint** + **Prettier**
- **Conventional Commits**
- **Tests** para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

### Contacto
- **Email**: soporte@procura.com
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/modulo-de-cobros/wiki)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/modulo-de-cobros/issues)

### FAQ

**P: ¿Cómo cambio la configuración de email?**
R: Edita las variables `SMTP_*` en el archivo `.env` y reinicia el servidor.

**P: ¿El sistema funciona sin WhatsApp?**
R: Sí, el sistema usa email como fallback automático.

**P: ¿Cómo hago backup de la base de datos?**
R: Usa `npx prisma db pull` para exportar el esquema.

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] **App móvil** (React Native)
- [ ] **Integración con más proveedores** de facturación
- [ ] **Sistema de reportes** avanzados
- [ ] **API pública** para integraciones
- [ ] **Multi-idioma** (i18n)
- [ ] **Tema oscuro** en frontend

### Mejoras Técnicas
- [ ] **Docker** para deployment
- [ ] **CI/CD** con GitHub Actions
- [ ] **Tests E2E** con Playwright
- [ ] **Monitoreo** con Prometheus
- [ ] **Cache** con Redis

---

**Desarrollado con ❤️ para el sector salud**