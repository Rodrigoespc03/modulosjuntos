import React, { useEffect, useState } from "react";
import { getCobros } from "@/services/cobrosService";
import Conceptos from "@/components/Conceptos";
import Cobros from "@/components/Cobros";
import DashboardCharts from "@/components/DashboardCharts";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FaMoneyBillWave, FaUserMd, FaCreditCard, FaUser, FaCashRegister, FaUniversity, FaQuestion, FaRegCheckSquare, FaClock, FaExclamationTriangle, FaCalendarAlt, FaFilter } from "react-icons/fa";

interface DashboardMetrics {
  totalCobros: number;
  totalIngresos: number;
  promedioPorCobro: number;
  cobrosHoy: number;
  ingresosHoy: number;
  cobrosEsteMes: number;
  ingresosEsteMes: number;
  cobrosPendientes: number;
  ingresosPendientes: number;
  cobrosCancelados: number;
  ingresosCancelados: number;
  metodoPagoStats: Record<string, number>;
  conceptosStats: Record<string, number>;
  conceptos: any[];
  metodos: any[];
  usuarios: any[];
}

type PeriodoFiltro = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';

const metodoPagoIcons: Record<string, React.ReactNode> = {
  EFECTIVO: <FaMoneyBillWave className="text-green-600" />,
  TARJETA_DEBITO: <FaCreditCard className="text-blue-600" />,
  TARJETA_CREDITO: <FaCreditCard className="text-purple-600" />,
  TRANSFERENCIA: <FaUniversity className="text-teal-600" />,
  CHEQUE: <FaRegCheckSquare className="text-black" />,
  OTRO: <FaQuestion className="text-blue-600" />,
  "Sin especificar": <FaQuestion className="text-black" />,
};

