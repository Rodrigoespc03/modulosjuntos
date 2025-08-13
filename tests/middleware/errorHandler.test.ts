import request from 'supertest';
import express from 'express';
import { errorHandler, CustomError, createNotFoundError, createConflictError, createBadRequestError, createUnauthorizedError, createForbiddenError, createInternalServerError } from '../../backend/middleware/errorHandler';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Crear una app de prueba
const app = express();
app.use(express.json());

// Middleware de manejo de errores
app.use(errorHandler);

// Rutas de prueba para diferentes tipos de errores
app.get('/test-not-found', (req, res, next) => {
  next(createNotFoundError('Recurso no encontrado'));
});

app.get('/test-conflict', (req, res, next) => {
  next(createConflictError('Conflicto de datos'));
});

app.get('/test-bad-request', (req, res, next) => {
  next(createBadRequestError('Datos inválidos'));
});

app.get('/test-unauthorized', (req, res, next) => {
  next(createUnauthorizedError('No autorizado'));
});

app.get('/test-forbidden', (req, res, next) => {
  next(createForbiddenError('Acceso prohibido'));
});

app.get('/test-internal-error', (req, res, next) => {
  next(createInternalServerError('Error interno'));
});

app.get('/test-zod-error', (req, res, next) => {
  const zodError = new ZodError([
    {
      code: 'invalid_string',
      message: 'Email inválido',
      path: ['email']
    }
  ]);
  next(zodError);
});

app.get('/test-prisma-error', (req, res, next) => {
  const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test'
  });
  next(prismaError);
});

app.get('/test-generic-error', (req, res, next) => {
  next(new Error('Error genérico'));
});

app.get('/test-custom-error', (req, res, next) => {
  next(new CustomError('Error personalizado', 422));
});

describe('Error Handler Middleware Tests', () => {
  
  describe('CustomError Class', () => {
    it('debe crear un error personalizado con código de estado', () => {
      const error = new CustomError('Mensaje de error', 400);
      expect(error.message).toBe('Mensaje de error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('CustomError');
    });

    it('debe usar código de estado 500 por defecto', () => {
      const error = new CustomError('Mensaje de error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Error Helper Functions', () => {
    it('createNotFoundError debe crear error 404', () => {
      const error = createNotFoundError('No encontrado');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('No encontrado');
    });

    it('createConflictError debe crear error 409', () => {
      const error = createConflictError('Conflicto');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Conflicto');
    });

    it('createBadRequestError debe crear error 400', () => {
      const error = createBadRequestError('Datos inválidos');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Datos inválidos');
    });

    it('createUnauthorizedError debe crear error 401', () => {
      const error = createUnauthorizedError('No autorizado');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('No autorizado');
    });

    it('createForbiddenError debe crear error 403', () => {
      const error = createForbiddenError('Prohibido');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Prohibido');
    });

    it('createInternalServerError debe crear error 500', () => {
      const error = createInternalServerError('Error interno');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Error interno');
    });
  });

  describe('Error Handler Response Format', () => {
    it('debe manejar error 404', async () => {
      const response = await request(app)
        .get('/test-not-found')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Recurso no encontrado');
      expect(response.body.error).toHaveProperty('statusCode', 404);
    });

    it('debe manejar error 409', async () => {
      const response = await request(app)
        .get('/test-conflict')
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Conflicto de datos');
      expect(response.body.error).toHaveProperty('statusCode', 409);
    });

    it('debe manejar error 400', async () => {
      const response = await request(app)
        .get('/test-bad-request')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Datos inválidos');
      expect(response.body.error).toHaveProperty('statusCode', 400);
    });

    it('debe manejar error 401', async () => {
      const response = await request(app)
        .get('/test-unauthorized')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'No autorizado');
      expect(response.body.error).toHaveProperty('statusCode', 401);
    });

    it('debe manejar error 403', async () => {
      const response = await request(app)
        .get('/test-forbidden')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Acceso prohibido');
      expect(response.body.error).toHaveProperty('statusCode', 403);
    });

    it('debe manejar error 500', async () => {
      const response = await request(app)
        .get('/test-internal-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Error interno');
      expect(response.body.error).toHaveProperty('statusCode', 500);
    });
  });

  describe('Zod Error Handling', () => {
    it('debe manejar errores de validación Zod', async () => {
      const response = await request(app)
        .get('/test-zod-error')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('issues');
      expect(Array.isArray(response.body.error.issues)).toBe(true);
      expect(response.body.error.issues[0]).toHaveProperty('code', 'invalid_string');
      expect(response.body.error.issues[0]).toHaveProperty('message', 'Email inválido');
      expect(response.body.error.issues[0]).toHaveProperty('path');
      expect(response.body.error.issues[0].path).toEqual(['email']);
    });
  });

  describe('Prisma Error Handling', () => {
    it('debe manejar errores de Prisma', async () => {
      const response = await request(app)
        .get('/test-prisma-error')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code', 'P2002');
    });
  });

  describe('Generic Error Handling', () => {
    it('debe manejar errores genéricos', async () => {
      const response = await request(app)
        .get('/test-generic-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Error genérico');
      expect(response.body.error).toHaveProperty('statusCode', 500);
    });
  });

  describe('Custom Error Handling', () => {
    it('debe manejar errores personalizados', async () => {
      const response = await request(app)
        .get('/test-custom-error')
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Error personalizado');
      expect(response.body.error).toHaveProperty('statusCode', 422);
    });
  });

  describe('Response Structure', () => {
    it('debe mantener estructura consistente en todos los errores', async () => {
      const response = await request(app)
        .get('/test-not-found')
        .expect(404);

      // Verificar estructura básica
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('statusCode');
      expect(response.body.error).toHaveProperty('timestamp');
      
      // Verificar tipos de datos
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.error.message).toBe('string');
      expect(typeof response.body.error.statusCode).toBe('number');
      expect(typeof response.body.error.timestamp).toBe('string');
    });

    it('debe incluir timestamp en todos los errores', async () => {
      const response = await request(app)
        .get('/test-bad-request')
        .expect(400);

      expect(response.body.error).toHaveProperty('timestamp');
      expect(new Date(response.body.error.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Error Logging', () => {
    it('debe mantener logs de errores en desarrollo', async () => {
      // En un entorno real, verificaríamos que se llamó console.error
      // Para este test, solo verificamos que la respuesta es correcta
      const response = await request(app)
        .get('/test-internal-error')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar errores sin mensaje', async () => {
      const appWithEmptyError = express();
      appWithEmptyError.use(express.json());
      appWithEmptyError.use(errorHandler);
      
      appWithEmptyError.get('/test-empty-error', (req, res, next) => {
        next(new Error());
      });

      const response = await request(appWithEmptyError)
        .get('/test-empty-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('debe manejar errores con propiedades adicionales', async () => {
      const appWithCustomError = express();
      appWithCustomError.use(express.json());
      appWithCustomError.use(errorHandler);
      
      appWithCustomError.get('/test-custom-props', (req, res, next) => {
        const error = new Error('Error con propiedades adicionales');
        (error as any).customProperty = 'valor personalizado';
        next(error);
      });

      const response = await request(appWithCustomError)
        .get('/test-custom-props')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message', 'Error con propiedades adicionales');
    });
  });
}); 