# 📚 DOCUMENTACIÓN COMPLETA DEL SISTEMA INTEGRADO PROCURA

## 🎯 Descripción General

El **Sistema Integrado ProCura** es una plataforma multi-tenant para la gestión integral de clínicas médicas, que incluye módulos de cobros, inventario, citas, pacientes y usuarios, todo integrado con autenticación JWT y arquitectura multi-tenant.

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales:

1. **Backend Principal (Node.js/Express)**
   - Puerto: 3002
   - Base de datos: PostgreSQL
   - Autenticación: JWT
   - Multi-tenancy: Organizaciones independientes

2. **Frontend (React/Vite)**
   - Puerto: 5175
   - UI: React + Tailwind CSS
   - Estado: Context API
   - Navegación: React Router

3. **Módulo de Inventario (NestJS)**
   - Puerto: 3001
   - Base de datos: PostgreSQL (compartida)
   - API REST completa
   - Integración multi-tenant

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación:

1. **Login:**
   ```
   POST /api/login
   {
     "email": "usuario@clinica.com",
     "password": "contraseña"
   }
   ```

2. **Respuesta:**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": "user-id",
       "email": "usuario@clinica.com",
       "rol": "DOCTOR"
     }
   }
   ```

3. **Uso del Token:**
   ```
   Authorization: Bearer <token>
   ```

### Roles Disponibles:
- `DOCTOR`: Acceso completo
- `SECRETARIA`: Gestión de citas y cobros
- `ENFERMERA`: Gestión de inventario
- `ADMINISTRADOR`: Gestión de usuarios y configuración
- `PACIENTE`: Acceso limitado a citas propias

---

## 🏢 Sistema Multi-Tenant

### Estructura de Organizaciones:

```json
{
  "id": "org-123",
  "nombre": "Clínica ProCura",
  "ruc": "12345678901",
  "email": "admin@procura.com",
  "telefono": "+51 999 999 999",
  "direccion": "Av. Principal 123, Lima",
  "color_primario": "#3B82F6",
  "color_secundario": "#1F2937"
}
```

### Aislamiento de Datos:
- Cada organización tiene sus propios datos
- Filtrado automático por `organizacion_id`
- Usuarios solo ven datos de su organización

---

## 📋 Módulos del Sistema

### 1. Módulo de Cobros
- **Rutas:** `/api/cobros`
- **Funcionalidades:**
  - Crear/editar/eliminar cobros
  - Gestión de conceptos de cobro
  - Historial de cambios
  - Métodos de pago
  - Reportes financieros

### 2. Módulo de Pacientes
- **Rutas:** `/api/pacientes`
- **Funcionalidades:**
  - Registro de pacientes
  - Historial médico
  - Búsqueda avanzada
  - Gestión de contactos

### 3. Módulo de Citas
- **Rutas:** `/api/citas`
- **Funcionalidades:**
  - Programación de citas
  - Disponibilidad de médicos
  - Bloqueos de horarios
  - Integración con Google Calendar

### 4. Módulo de Inventario
- **Rutas:** `/api/inventory` (puerto 3001)
- **Funcionalidades:**
  - Gestión de productos
  - Control de stock
  - Entradas y salidas
  - Alertas de expiración
  - Dashboard de métricas

### 5. Módulo de Usuarios
- **Rutas:** `/api/usuarios`
- **Funcionalidades:**
  - Gestión de usuarios
  - Asignación de roles
  - Permisos granulares
  - Configuración de consultorios

---

## 🔧 APIs Principales

### Autenticación:
```bash
POST /api/login                    # Login de usuario
POST /api/register                 # Registro de usuario
GET  /api/permisos/mis-permisos    # Obtener permisos del usuario
```

### Gestión de Datos:
```bash
GET    /api/usuarios               # Listar usuarios
POST   /api/usuarios               # Crear usuario
PUT    /api/usuarios/:id           # Actualizar usuario
DELETE /api/usuarios/:id           # Eliminar usuario

GET    /api/pacientes              # Listar pacientes
POST   /api/pacientes              # Crear paciente
PUT    /api/pacientes/:id          # Actualizar paciente

