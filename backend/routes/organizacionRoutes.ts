import { Router } from 'express';
import {
  getAllOrganizaciones,
  getOrganizacionById,
  createOrganizacion,
  updateOrganizacion,
  deleteOrganizacion,
  getOrganizacionStats
} from '../controllers/organizacionController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Rutas públicas para crear organizaciones (sign-up)
router.post('/', createOrganizacion);

// Rutas protegidas que requieren autenticación multi-tenant
router.get('/', authenticateMultiTenant, getAllOrganizaciones);
router.get('/:id', authenticateMultiTenant, getOrganizacionById);
router.put('/:id', authenticateMultiTenant, updateOrganizacion);
router.delete('/:id', authenticateMultiTenant, deleteOrganizacion);
router.get('/:id/stats', authenticateMultiTenant, getOrganizacionStats);

export default router; 
 
 