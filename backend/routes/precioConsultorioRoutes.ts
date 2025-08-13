import { Router } from 'express';
import * as precioConsultorioController from '../controllers/precioConsultorioController';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/', precioConsultorioController.getAllPreciosConsultorio);
router.get('/:id', ...precioConsultorioController.getPrecioConsultorioById);
router.post('/', ...precioConsultorioController.createPrecioConsultorio);
router.put('/:id', ...precioConsultorioController.updatePrecioConsultorio);
router.delete('/:id', ...precioConsultorioController.deletePrecioConsultorio);

export default router; 