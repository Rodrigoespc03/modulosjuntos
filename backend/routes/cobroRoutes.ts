import { Router } from 'express';
import * as cobroController from '../controllers/cobroController';
import { authenticateToken } from '../middleware/auth';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Rutas públicas (sin autenticación)
router.get('/', cobroController.getAllCobros);
router.get('/todos', cobroController.getAllCobrosIncludingCancelled);
router.get('/:id', cobroController.getCobroById);

// Rutas protegidas (requieren JWT en el header Authorization)
router.post('/', authenticateToken, cobroController.createCobro);
router.put('/:id', authenticateToken, cobroController.updateCobro);
router.delete('/:id', authenticateToken, cobroController.deleteCobro);

// Rutas para agregar servicios y conceptos al cobro
router.post('/:id/servicio', authenticateToken, cobroController.addServicioToCobro);
router.post('/:id/concepto', authenticateToken, cobroController.addConceptoToCobro);

export default router; 