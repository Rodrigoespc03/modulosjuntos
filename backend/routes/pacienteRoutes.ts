import { Router } from 'express';
import * as pacienteController from '../controllers/pacienteController';
import asyncHandler from '../utils/asyncHandler';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

router.get('/', authenticateMultiTenant, pacienteController.getAllPacientes);
router.get('/search', authenticateMultiTenant, pacienteController.searchPacientes);
router.get('/:id', authenticateMultiTenant, ...pacienteController.getPacienteById);
router.post('/', authenticateMultiTenant, ...pacienteController.createPaciente);
router.put('/:id', authenticateMultiTenant, ...pacienteController.updatePaciente);
router.delete('/:id', authenticateMultiTenant, ...pacienteController.deletePaciente);

export default router; 