GET    /api/cobros                 # Listar cobros
POST   /api/cobros                 # Crear cobro
PUT    /api/cobros/:id             # Actualizar cobro
```

### Inventario:
```bash
GET    /api/health                 # Salud del módulo
GET    /api/products               # Listar productos
POST   /api/products               # Crear producto
GET    /api/dashboard              # Dashboard de métricas
```

---

## 🌐 URLs de Acceso

### Desarrollo:
- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:3002/api
- **Inventario API:** http://localhost:3001/api

### Producción:
- **Frontend:** https://app.procura.com
- **Backend API:** https://api.procura.com
- **Inventario API:** https://inventory.procura.com

---

## 📊 Dashboard y Métricas

### Métricas Disponibles:
- Total de cobros del día/mes
- Pacientes atendidos
- Productos en inventario
- Alertas de stock bajo
- Productos próximos a expirar
- Movimientos de inventario

### Reportes:
- Reporte financiero mensual
- Historial de cobros
- Uso de inventario
- Productividad de médicos

---

## 🔒 Seguridad

### Medidas Implementadas:
- Autenticación JWT
- Middleware de autorización por roles
- Filtrado multi-tenant automático
- Validación de datos con class-validator
- CORS configurado
- Headers de seguridad

### Buenas Prácticas:
- Tokens con expiración
- Contraseñas hasheadas
- Validación de entrada
- Logs de auditoría
- Backup automático de datos

---

## 🛠️ Instalación y Configuración

### Requisitos:
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Variables de Entorno:
```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/procura_db"

# JWT
JWT_SECRET="tu_secreto_jwt_super_seguro_2024"

# Puertos
PORT=3002
INVENTORY_PORT=3001
FRONTEND_PORT=5175

# Google Calendar (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Comandos de Instalación:
```bash
# Instalar dependencias
npm run install:all

# Configurar base de datos
npm run prisma:migrate

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

---

## 📱 Uso del Sistema

### Flujo Típico de Usuario:

1. **Login:** Acceder con email y contraseña
2. **Dashboard:** Ver métricas y alertas
3. **Gestión:** Usar módulos según permisos
4. **Reportes:** Generar reportes necesarios

### Flujo de Cobro:
1. Seleccionar paciente
2. Agregar conceptos de cobro
3. Seleccionar método de pago
4. Confirmar cobro
5. Generar comprobante

### Flujo de Inventario:
1. Registrar entrada de productos
2. Controlar stock disponible
3. Registrar salidas por uso
4. Monitorear alertas

---

## 🔧 Mantenimiento

### Backup:
- Base de datos: Diario automático
- Archivos: Semanal
- Configuración: Mensual

### Monitoreo:
- Logs de aplicación
- Métricas de rendimiento
- Alertas de errores
- Uso de recursos

### Actualizaciones:
- Dependencias: Mensual
- Seguridad: Inmediato
- Funcionalidades: Trimestral

---

## 📞 Soporte

### Contacto:
- **Email:** soporte@procura.com
- **Teléfono:** +51 999 999 999
- **Horario:** Lunes a Viernes 9:00 - 18:00

### Documentación Adicional:
- **API Docs:** https://docs.procura.com
- **Guías de Usuario:** https://help.procura.com
- **Videos Tutoriales:** https://tutorials.procura.com

---

## 🚀 Próximos Pasos

### Funcionalidades Planificadas:
- [ ] Sistema de registro de organizaciones
- [ ] Onboarding de usuarios
- [ ] Integración con WhatsApp
- [ ] App móvil
- [ ] Facturación electrónica
- [ ] Telemedicina

---

## 📋 Estado Actual del Sistema

### ✅ Componentes Funcionando (100%):
- Backend Principal (puerto 3002)
- Frontend (puerto 5175)
- Módulo de Inventario (puerto 3001)
- Sistema de Permisos Multi-Tenant
- Autenticación JWT
- Base de datos PostgreSQL

### 🌐 URLs Activas:
- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:3002/api
- **Inventario API:** http://localhost:3001/api

### 🔐 Credenciales de Prueba:
- **Email:** rodrigoespc03@gmail.com
- **Password:** 123456
- **Rol:** DOCTOR

---

**Documentación creada el:** 5 de Agosto, 2025  
**Versión del sistema:** 1.0.0  
**Estado:** ✅ FUNCIONANDO AL 100% 