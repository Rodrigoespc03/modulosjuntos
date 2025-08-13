import { Router } from 'express';
import * as historialController from '../controllers/historialController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Todas las rutas requieren autenticación multi-tenant
router.use(authenticateMultiTenant);

// Obtener historial de un cobro específico
router.get('/cobro/:cobroId', historialController.getHistorialCobro);

// Obtener historial general con filtros
router.get('/general', historialController.getHistorialGeneral);

// Obtener estadísticas del historial
router.get('/estadisticas', historialController.getEstadisticasHistorial);

// Exportar historial
router.get('/exportar', historialController.exportarHistorial);

// Obtener historial de un usuario específico
router.get('/usuario/:usuarioId', historialController.getHistorialUsuario);

// Buscar en el historial
router.get('/buscar', historialController.buscarHistorial);

export default router; 
 
 