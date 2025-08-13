import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: 1, title: 'Bienvenida', description: 'Conoce ProCura', completed: false },
    { id: 2, title: 'Perfil', description: 'Configura tu clínica', completed: false },
    { id: 3, title: 'Usuarios', description: 'Invita a tu equipo', completed: false },
    { id: 4, title: 'Configuración', description: 'Personaliza módulos', completed: false },
    { id: 5, title: 'Primer Uso', description: '¡Comienza a usar!', completed: false },
  ]);

  const [formData, setFormData] = useState({
    logo: null as File | null,
    colors: {
      primary: '#3B82F6',
      secondary: '#1F2937'
    },
    horarios: {
      inicio: '08:00',
      fin: '18:00',
      dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
    },
    usuarios: [] as Array<{
      nombre: string;
      email: string;
      rol: string;
    }>,
    modulosConfig: {
      cobros: { activo: true, conceptos: [] },
      inventario: { activo: true, productos: [] },
      citas: { activo: true, horarios: [] },
      pacientes: { activo: true }
    }
  });

  const completeStep = (stepId: number) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    completeStep(currentStep);
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finalizar onboarding
      localStorage.removeItem('onboarding');
      navigate('/dashboard');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep1 = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">¡Bienvenido a ProCura!</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tu clínica ha sido registrada exitosamente. Ahora vamos a configurar todo 
          para que puedas empezar a usar ProCura de inmediato.
        </p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">¿Qué vamos a hacer?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Configurar tu perfil</h4>
              <p className="text-gray-600">Logo, colores y horarios de tu clínica</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Invitar a tu equipo</h4>
              <p className="text-gray-600">Agregar médicos y personal</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Configurar módulos</h4>
              <p className="text-gray-600">Personalizar según tus necesidades</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Primer uso</h4>
              <p className="text-gray-600">Crear tu primer paciente y cobro</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-green-900">¡30 días gratis activados!</h4>
            <p className="text-green-700">Disfruta de todas las funcionalidades premium sin costo</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configura tu Perfil</h2>
        <p className="text-gray-600">Personaliza la apariencia y configuración de tu clínica</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logo Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Logo de la Clínica</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <div className="space-y-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-gray-600">Haz clic para subir tu logo</p>
                <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Seleccionar Archivo
              </button>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Colores Corporativos</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.colors.primary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    colors: { ...prev.colors, primary: e.target.value }
                  }))}
                  className="w-12 h-12 rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.colors.primary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    colors: { ...prev.colors, primary: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.colors.secondary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    colors: { ...prev.colors, secondary: e.target.value }
                  }))}
                  className="w-12 h-12 rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.colors.secondary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    colors: { ...prev.colors, secondary: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Horarios de Atención</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Inicio</label>
              <input
                type="time"
                value={formData.horarios.inicio}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  horarios: { ...prev.horarios, inicio: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Fin</label>
              <input
                type="time"
                value={formData.horarios.fin}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  horarios: { ...prev.horarios, fin: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días de Atención</label>
              <select
                multiple
                value={formData.horarios.dias}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData(prev => ({
                    ...prev,
                    horarios: { ...prev.horarios, dias: selected }
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Invita a tu Equipo</h2>
        <p className="text-gray-600">Agrega médicos y personal a tu clínica</p>
      </div>

      <div className="space-y-6">
        {/* Add User Form */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nuevo Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Seleccionar rol</option>
              <option value="DOCTOR">Doctor</option>
              <option value="SECRETARIA">Secretaria</option>
              <option value="ENFERMERA">Enfermera</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Agregar Usuario
          </button>
        </div>

        {/* Users List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuarios de la Clínica</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
              <div>Nombre</div>
              <div>Email</div>
              <div>Rol</div>
              <div>Acciones</div>
            </div>
            <div className="p-4 text-center text-gray-500">
              <p>No hay usuarios agregados aún</p>
              <p className="text-sm">Agrega tu primer usuario arriba</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900">Consejo</h4>
              <p className="text-blue-700">
                Puedes agregar más usuarios después desde la sección de Usuarios en el dashboard. 
                Por ahora, puedes continuar con la configuración básica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configura tus Módulos</h2>
        <p className="text-gray-600">Personaliza los módulos según las necesidades de tu clínica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cobros */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gestión de Cobros</h3>
                <p className="text-sm text-gray-600">Control de pagos y facturación</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.modulosConfig.cobros.activo} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {formData.modulosConfig.cobros.activo && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Conceptos de Cobro Sugeridos:</h4>
              <div className="space-y-2">
                {['Consulta General', 'Consulta Especializada', 'Procedimiento', 'Medicamentos'].map((concepto) => (
                  <label key={concepto} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{concepto}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inventario */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Control de Inventario</h3>
                <p className="text-sm text-gray-600">Gestión de stock y productos</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.modulosConfig.inventario.activo} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {formData.modulosConfig.inventario.activo && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Categorías Sugeridas:</h4>
              <div className="space-y-2">
                {['Medicamentos', 'Materiales', 'Equipos', 'Insumos'].map((categoria) => (
                  <label key={categoria} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{categoria}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Citas */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Programación de Citas</h3>
                <p className="text-sm text-gray-600">Calendario y horarios</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.modulosConfig.citas.activo} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Pacientes */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gestión de Pacientes</h3>
                <p className="text-sm text-gray-600">Historiales y expedientes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.modulosConfig.pacientes.activo} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Comienza a Usar ProCura!</h2>
        <p className="text-gray-600">Vamos a crear tu primer paciente y cobro para que veas cómo funciona</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Demo Dashboard */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard de tu Clínica</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Cobros Hoy</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Pacientes</div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                Tu dashboard se llenará de datos conforme uses ProCura
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="font-semibold">Crear Primer Paciente</div>
                  <div className="text-sm opacity-90">Registra la información básica</div>
                </div>
              </div>
            </button>
            <button className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div>
                  <div className="font-semibold">Realizar Primer Cobro</div>
                  <div className="text-sm opacity-90">Procesa un pago de prueba</div>
                </div>
              </div>
            </button>
            <button className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-semibold">Programar Primera Cita</div>
                  <div className="text-sm opacity-90">Configura el calendario</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-green-900">¡Configuración Completada!</h4>
            <p className="text-green-700">
              Tu clínica está lista para usar. Puedes acceder a todas las funcionalidades 
              desde el dashboard principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.completed 
                    ? 'bg-green-600 text-white' 
                    : step.id <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{steps[currentStep - 1].title}</h1>
            <p className="text-gray-600">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderCurrentStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            
            <div className="ml-auto">
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep === 5 ? 'Finalizar Onboarding' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 