import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import Usuarios from "./pages/Usuarios";
import DashboardPage from "./pages/DashboardPage";
import About from "./pages/About";
import Calendario from "./pages/Calendario";
import Login from './pages/Login';
import { useState, useEffect } from 'react';
// Nuevos imports de inventario
import InventarioDashboard from "./pages/inventario/Dashboard";
import InventarioEntrada from "./pages/inventario/Entrada";
import InventarioSalida from "./pages/inventario/Salida";
import InventarioUso from "./pages/inventario/Uso";
import DisponibilidadBloqueos from './pages/DisponibilidadBloqueos';
import Facturacion from './pages/Facturacion';
import Historial from './components/Historial';
import ExpedientesMedicos from './components/ExpedientesMedicos';
// Importar el provider de permisos
import { PermisosProvider, ProtectedRoute, ConditionalRender } from './hooks/usePermisos';
import { MODULOS } from './services/permisosService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  // Verificar si hay token al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  if (!isLoggedIn) {
    return <Login />;
  }

  // Si está logueado, mostrar la aplicación principal
  return (
    <PermisosProvider>
      <BrowserRouter>
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Rutas protegidas por módulos */}
            <Route path="/pacientes" element={
              <ProtectedRoute requiredModulo={MODULOS.PACIENTES}>
                <Pacientes />
              </ProtectedRoute>
            } />
            
            <Route path="/usuarios" element={
              <ProtectedRoute requiredModulo={MODULOS.USUARIOS}>
                <Usuarios />
              </ProtectedRoute>
            } />
            
            <Route path="/calendario" element={
              <ProtectedRoute requiredModulo={MODULOS.CITAS}>
                <Calendario />
              </ProtectedRoute>
            } />
            
            <Route path="/historial" element={
              <ProtectedRoute requiredModulo={MODULOS.HISTORIAL}>
                <Historial />
              </ProtectedRoute>
            } />
            
            {/* Rutas de inventario protegidas */}
            <Route path="/inventario" element={
              <ProtectedRoute requiredModulo={MODULOS.INVENTARIO}>
                <InventarioDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/inventario/dashboard" element={
              <ProtectedRoute requiredModulo={MODULOS.INVENTARIO}>
                <InventarioDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/inventario/entrada" element={
              <ProtectedRoute requiredModulo={MODULOS.INVENTARIO}>
                <InventarioEntrada />
              </ProtectedRoute>
            } />
            
            <Route path="/inventario/salida" element={
              <ProtectedRoute requiredModulo={MODULOS.INVENTARIO}>
                <InventarioSalida />
              </ProtectedRoute>
            } />
            
            <Route path="/inventario/uso" element={
              <ProtectedRoute requiredModulo={MODULOS.INVENTARIO}>
                <InventarioUso />
              </ProtectedRoute>
            } />
            
            {/* Rutas públicas */}
            <Route path="/about" element={<About />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/expedientes" element={<ExpedientesMedicos />} />
            <Route path="/disponibilidad-bloqueos" element={<DisponibilidadBloqueos />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </PermisosProvider>
  );
}

export default App;
