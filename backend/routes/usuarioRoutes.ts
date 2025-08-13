import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

router.get('/', authenticateMultiTenant, usuarioController.getAllUsuarios);
router.get('/:id', authenticateMultiTenant, usuarioController.getUsuarioById);
router.post('/', authenticateMultiTenant, usuarioController.createUsuario);
router.put('/:id', authenticateMultiTenant, usuarioController.updateUsuario);
router.delete('/:id', authenticateMultiTenant, usuarioController.deleteUsuario);

export default router; 