const metodoPagoTextColor: Record<string, string> = {
  EFECTIVO: "text-green-700",
  TARJETA_DEBITO: "text-blue-700",
  TARJETA_CREDITO: "text-purple-700",
  TRANSFERENCIA: "text-teal-700",
  CHEQUE: "text-gray-700",
  OTRO: "text-blue-700",
  "Sin especificar": "text-black",
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCobros: 0,
    totalIngresos: 0,
    promedioPorCobro: 0,
    cobrosHoy: 0,
    ingresosHoy: 0,
    cobrosEsteMes: 0,
    ingresosEsteMes: 0,
    cobrosPendientes: 0,
    ingresosPendientes: 0,
    cobrosCancelados: 0,
    ingresosCancelados: 0,
    metodoPagoStats: {},
    conceptosStats: {},
    conceptos: [],
    metodos: [],
    usuarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [showConceptos, setShowConceptos] = useState(false);
  const [filteredCobros, setFilteredCobros] = useState<any[]>([]);
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('mes');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');



  useEffect(() => {
    console.log('🔍 useEffect triggered - periodoFiltro:', periodoFiltro);
    loadMetrics();
  }, [periodoFiltro, fechaInicio, fechaFin]);

  const getFechasFiltro = () => {
    const hoy = new Date();
    let inicio = new Date();
    let fin = new Date();

    switch (periodoFiltro) {
      case 'hoy':
        // Para "hoy" usamos la fecha actual en zona horaria local
        const hoyLocal = new Date();
        inicio = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), hoyLocal.getDate(), 0, 0, 0, 0);
        fin = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), hoyLocal.getDate(), 23, 59, 59, 999);
        break;
      case 'semana':
        // Para "semana" usamos los últimos 7 días
        inicio = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'mes':
        // Para "mes" usamos el último mes
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
        break;
      case 'año':
        // Para "año" usamos el último año
        inicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
        break;
      case 'personalizado':
        if (fechaInicio && fechaFin) {
          inicio = new Date(fechaInicio);
          fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { inicio, fin };
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const cobros = await getCobros();
      calculateMetrics(cobros);
    } catch (error) {
      console.error("Error cargando métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (cobros: any[]) => {
    const { inicio, fin } = getFechasFiltro();
    
    console.log('🔍 Debug - Filtro actual:', periodoFiltro);
    console.log('🔍 Debug - Fecha inicio:', inicio);
    console.log('🔍 Debug - Fecha fin:', fin);
    console.log('🔍 Debug - Total cobros recibidos:', cobros.length);
    console.log('🔍 Debug - Fechas de cobros:', cobros.map(c => c.fecha_cobro));
    
    // Filtrar cobros por período seleccionado
    const cobrosFiltrados = cobros.filter(c => {
      if (!c.fecha_cobro) {
        console.log('🔍 Debug - Cobro sin fecha:', c.id);
        return false;
      }
      
      const fechaCobro = new Date(c.fecha_cobro);
      
      // Para el filtro "hoy", comparar solo la fecha (sin hora)
      if (periodoFiltro === 'hoy') {
        // Extraer solo la fecha YYYY-MM-DD del cobro
        const fechaCobroStr = c.fecha_cobro.slice(0, 10); // "2025-08-05"
        
        // Usar la fecha del filtro (inicio) en lugar de calcular "hoy"
        const filtroFechaStr = inicio.toISOString().slice(0, 10);
        
        const coincide = fechaCobroStr === filtroFechaStr;
        console.log(`🔍 Debug - Filtro "hoy": ${fechaCobroStr} === ${filtroFechaStr} = ${coincide}`);
        return coincide;
      }
      
      // Para otros filtros, usar comparación completa
      const coincide = fechaCobro >= inicio && fechaCobro <= fin;
      console.log(`🔍 Debug - Filtro "${periodoFiltro}": ${fechaCobro} >= ${inicio} && ${fechaCobro} <= ${fin} = ${coincide}`);
      
      return coincide;
    });
    
    console.log('🔍 Debug - Cobros filtrados encontrados:', cobrosFiltrados.length);

    // Cobros por estado (sin filtro temporal)
    const cobrosPendientes = cobros.filter(c => c.estado === 'PENDIENTE');
    const cobrosCancelados = cobros.filter(c => c.estado === 'CANCELADO');

    const totalIngresos = cobrosFiltrados.reduce((sum, c) => sum + (c.monto_total || 0), 0);
    const ingresosPendientes = cobrosPendientes.reduce((sum, c) => sum + (c.monto_total || 0), 0);
    const ingresosCancelados = cobrosCancelados.reduce((sum, c) => sum + (c.monto_total || 0), 0);

    const metodoPagoStats = cobrosFiltrados.reduce((acc, c) => {
      const metodo = c.metodo_pago || "Sin especificar";
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Estadísticas de conceptos
    const conceptosStats = cobrosFiltrados.reduce((acc, c) => {
      if (Array.isArray(c.conceptos) && c.conceptos.length > 0) {
        c.conceptos.forEach((concepto: any) => {
          // El concepto tiene una relación con servicio, accedemos al nombre del servicio
          const nombre = concepto.servicio?.nombre || concepto.nombre || concepto.concepto || 'Sin nombre';
          acc[nombre] = (acc[nombre] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    // Debug: Log para verificar los datos de conceptos
    console.log('Cobros filtrados:', cobrosFiltrados.length);
    console.log('Conceptos stats:', conceptosStats);
    console.log('Primer cobro conceptos:', cobrosFiltrados[0]?.conceptos);
    console.log('Todos los conceptos encontrados:', Object.keys(conceptosStats));
    console.log('Valores de conceptos:', Object.values(conceptosStats));

    setMetrics({
      totalCobros: cobrosFiltrados.length,
      totalIngresos,
      promedioPorCobro: cobrosFiltrados.length > 0 ? totalIngresos / cobrosFiltrados.length : 0,
      cobrosHoy: 0, // Ya no se usa
      ingresosHoy: 0, // Ya no se usa
      cobrosEsteMes: 0, // Ya no se usa
      ingresosEsteMes: 0, // Ya no se usa
      cobrosPendientes: cobrosPendientes.length,
      ingresosPendientes,
      cobrosCancelados: cobrosCancelados.length,
      ingresosCancelados,
      metodoPagoStats,
      conceptosStats,
      conceptos: [],
      metodos: [],
      usuarios: [],
    });

    setFilteredCobros(cobrosFiltrados);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getPeriodoTexto = () => {
    switch (periodoFiltro) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Última Semana';
      case 'mes': return 'Último Mes';
      case 'año': return 'Último Año';
      case 'personalizado': return 'Personalizado';
      default: return 'Último Mes';
    }
  };

  const metodoPagoMontos: Record<string, number> = {};
  filteredCobros.forEach(cobro => {
    if (Array.isArray(cobro.metodos_pago) && cobro.metodos_pago.length > 0) {
      cobro.metodos_pago.forEach((pago: any) => {
        const metodo = pago.metodo_pago || "Sin especificar";
        metodoPagoMontos[metodo] = (metodoPagoMontos[metodo] || 0) + Number(pago.monto || 0);
      });
    } else if (cobro.metodo_pago && cobro.monto_total) {
      const metodo = cobro.metodo_pago || "Sin especificar";
      metodoPagoMontos[metodo] = (metodoPagoMontos[metodo] || 0) + Number(cobro.monto_total || 0);
    }
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] pt-10">
      {/* Banner de cobros pendientes */}
      {metrics.cobrosPendientes > 0 && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                ⚠️ ¡Atención! Tienes {metrics.cobrosPendientes} cobros pendientes
              </h3>
              <p className="text-red-700">
                Total pendiente: ${metrics.ingresosPendientes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard visual */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Resumen de Cobros</h1>
            <p className="text-2xl text-black mt-2">Visión general del sistema de cobros</p>
          </div>
          <div className="text-lg text-black">
            Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </div>
        </div>

        {/* Filtro de temporalidad */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FaFilter className="text-gray-600 text-xl" />
              <span className="text-lg font-semibold text-gray-900">Filtro de Período:</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {(['hoy', 'semana', 'mes', 'año'] as PeriodoFiltro[]).map((periodo) => (
                  <button
                    key={periodo}
                    onClick={() => setPeriodoFiltro(periodo)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      periodoFiltro === periodo
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {periodo === 'hoy' && 'Hoy'}
                    {periodo === 'semana' && 'Semana'}
                    {periodo === 'mes' && 'Mes'}
                    {periodo === 'año' && 'Año'}
                  </button>
                ))}
              </div>
              
              {/* Filtro personalizado */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setPeriodoFiltro('personalizado');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600">a</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setPeriodoFiltro('personalizado');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Período actual */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" />
              <span className="text-blue-800 font-medium">
                Período actual: {getPeriodoTexto()}
                {periodoFiltro === 'personalizado' && fechaInicio && fechaFin && 
                  ` (${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()})`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg font-medium">Total Cobros</p>
                <p className="text-4xl font-extrabold">{metrics.totalCobros.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-lg font-medium">Ingresos Totales</p>
                <p className="text-4xl font-extrabold">{formatCurrency(metrics.totalIngresos)}</p>
              </div>
              <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-lg font-medium">Promedio por Cobro</p>
                <p className="text-4xl font-extrabold">{formatCurrency(metrics.promedioPorCobro)}</p>
              </div>
              <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-lg font-medium">Cobros del Período</p>
                <p className="text-4xl font-extrabold">{metrics.totalCobros}</p>
              </div>
              <div className="p-3 bg-orange-400 bg-opacity-30 rounded-full">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-extrabold">{metrics.cobrosPendientes}</p>
                <p className="text-yellow-100 text-xs">{formatCurrency(metrics.ingresosPendientes)}</p>
              </div>
              <div className="p-3 bg-yellow-400 bg-opacity-30 rounded-full">
                <FaClock className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Cancelados</p>
                <p className="text-3xl font-extrabold">{metrics.cobrosCancelados}</p>
                <p className="text-red-100 text-xs">{formatCurrency(metrics.ingresosCancelados)}</p>
              </div>
              <div className="p-3 bg-red-400 bg-opacity-30 rounded-full">
                <FaExclamationTriangle className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Métodos de Pago</p>
                <p className="text-3xl font-extrabold">{Object.keys(metodoPagoMontos).length}</p>
                <p className="text-teal-100 text-xs">Tipos utilizados</p>
              </div>
              <div className="p-3 bg-teal-400 bg-opacity-30 rounded-full">
                <FaCreditCard className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Conceptos</p>
                <p className="text-3xl font-extrabold">{Object.keys(metrics.conceptosStats).length}</p>
                <p className="text-indigo-100 text-xs">Diferentes utilizados</p>
              </div>
              <div className="p-3 bg-indigo-400 bg-opacity-30 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos del Dashboard */}
      <div className="mt-12">
        <DashboardCharts 
          cobros={filteredCobros}
          metodoPagoMontos={metodoPagoMontos}
          conceptosStats={metrics.conceptosStats}
          periodoFiltro={periodoFiltro}
        />
      </div>

      {/* Gestión de cobros siempre expandida */}
      <div className="mt-16 animate-fade-in">
        <Cobros embedded={true} />
      </div>
      <Dialog open={showConceptos} onOpenChange={v => setShowConceptos(v)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-10 rounded-2xl overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Conceptos embedded={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 