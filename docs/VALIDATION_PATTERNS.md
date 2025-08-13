# 📚 GUÍA DE PATRONES DE VALIDACIÓN - SISTEMA PROCURA

## 🎯 INTRODUCCIÓN

Esta guía documenta los patrones de validación implementados en el sistema ProCura usando **Zod** y **Express middleware**. Estos patrones proporcionan validación automática, manejo consistente de errores y una experiencia de desarrollo mejorada.

---

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura de Validación](#arquitectura-de-validación)
2. [Schemas de Validación](#schemas-de-validación)
3. [Middleware de Validación](#middleware-de-validación)
4. [Manejo de Errores](#manejo-de-errores)
5. [Patrones de Uso](#patrones-de-uso)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Ejemplos Prácticos](#ejemplos-prácticos)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ ARQUITECTURA DE VALIDACIÓN

### **Componentes Principales:**

```
📁 backend/
├── 📁 schemas/
│   └── validationSchemas.ts          # Schemas de Zod
├── 📁 middleware/
│   ├── validation.ts                 # Middleware de validación
│   └── errorHandler.ts               # Manejo de errores
└── 📁 controllers/
    └── [controller].ts               # Controllers con validación
```

### **Flujo de Validación:**

```
Request → Middleware de Validación → Controller → Response
    ↓              ↓                    ↓           ↓
  Datos         Zod Schema          Lógica      Respuesta
  Crudos        Validación          Negocio     Validada
```

---

## 🔧 SCHEMAS DE VALIDACIÓN

### **Tipos de Schemas:**

#### **1. Schemas de Entrada (Body)**
```typescript
export const createUsuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('El email debe ser válido'),
  rol: RolEnum,
  consultorio_id: z.string().uuid('El ID del consultorio debe ser un UUID válido')
});
```

#### **2. Schemas de Parámetros (Params)**
```typescript
export const usuarioIdSchema = z.object({
  id: z.string().uuid('El ID del usuario debe ser un UUID válido')
});
```

#### **3. Schemas de Query (Query)**
```typescript
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(1),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(10),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});
```

#### **4. Schemas de Actualización (Update)**
```typescript
export const updateUsuarioSchema = createUsuarioSchema.partial();
```

### **Validaciones Avanzadas:**

#### **Validaciones Condicionales:**
```typescript
export const createCobroSchema = z.object({
  monto_total: z.number().positive('El monto debe ser positivo'),
  pagos: z.array(z.object({
    metodo: MetodoPagoEnum,
    monto: z.number().positive()
  }))
}).refine(
  (data) => {
    const totalPagos = data.pagos.reduce((sum, pago) => sum + pago.monto, 0);
    return Math.abs(totalPagos - data.monto_total) < 0.01;
  },
  {
    message: 'La suma de los métodos de pago debe coincidir con el monto total',
    path: ['pagos']
  }
);
```

#### **Validaciones de Fechas:**
```typescript
export const createCitaSchema = z.object({
  fecha_inicio: z.string().datetime('La fecha de inicio debe ser válida'),
  fecha_fin: z.string().datetime('La fecha de fin debe ser válida')
}).refine(
  (data) => new Date(data.fecha_fin) > new Date(data.fecha_inicio),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin']
  }
);
```

---

## 🔄 MIDDLEWARE DE VALIDACIÓN

### **Funciones Principales:**

#### **1. validateBody(schema)**
```typescript
import { validateBody } from '../middleware/validation';

export const createUsuario = [
  validateBody(createUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    // data está validado y tipado
  })
];
```

#### **2. validateParams(schema)**
```typescript
import { validateParams } from '../middleware/validation';

export const getUsuarioById = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    // id está validado y tipado
  })
];
```

#### **3. validateQuery(schema)**
```typescript
import { validateQuery } from '../middleware/validation';

export const getUsuarios = [
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = getValidatedQuery(req);
    // query está validado y tipado
  })
];
```

#### **4. validateRequest(schema)**
```typescript
import { validateRequest } from '../middleware/validation';

export const updateUsuario = [
  validateRequest({
    params: usuarioIdSchema,
    body: updateUsuarioSchema
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = getValidatedParams(req);
    const body = getValidatedBody(req);
  })
];
```

### **Funciones Helper:**

```typescript
// Obtener datos validados
const body = getValidatedBody(req);
const params = getValidatedParams(req);
const query = getValidatedQuery(req);
const allData = getValidatedData(req);
```

---

## ⚠️ MANEJO DE ERRORES

### **Tipos de Errores:**

#### **1. Errores de Validación (400)**
```typescript
// Automático cuando Zod falla
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "invalid_string",
        "message": "El email debe ser válido",
        "path": ["email"]
      }
    ],
    "statusCode": 400,
    "timestamp": "2024-08-08T10:30:00.000Z"
  }
}
```

#### **2. Errores Personalizados**
```typescript
import { createNotFoundError, createConflictError } from '../middleware/errorHandler';

// En el controller
if (!usuario) {
  throw createNotFoundError('Usuario no encontrado');
}

if (emailExists) {
  throw createConflictError('El email ya está registrado');
}
```

#### **3. Errores de Base de Datos**
```typescript
// Automático para errores de Prisma
{
  "success": false,
  "error": {
    "message": "Unique constraint failed",
    "code": "P2002",
    "statusCode": 400,
    "timestamp": "2024-08-08T10:30:00.000Z"
  }
}
```

### **Funciones de Error:**

```typescript
// Crear errores específicos
createNotFoundError(message)      // 404
createConflictError(message)      // 409
createBadRequestError(message)    // 400
createUnauthorizedError(message)  // 401
createForbiddenError(message)     // 403
createInternalServerError(message) // 500
```

---

## 🎯 PATRONES DE USO

### **Patrón 1: CRUD Básico**

```typescript
// CREATE
export const createUsuario = [
  validateBody(createUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    const usuario = await prisma.usuario.create({ data });
    res.status(201).json({ success: true, data: usuario });
  })
];

// READ
export const getUsuarioById = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw createNotFoundError('Usuario no encontrado');
    res.json({ success: true, data: usuario });
  })
];

// UPDATE
export const updateUsuario = [
  validateParams(usuarioIdSchema),
  validateBody(updateUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const data = getValidatedBody(req);
    const usuario = await prisma.usuario.update({ where: { id }, data });
    res.json({ success: true, data: usuario });
  })
];

// DELETE
export const deleteUsuario = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    await prisma.usuario.delete({ where: { id } });
    res.json({ success: true, message: 'Usuario eliminado' });
  })
];
```

### **Patrón 2: Listado con Paginación**

```typescript
export const getUsuarios = [
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sortOrder } = getValidatedQuery(req);
    
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: sortOrder }
      }),
      prisma.usuario.count()
    ]);

    res.json({
      success: true,
      data: usuarios,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  })
];
```

### **Patrón 3: Validaciones Complejas**

```typescript
export const createCobro = [
  validateBody(createCobroSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    
    // Validaciones adicionales de negocio
    const paciente = await prisma.paciente.findUnique({
      where: { id: data.paciente_id }
    });
    if (!paciente) throw createNotFoundError('Paciente no encontrado');

    const cobro = await prisma.cobro.create({
      data: {
        ...data,
        pagos: {
          create: data.pagos
        }
      },
      include: { pagos: true }
    });

    res.status(201).json({ success: true, data: cobro });
  })
];
```

### **Patrón 4: Integración Externa**

```typescript
export const syncHuliPatient = [
  validateParams(huliPatientIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = getValidatedParams(req);
    
    // Obtener datos del sistema externo
    const huliPatient = await huliService.getPatientById(patientId);
    
    // Sincronizar con sistema local
    const syncResult = await huliService.syncPatientWithLocalSystem(huliPatient);
    
    res.json({
      success: true,
      message: 'Paciente sincronizado correctamente',
      data: { huliPatient, syncResult }
    });
  })
];
```

---

## ✅ MEJORES PRÁCTICAS

### **1. Nomenclatura de Schemas**
```typescript
// ✅ Correcto
createUsuarioSchema
updateUsuarioSchema
usuarioIdSchema
paginationSchema

// ❌ Incorrecto
userSchema
updateSchema
idSchema
```

### **2. Mensajes de Error**
```typescript
// ✅ Correcto - Mensajes en español
z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
z.string().email('El email debe ser válido')

// ❌ Incorrecto - Mensajes genéricos
z.string().min(2, 'Invalid string')
z.string().email('Invalid email')
```

### **3. Validaciones Anidadas**
```typescript
// ✅ Correcto - Validación en el schema
export const createCobroSchema = z.object({
  monto_total: z.number().positive(),
  pagos: z.array(z.object({
    metodo: MetodoPagoEnum,
    monto: z.number().positive()
  }))
}).refine(/* validación personalizada */);

// ❌ Incorrecto - Validación en el controller
if (totalPagos !== monto_total) {
  throw createBadRequestError('Montos no coinciden');
}
```

### **4. Manejo de Errores**
```typescript
// ✅ Correcto - Usar funciones de error
if (!usuario) {
  throw createNotFoundError('Usuario no encontrado');
}

// ❌ Incorrecto - Respuestas directas
if (!usuario) {
  return res.status(404).json({ error: 'Usuario no encontrado' });
}
```

### **5. Tipado TypeScript**
```typescript
// ✅ Correcto - Usar tipos inferidos
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;

// En el controller
const data: CreateUsuarioInput = getValidatedBody(req);
```

---

## 🔍 EJEMPLOS PRÁCTICOS

### **Ejemplo 1: Validación de Fechas**

```typescript
// Schema
export const dateRangeSchema = z.object({
  fecha_inicio: z.string().datetime('La fecha de inicio debe ser válida'),
  fecha_fin: z.string().datetime('La fecha de fin debe ser válida')
}).refine(
  (data) => new Date(data.fecha_fin) > new Date(data.fecha_inicio),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin']
  }
);

// Controller
export const getReportes = [
  validateQuery(dateRangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { fecha_inicio, fecha_fin } = getValidatedQuery(req);
    
    const reportes = await prisma.reporte.findMany({
      where: {
        fecha: {
          gte: new Date(fecha_inicio),
          lte: new Date(fecha_fin)
        }
      }
    });

    res.json({ success: true, data: reportes });
  })
];
```

### **Ejemplo 2: Validación de Archivos**

```typescript
// Schema
export const uploadFileSchema = z.object({
  file: z.object({
    originalname: z.string().min(1, 'El nombre del archivo es requerido'),
    mimetype: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'application/pdf'].includes(type),
      'Solo se permiten archivos JPG, PNG y PDF'
    ),
    size: z.number().max(5 * 1024 * 1024, 'El archivo no debe superar 5MB')
  })
});

// Controller
export const uploadFile = [
  upload.single('file'),
  validateBody(uploadFileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { file } = getValidatedBody(req);
    
    // Procesar archivo
    const result = await fileService.processFile(file);
    
    res.json({ success: true, data: result });
  })
];
```

### **Ejemplo 3: Validación Condicional**

```typescript
// Schema
export const createPacienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('El email debe ser válido').optional(),
  telefono: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').optional(),
  fecha_nacimiento: z.string().datetime('La fecha de nacimiento debe ser válida').optional()
}).refine(
  (data) => data.email || data.telefono,
  {
    message: 'Debe proporcionar al menos un email o teléfono',
    path: ['email']
  }
);

// Controller
export const createPaciente = [
  validateBody(createPacienteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = getValidatedBody(req);
    
    const paciente = await prisma.paciente.create({ data });
    
    res.status(201).json({ success: true, data: paciente });
  })
];
```

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Error de Compilación TypeScript**

**Síntoma:** `Property 'validatedData' does not exist on type 'Request'`

**Solución:**
```typescript
// Asegúrate de importar los tipos correctos
import { getValidatedBody, getValidatedParams } from '../middleware/validation';

// Y usar las funciones helper
const data = getValidatedBody(req);
const params = getValidatedParams(req);
```

### **Problema 2: Validación No Funciona**

**Síntoma:** Los datos no se validan y llegan al controller sin validar

**Solución:**
```typescript
// ✅ Correcto - Usar middleware array
export const createUsuario = [
  validateBody(createUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Lógica del controller
  })
];

// ❌ Incorrecto - No usar middleware
export const createUsuario = asyncHandler(async (req: Request, res: Response) => {
  // Lógica del controller
});
```

### **Problema 3: Errores de Validación No Se Muestran**

**Síntoma:** Los errores de validación no aparecen en la respuesta

**Solución:**
```typescript
// Asegúrate de que el errorHandler esté configurado en index.ts
import { errorHandler } from './middleware/errorHandler';

app.use(errorHandler);
```

### **Problema 4: Schemas Duplicados**

**Síntoma:** `Cannot redeclare block-scoped variable`

**Solución:**
```typescript
// Revisa que no tengas schemas duplicados en validationSchemas.ts
// Cada schema debe tener un nombre único
export const usuarioIdSchema = z.object({ id: z.string().uuid() });
// No duplicar este schema en otro lugar
```

### **Problema 5: Performance Lenta**

**Síntoma:** Las validaciones toman mucho tiempo

**Solución:**
```typescript
// ✅ Optimizar schemas complejos
export const optimizedSchema = z.object({
  // Usar validaciones simples cuando sea posible
  nombre: z.string().min(2),
  email: z.string().email(),
  
  // Evitar validaciones complejas en el schema
  // Mover validaciones de negocio al controller
});

// En el controller
const data = getValidatedBody(req);
// Validaciones adicionales aquí si es necesario
```

---

## 📚 RECURSOS ADICIONALES

### **Documentación Oficial:**
- [Zod Documentation](https://zod.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Archivos de Referencia:**
- `backend/schemas/validationSchemas.ts` - Todos los schemas
- `backend/middleware/validation.ts` - Middleware de validación
- `backend/middleware/errorHandler.ts` - Manejo de errores
- `tests/validation/validationSchemas.test.ts` - Tests de schemas

### **Comandos Útiles:**
```bash
# Ejecutar tests de validación
npm test -- --testPathPattern="validation"

# Ejecutar tests de middleware
npm test -- --testPathPattern="middleware"

# Ejecutar tests de integración
npm test -- --testPathPattern="integration"
```

---

## 🤝 CONTRIBUCIÓN

### **Agregar Nuevos Schemas:**
1. Crear el schema en `validationSchemas.ts`
2. Agregar tests en `validationSchemas.test.ts`
3. Documentar el patrón de uso
4. Actualizar esta guía

### **Reportar Problemas:**
1. Crear un issue con descripción detallada
2. Incluir ejemplos de código
3. Especificar el comportamiento esperado vs actual
4. Adjuntar logs de error si es aplicable

---

**Última actualización:** 8 de Agosto, 2025  
**Versión:** 1.0.0  
**Autor:** Rodrigo Espinosa 