import { Router } from 'express';
import * as cobroConceptoController from '../controllers/cobroConceptoController';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/', cobroConceptoController.getAllCobroConceptos);
router.get('/:id', ...cobroConceptoController.getCobroConceptoById);
router.post('/', ...cobroConceptoController.createCobroConcepto);
router.put('/:id', ...cobroConceptoController.updateCobroConcepto);
router.delete('/:id', ...cobroConceptoController.deleteCobroConcepto);

export default router; 