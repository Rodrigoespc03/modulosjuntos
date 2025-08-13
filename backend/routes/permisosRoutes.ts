import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  obtenerMisPermisos,
  obtenerUsuariosConsultorio,
  actualizarPermisosUsuario,
  obtenerConfiguracionPermisos,
  actualizarConfiguracionPermisos,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  verificarPermiso
} from '../controllers/permisosController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para obtener permisos del usuario actual
router.get('/mis-permisos', obtenerMisPermisos);
router.get('/verificar/:permiso', verificarPermiso);

// Rutas para gestión de usuarios (solo doctores)
router.get('/usuarios', requireRole(['DOCTOR']), obtenerUsuariosConsultorio);
router.post('/usuarios', requireRole(['DOCTOR']), crearUsuario);
router.put('/usuarios/:usuarioId', requireRole(['DOCTOR']), actualizarUsuario);
router.delete('/usuarios/:usuarioId', requireRole(['DOCTOR']), eliminarUsuario);

// Rutas para permisos de usuarios (solo doctores)
router.put('/usuarios/:usuarioId/permisos', requireRole(['DOCTOR']), actualizarPermisosUsuario);

// Rutas para configuración de permisos del consultorio (solo doctores)
router.get('/configuracion', requireRole(['DOCTOR']), obtenerConfiguracionPermisos);
router.put('/configuracion', requireRole(['DOCTOR']), actualizarConfiguracionPermisos);

export default router; 
 
 