import request from 'supertest';
import express from 'express';
import { validateBody, validateParams, validateQuery, getValidatedBody, getValidatedParams, getValidatedQuery } from '../../backend/middleware/validation';
import { createUsuarioSchema, usuarioIdSchema, paginationSchema } from '../../backend/schemas/validationSchemas';

// Crear una app de prueba
const app = express();
app.use(express.json());

// Ruta de prueba para validación de body
app.post('/test-body', 
  validateBody(createUsuarioSchema),
  (req, res) => {
    const data = getValidatedBody(req);
    res.json({ success: true, data });
  }
);

// Ruta de prueba para validación de params
app.get('/test-params/:id',
  validateParams(usuarioIdSchema),
  (req, res) => {
    const data = getValidatedParams(req);
    res.json({ success: true, data });
  }
);

// Ruta de prueba para validación de query
app.get('/test-query',
  validateQuery(paginationSchema),
  (req, res) => {
    const data = getValidatedQuery(req);
    res.json({ success: true, data });
  }
);

// Ruta de prueba para validación múltiple
app.post('/test-multiple/:id',
  validateParams(usuarioIdSchema),
  validateBody(createUsuarioSchema),
  (req, res) => {
    const params = getValidatedParams(req);
    const body = getValidatedBody(req);
    res.json({ success: true, params, body });
  }
);

describe('Validation Middleware Tests', () => {
  
  describe('validateBody', () => {
    const validUsuario = {
      nombre: 'Juan Pérez',
      apellido: 'García',
      email: 'juan@example.com',
      telefono: '1234567890',
      rol: 'DOCTOR',
      consultorio_id: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('debe permitir datos válidos', async () => {
      const response = await request(app)
        .post('/test-body')
        .send(validUsuario)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(validUsuario);
    });

    it('debe rechazar datos inválidos', async () => {
      const invalidUsuario = { ...validUsuario, email: 'email-invalido' };
      
      const response = await request(app)
        .post('/test-body')
        .send(invalidUsuario)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.issues).toBeDefined();
    });

    it('debe rechazar datos faltantes', async () => {
      const incompleteUsuario = { nombre: 'Juan' };
      
      const response = await request(app)
        .post('/test-body')
        .send(incompleteUsuario)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('validateParams', () => {
    it('debe permitir parámetros válidos', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/test-params/${validId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validId);
    });

    it('debe rechazar parámetros inválidos', async () => {
      const invalidId = 'invalid-uuid';
      
      const response = await request(app)
        .get(`/test-params/${invalidId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('validateQuery', () => {
    it('debe permitir query params válidos', async () => {
      const response = await request(app)
        .get('/test-query?page=1&limit=10&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.sortOrder).toBe('desc');
    });

    it('debe usar valores por defecto', async () => {
      const response = await request(app)
        .get('/test-query')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.sortOrder).toBe('desc');
    });

    it('debe rechazar query params inválidos', async () => {
      const response = await request(app)
        .get('/test-query?page=-1&limit=1000')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('validateMultiple', () => {
    const validUsuario = {
      nombre: 'Juan Pérez',
      apellido: 'García',
      email: 'juan@example.com',
      telefono: '1234567890',
      rol: 'DOCTOR',
      consultorio_id: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('debe validar múltiples tipos de datos', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .post(`/test-multiple/${validId}`)
        .send(validUsuario)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.params.id).toBe(validId);
      expect(response.body.body).toEqual(validUsuario);
    });

    it('debe rechazar si alguno de los datos es inválido', async () => {
      const invalidId = 'invalid-uuid';
      
      const response = await request(app)
        .post(`/test-multiple/${invalidId}`)
        .send(validUsuario)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('debe retornar errores de Zod en formato correcto', async () => {
      const invalidUsuario = { nombre: '' };
      
      const response = await request(app)
        .post('/test-body')
        .send(invalidUsuario)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('issues');
      expect(Array.isArray(response.body.error.issues)).toBe(true);
      expect(response.body.error.issues[0]).toHaveProperty('message');
      expect(response.body.error.issues[0]).toHaveProperty('path');
    });

    it('debe manejar múltiples errores', async () => {
      const invalidUsuario = {
        nombre: '',
        email: 'invalid-email',
        telefono: '123'
      };
      
      const response = await request(app)
        .post('/test-body')
        .send(invalidUsuario)
        .expect(400);

      expect(response.body.error.issues.length).toBeGreaterThan(1);
    });
  });

  describe('Helper Functions', () => {
    it('getValidatedBody debe retornar datos válidos', async () => {
      const validUsuario = {
        nombre: 'Juan Pérez',
        apellido: 'García',
        email: 'juan@example.com',
        telefono: '1234567890',
        rol: 'DOCTOR',
        consultorio_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const response = await request(app)
        .post('/test-body')
        .send(validUsuario)
        .expect(200);

      expect(response.body.data).toEqual(validUsuario);
    });

    it('getValidatedParams debe retornar parámetros válidos', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/test-params/${validId}`)
        .expect(200);

      expect(response.body.data.id).toBe(validId);
    });

    it('getValidatedQuery debe retornar query params válidos', async () => {
      const response = await request(app)
        .get('/test-query?page=5&limit=25')
        .expect(200);

      expect(response.body.data.page).toBe(5);
      expect(response.body.data.limit).toBe(25);
    });
  });
}); 