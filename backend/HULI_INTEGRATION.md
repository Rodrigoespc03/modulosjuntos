# Integración con HuliPractice - Expedientes Médicos

## Configuración

### Variables de Entorno

Agregar las siguientes variables al archivo `.env` del backend:

```env
# Configuración de HuliPractice
HULI_API_KEY=_CgwYr2Mj69qy8d8-j1mbWbq9rMPiLBpaDbR8lRy-juZI
HULI_ORGANIZATION_ID=106829
HULI_USER_ID=112252
HULI_BASE_URL=https://api.hulipractice.com/v1
```

### Información del API Key

- **ID**: 858
- **Organization ID**: 106829
- **User ID**: 112252
- **API Key**: _CgwYr2Mj69qy8d8-j1mbWbq9rMPiLBpaDbR8lRy-juZI
- **Status**: ACTIVE
- **Created**: 2025-08-04T23:28:03Z
- **Modified**: 2025-08-04T23:28:03Z

## Endpoints Disponibles

### Prueba de Conexión
- `GET /api/huli/test-connection` - Verificar conexión con Huli

### Pacientes
- `GET /api/huli/patients` - Obtener lista de pacientes
- `GET /api/huli/patients/:patientId` - Obtener paciente específico
- `POST /api/huli/patients` - Crear nuevo paciente
- `POST /api/huli/patients/:patientId/sync` - Sincronizar paciente con sistema local

### Citas
- `GET /api/huli/appointments` - Obtener lista de citas
- `GET /api/huli/appointments/:appointmentId` - Obtener cita específica
- `POST /api/huli/appointments/:appointmentId/sync` - Sincronizar cita con sistema local

### Expedientes Médicos
- `GET /api/huli/medical-records` - Obtener expedientes médicos
- `GET /api/huli/medical-records/:recordId` - Obtener expediente específico
- `GET /api/huli/patients/:patientId/medical-records` - Obtener expedientes de un paciente

## Parámetros de Consulta

### Pacientes
- `page` (number): Número de página (default: 1)
- `limit` (number): Elementos por página (default: 20)
- `search` (string): Búsqueda por nombre
- `status` (string): Estado del paciente

### Citas
- `page` (number): Número de página
- `limit` (number): Elementos por página
- `patientId` (string): ID del paciente
- `doctorId` (string): ID del doctor
- `dateFrom` (string): Fecha desde (YYYY-MM-DD)
- `dateTo` (string): Fecha hasta (YYYY-MM-DD)
- `status` (string): Estado de la cita

### Expedientes Médicos
- `page` (number): Número de página
- `limit` (number): Elementos por página
- `patientId` (string): ID del paciente
- `doctorId` (string): ID del doctor
- `dateFrom` (string): Fecha desde
- `dateTo` (string): Fecha hasta

## Estructura de Datos

### Paciente (HuliPatient)
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  createdAt: string;
  updatedAt: string;
}
```

### Cita (HuliAppointment)
```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number; // en minutos
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Expediente Médico (HuliMedicalRecord)
```typescript
{
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
  };
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

## Uso

### Ejemplo de Prueba de Conexión
```bash
curl -X GET "http://localhost:3002/api/huli/test-connection" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ejemplo de Obtener Pacientes
```bash
curl -X GET "http://localhost:3002/api/huli/patients?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ejemplo de Obtener Expedientes de un Paciente
```bash
curl -X GET "http://localhost:3002/api/huli/patients/PATIENT_ID/medical-records" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Sincronización

El sistema incluye métodos para sincronizar datos entre Huli y el sistema local:

- `syncPatientWithLocalSystem()` - Sincroniza un paciente
- `syncAppointmentWithLocalSystem()` - Sincroniza una cita

Estos métodos están preparados para integrarse con Prisma y la base de datos local.

## Notas de Seguridad

- Todas las rutas requieren autenticación JWT
- El API key de Huli debe mantenerse seguro
- Los datos médicos son sensibles, asegurar transmisión segura
- Implementar logging para auditoría de acceso a expedientes

## Próximos Pasos

1. Implementar sincronización completa con Prisma
2. Crear interfaces de usuario para visualizar expedientes
3. Implementar webhooks para sincronización en tiempo real
4. Agregar validación de datos médicos
5. Implementar cache para optimizar consultas frecuentes 