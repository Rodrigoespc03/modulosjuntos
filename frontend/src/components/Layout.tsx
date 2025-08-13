import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { 
  LayoutDashboard, 
  CreditCard, 
  Tags, 
  Users, 
  User, 
  Menu, 
  X,
  Calendar as CalendarIcon,
  Package,
  FileText,
  History,
  Stethoscope,
  Building2
} from "lucide-react";
import { usePermisos, ConditionalRender } from '../hooks/usePermisos';
import { MODULOS } from '../services/permisosService';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { modulosDisponibles, loading, organizacion } = usePermisos();

  // Definir la navegación con verificación de módulos
  const getNavigation = () => {
    const navigation = [
      { 
        name: "Cobros", 
        href: "/dashboard", 
        icon: LayoutDashboard,
        modulo: MODULOS.COBROS
      },
      { 
        name: "Pacientes", 
        href: "/pacientes", 
        icon: Users,
        modulo: MODULOS.PACIENTES
      },
      { 
        name: "Usuarios", 
        href: "/usuarios", 
        icon: User,
        modulo: MODULOS.USUARIOS
      },
      { 
        name: "Calendario", 
        href: "/calendario", 
        icon: CalendarIcon,
        modulo: MODULOS.CITAS
      },
      { 
        name: "Inventario", 
        href: "/inventario", 
        icon: Package,
        modulo: MODULOS.INVENTARIO
      },
      { 
        name: "Facturación", 
        href: "/facturacion", 
        icon: FileText,
        modulo: MODULOS.FACTURACION
      },
      { 
        name: "Expedientes", 
        href: "/expedientes", 
        icon: Stethoscope,
        modulo: null // Módulo público
      },
      { 
        name: "Historial", 
        href: "/historial", 
        icon: History,
        modulo: MODULOS.HISTORIAL
      },
    ];

    // Filtrar navegación según módulos disponibles
    return navigation.filter(item => {
      if (item.modulo === null) return true; // Módulos públicos siempre visibles
      return modulosDisponibles.includes(item.modulo);
    });
  };

  const navigation = getNavigation();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className="sidebar-bg flex flex-col h-screen fixed left-0 top-0 bottom-0 text-white w-[320px] min-w-[280px] max-w-[360px] shadow-lg z-40"
      >
        <div className="flex flex-col items-center py-10 px-6 border-b border-[#223052]">
          <Logo size="lg" />
        </div>
        <nav className="flex-1 flex flex-col gap-3 mt-10">
          {navigation.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-5 px-8 py-5 rounded-xl transition-colors text-xl font-bold
                  ${active ? 'bg-[#223052] border-l-4 border-white text-white' : 'hover:bg-[#4285f2] hover:text-white hover:shadow-md text-gray-200'}
                `}
              >
                <item.icon className="w-9 h-9 mr-2" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* Logout button at the bottom */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto mb-8 mx-8 py-3 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow transition-colors"
          >
            Cerrar sesión
          </button>
        )}
      </aside>
      {/* Main content */}
      <main className="flex-1 min-h-screen ml-[320px] bg-white overflow-y-auto transition-colors duration-300">
        {/* Header con información de organización */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {organizacion?.nombre || 'Sistema de Gestión'}
                </h1>
                {organizacion?.ruc && (
                  <p className="text-sm text-gray-500">RUC: {organizacion.ruc}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {organizacion?.email || 'admin@organizacion.com'}
                </p>
                {organizacion?.telefono && (
                  <p className="text-xs text-gray-500">{organizacion.telefono}</p>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Contenido principal */}
        <div className="p-8 flex justify-center">
          {children}
        </div>
      </main>
    </div>
  );
} 