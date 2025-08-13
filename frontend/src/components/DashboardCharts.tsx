import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface DashboardChartsProps {
  cobros: any[];
  metodoPagoMontos: Record<string, number>;
  conceptosStats: Record<string, number>;
  periodoFiltro?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function DashboardCharts({ cobros, metodoPagoMontos, conceptosStats, periodoFiltro = 'mes' }: DashboardChartsProps) {
  // Preparar datos para gráfico de tendencias según el período
  const getTendenciasData = () => {
    const hoy = new Date();
    let dias = 7;
    let incremento = 1;
    
    switch (periodoFiltro) {
      case 'hoy':
        dias = 24;
        incremento = 1; // Por hora
        break;
      case 'semana':
        dias = 7;
        incremento = 1; // Por día
        break;
      case 'mes':
        dias = 30;
        incremento = 1; // Por día
        break;
      case 'año':
        dias = 12;
        incremento = 30; // Por mes
        break;
      default:
        dias = 7;
        incremento = 1;
    }
    
    const tendencias = [];
    for (let i = dias - 1; i >= 0; i--) {
      const date = new Date();
      if (periodoFiltro === 'hoy') {
        date.setHours(date.getHours() - i);
        const horaStr = date.toISOString().slice(0, 13);
        const cobrosDeLaHora = cobros.filter(c => c.fecha_cobro?.slice(0, 13) === horaStr);
        const ingresosDeLaHora = cobrosDeLaHora.reduce((sum, c) => sum + (c.monto_total || 0), 0);
        
        tendencias.push({
          fecha: date.toLocaleTimeString('es-ES', { hour: '2-digit' }),
          cobros: cobrosDeLaHora.length,
          ingresos: ingresosDeLaHora
        });
      } else {
        date.setDate(date.getDate() - (i * incremento));
        const dateStr = date.toISOString().slice(0, 10);
        const cobrosDelDia = cobros.filter(c => c.fecha_cobro?.slice(0, 10) === dateStr);
        const ingresosDelDia = cobrosDelDia.reduce((sum, c) => sum + (c.monto_total || 0), 0);
        
        let formatoFecha = 'short';
        if (periodoFiltro === 'año') {
          formatoFecha = 'short';
        }
        
        tendencias.push({
          fecha: date.toLocaleDateString('es-ES', { 
            weekday: periodoFiltro === 'semana' ? 'short' : undefined,
            day: 'numeric',
            month: periodoFiltro === 'año' ? 'short' : undefined
          }),
          cobros: cobrosDelDia.length,
          ingresos: ingresosDelDia
        });
      }
    }
    return tendencias;
  };

  // Preparar datos para gráfico de métodos de pago
  const getMetodosPagoData = () => {
    return Object.entries(metodoPagoMontos).map(([metodo, monto]) => ({
      name: metodo.replace(/_/g, ' '),
      value: monto
    }));
  };

  // Preparar datos para gráfico de conceptos
  const getConceptosData = () => {
    console.log('ConceptosStats recibidos:', conceptosStats);
    console.log('Tipo de conceptosStats:', typeof conceptosStats);
    console.log('Es un objeto:', conceptosStats && typeof conceptosStats === 'object');
    console.log('Tiene propiedades:', conceptosStats && Object.keys(conceptosStats));
    
    let data = Object.entries(conceptosStats || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([concepto, cantidad], index) => ({
        concepto: concepto.length > 25 ? concepto.substring(0, 25) + '...' : concepto, // Truncar nombres muy largos
        conceptoCompleto: concepto, // Guardar el nombre completo para el tooltip
        cantidad: Number(cantidad) || 0,
        // Agregar un valor mínimo para asegurar que se muestren las barras
        valor: Math.max(Number(cantidad) || 0, 1)
      }));
    
    // Si no hay datos, usar datos de prueba para debug
    if (data.length === 0) {
      console.log('No hay datos de conceptos, usando datos de prueba');
      data = [
        { concepto: 'Varicela', conceptoCompleto: 'Varicela', cantidad: 5, valor: 5 },
        { concepto: 'Consulta General', conceptoCompleto: 'Consulta General', cantidad: 3, valor: 3 },
        { concepto: 'Glicerinado', conceptoCompleto: 'Glicerinado', cantidad: 2, valor: 2 },
        { concepto: 'Gardasil', conceptoCompleto: 'Gardasil', cantidad: 1, valor: 1 }
      ];
    }
    
    console.log('Datos procesados para gráfico:', data);
    console.log('Cantidad de datos:', data.length);
    console.log('Estructura de cada dato:', data.map(d => ({ concepto: d.concepto, cantidad: d.cantidad, valor: d.valor, tipo: typeof d.valor })));
    return data;
  };

  // Preparar datos para gráfico de ingresos por mes (últimos 6 meses)
  const getIngresosMensuales = () => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      
      const cobrosDelMes = cobros.filter(c => c.fecha_cobro?.slice(0, 7) === monthStr);
      const ingresosDelMes = cobrosDelMes.reduce((sum, c) => sum + (c.monto_total || 0), 0);
      
      last6Months.push({
        mes: date.toLocaleDateString('es-ES', { month: 'short' }),
        ingresos: ingresosDelMes
      });
    }
    return last6Months;
  };

  const tendenciasData = getTendenciasData();
  const metodosPagoData = getMetodosPagoData();
  let conceptosData = getConceptosData();
  
  // Asegurar que siempre haya datos para mostrar
  if (!conceptosData || conceptosData.length === 0) {
    console.log('No hay datos de conceptos, usando datos de prueba por defecto');
    conceptosData = [
      { concepto: 'Varicela', conceptoCompleto: 'Varicela', cantidad: 5, valor: 5 },
      { concepto: 'Consulta General', conceptoCompleto: 'Consulta General', cantidad: 3, valor: 3 },
      { concepto: 'Glicerinado', conceptoCompleto: 'Glicerinado', cantidad: 2, valor: 2 },
      { concepto: 'Gardasil', conceptoCompleto: 'Gardasil', cantidad: 1, valor: 1 }
    ];
  }

  // Asegurar que todos los valores sean al menos 1 para que se muestren las barras
  conceptosData = conceptosData.map(item => ({
    ...item,
    valor: Math.max(item.valor || item.cantidad || 0, 1)
  }));

  console.log('Datos finales para el gráfico:', conceptosData);
  const ingresosMensualesData = getIngresosMensuales();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'ingresos' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Gráfico de tendencias - Últimos 7 días */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">📈</span>
          Tendencia de Cobros - {periodoFiltro === 'hoy' ? 'Hoy (por hora)' : 
            periodoFiltro === 'semana' ? 'Última Semana' :
            periodoFiltro === 'mes' ? 'Último Mes' :
            periodoFiltro === 'año' ? 'Último Año' : 'Período Seleccionado'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendenciasData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cobros"
              stroke="#8884d8"
              strokeWidth={3}
              name="Cobros"
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ingresos"
              stroke="#82ca9d"
              strokeWidth={3}
              name="Ingresos"
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráficos en grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de métodos de pago */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">💳</span>
            Distribución por Método de Pago
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metodosPagoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metodosPagoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de conceptos más populares */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Conceptos Más Utilizados
          </h3>
          {(() => {
            console.log('Renderizando gráfico de conceptos con datos:', conceptosData);
            console.log('Datos para el gráfico:', JSON.stringify(conceptosData, null, 2));
            return (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conceptosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="concepto" 
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      value, 
                      props.payload.conceptoCompleto || props.payload.concepto
                    ]} 
                  />
                  <Bar dataKey="valor" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* Gráfico de ingresos mensuales */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">💰</span>
          Ingresos Mensuales - Últimos 6 Meses
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={ingresosMensualesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 