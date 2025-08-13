import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Gestiona tu Clínica
                  <span className="block text-blue-200">como un Profesional</span>
                </h1>
                <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed">
                  La plataforma integral que simplifica la gestión de clínicas médicas. 
                  Controla cobros, inventario, citas y pacientes desde un solo lugar.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/registro"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Registra tu Clínica GRATIS
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
                >
                  Iniciar Sesión
                </Link>
              </div>

              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>30 días gratis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Setup en 15 minutos</span>
                </div>
              </div>
            </div>

            {/* Demo Image/Video */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="bg-white rounded-lg shadow-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-blue-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">150+</div>
                      <div className="text-sm text-gray-600">Cobros Hoy</div>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">45</div>
                      <div className="text-sm text-gray-600">Pacientes</div>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">89%</div>
                      <div className="text-sm text-gray-600">Satisfacción</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para tu clínica
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ProCura integra todos los módulos esenciales para la gestión médica 
              en una plataforma intuitiva y fácil de usar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Cobros */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Cobros</h3>
              <p className="text-gray-600 mb-4">
                Controla todos los pagos, genera comprobantes y mantén un historial 
                completo de transacciones.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Múltiples métodos de pago</li>
                <li>• Comprobantes automáticos</li>
                <li>• Reportes financieros</li>
                <li>• Historial de cambios</li>
              </ul>
            </div>

            {/* Inventario */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Control de Inventario</h3>
              <p className="text-gray-600 mb-4">
                Gestiona stock, controla entradas y salidas, y recibe alertas de 
                productos próximos a expirar.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Control de stock en tiempo real</li>
                <li>• Alertas de expiración</li>
                <li>• Entradas y salidas</li>
                <li>• Dashboard de métricas</li>
              </ul>
            </div>

            {/* Citas */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Programación de Citas</h3>
              <p className="text-gray-600 mb-4">
                Organiza horarios, gestiona disponibilidad de médicos y sincroniza 
                con Google Calendar.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Calendario interactivo</li>
                <li>• Disponibilidad de médicos</li>
                <li>• Integración Google Calendar</li>
                <li>• Recordatorios automáticos</li>
              </ul>
            </div>

            {/* Pacientes */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-100">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Pacientes</h3>
              <p className="text-gray-600 mb-4">
                Mantén historiales médicos completos, gestiona contactos y accede 
                a información de pacientes.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Historial médico completo</li>
                <li>• Búsqueda avanzada</li>
                <li>• Expedientes digitales</li>
                <li>• Gestión de contactos</li>
              </ul>
            </div>

            {/* Usuarios */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Usuarios</h3>
              <p className="text-gray-600 mb-4">
                Administra roles, permisos y accesos de todo el personal de la clínica 
                de forma segura.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Roles y permisos granulares</li>
                <li>• Acceso seguro</li>
                <li>• Configuración de consultorios</li>
                <li>• Auditoría de actividades</li>
              </ul>
            </div>

            {/* Reportes */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-2xl border border-teal-100">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reportes y Analytics</h3>
              <p className="text-gray-600 mb-4">
                Obtén insights valiosos sobre el rendimiento de tu clínica con 
                reportes detallados y métricas.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Dashboard personalizable</li>
                <li>• Reportes financieros</li>
                <li>• Métricas de productividad</li>
                <li>• Exportación de datos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            ¿Listo para transformar tu clínica?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a cientos de clínicas que ya confían en ProCura para gestionar 
            sus operaciones de forma eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Comenzar Gratis
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 