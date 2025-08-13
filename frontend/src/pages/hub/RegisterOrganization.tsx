import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OrganizationData {
  // Paso 1: Datos de la clínica
  nombre: string;
  ruc: string;
  email: string;
  telefono: string;
  ciudad: string;
  
  // Paso 2: Datos del administrador
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Paso 3: Configuración
  tipoClinica: string;
  numMedicos: string;
  modulos: string[];
  plan: string;
}

const RegisterOrganization: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrganizationData>({
    nombre: '',
    ruc: '',
    email: '',
    telefono: '',
    ciudad: '',
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    tipoClinica: '',
    numMedicos: '',
    modulos: [],
    plan: 'gratis'
  });

  const [errors, setErrors] = useState<Partial<OrganizationData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof OrganizationData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<OrganizationData> = {};

    if (step === 1) {
      if (!formData.nombre.trim()) newErrors.nombre = 'El nombre de la clínica es requerido';
      if (!formData.ruc.trim()) newErrors.ruc = 'El RUC es requerido';
      if (!formData.email.trim()) newErrors.email = 'El email es requerido';
      if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
      if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    }

    if (step === 2) {
      if (!formData.adminNombre.trim()) newErrors.adminNombre = 'El nombre del administrador es requerido';
      if (!formData.adminEmail.trim()) newErrors.adminEmail = 'El email del administrador es requerido';
      if (!formData.adminPassword) newErrors.adminPassword = 'La contraseña es requerida';
      if (formData.adminPassword.length < 6) newErrors.adminPassword = 'La contraseña debe tener al menos 6 caracteres';
      if (formData.adminPassword !== formData.adminPasswordConfirm) {
        newErrors.adminPasswordConfirm = 'Las contraseñas no coinciden';
      }
    }

    if (step === 3) {
      if (!formData.tipoClinica) newErrors.tipoClinica = 'Selecciona el tipo de clínica';
      if (!formData.numMedicos) newErrors.numMedicos = 'Selecciona el número de médicos';
      if (formData.modulos.length === 0) newErrors.modulos = ['Selecciona al menos un módulo'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      // Aquí iría la llamada a la API para registrar la organización
      const response = await fetch('http://localhost:3002/api/onboarding/register-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirigir al onboarding
        localStorage.setItem('onboarding', 'true');
        navigate('/onboarding');
      } else {
        throw new Error('Error al registrar la organización');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar la organización. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Información de la Clínica</h3>
        <p className="text-gray-600">Comencemos con los datos básicos de tu clínica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Clínica *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nombre ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Clínica ProCura"
          />
          {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUC *
          </label>
          <input
            type="text"
            value={formData.ruc}
            onChange={(e) => handleInputChange('ruc', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.ruc ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="12345678901"
          />
          {errors.ruc && <p className="mt-1 text-sm text-red-600">{errors.ruc}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de Contacto *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="contacto@clinica.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.telefono ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+51 999 999 999"
          />
          {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad/Región *
          </label>
          <input
            type="text"
            value={formData.ciudad}
            onChange={(e) => handleInputChange('ciudad', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.ciudad ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Lima, Perú"
          />
          {errors.ciudad && <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrador Principal</h3>
        <p className="text-gray-600">Crea la cuenta del administrador principal de la clínica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <input
            type="text"
            value={formData.adminNombre}
            onChange={(e) => handleInputChange('adminNombre', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.adminNombre ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Dr. Juan Pérez"
          />
          {errors.adminNombre && <p className="mt-1 text-sm text-red-600">{errors.adminNombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.adminEmail}
            onChange={(e) => handleInputChange('adminEmail', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.adminEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="admin@clinica.com"
          />
          {errors.adminEmail && <p className="mt-1 text-sm text-red-600">{errors.adminEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <input
            type="password"
            value={formData.adminPassword}
            onChange={(e) => handleInputChange('adminPassword', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.adminPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mínimo 6 caracteres"
          />
          {errors.adminPassword && <p className="mt-1 text-sm text-red-600">{errors.adminPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Contraseña *
          </label>
          <input
            type="password"
            value={formData.adminPasswordConfirm}
            onChange={(e) => handleInputChange('adminPasswordConfirm', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.adminPasswordConfirm ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Repite la contraseña"
          />
          {errors.adminPasswordConfirm && <p className="mt-1 text-sm text-red-600">{errors.adminPasswordConfirm}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Inicial</h3>
        <p className="text-gray-600">Personaliza tu experiencia con ProCura</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Clínica *
          </label>
          <select
            value={formData.tipoClinica}
            onChange={(e) => handleInputChange('tipoClinica', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.tipoClinica ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona el tipo</option>
            <option value="general">Clínica General</option>
            <option value="especializada">Clínica Especializada</option>
            <option value="odontologica">Clínica Odontológica</option>
            <option value="veterinaria">Clínica Veterinaria</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="otro">Otro</option>
          </select>
          {errors.tipoClinica && <p className="mt-1 text-sm text-red-600">{errors.tipoClinica}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Médicos *
          </label>
          <select
            value={formData.numMedicos}
            onChange={(e) => handleInputChange('numMedicos', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.numMedicos ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona</option>
            <option value="1-5">1-5 médicos</option>
            <option value="6-10">6-10 médicos</option>
            <option value="11-20">11-20 médicos</option>
            <option value="21-50">21-50 médicos</option>
            <option value="50+">Más de 50 médicos</option>
          </select>
          {errors.numMedicos && <p className="mt-1 text-sm text-red-600">{errors.numMedicos}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Módulos que quieres activar *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'cobros', label: 'Gestión de Cobros', description: 'Control de pagos y facturación' },
              { id: 'inventario', label: 'Control de Inventario', description: 'Gestión de stock y productos' },
              { id: 'citas', label: 'Programación de Citas', description: 'Calendario y horarios' },
              { id: 'pacientes', label: 'Gestión de Pacientes', description: 'Historiales y expedientes' },
            ].map((modulo) => (
              <label key={modulo.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.modulos.includes(modulo.id)}
                  onChange={(e) => {
                    const newModulos = e.target.checked
                      ? [...formData.modulos, modulo.id]
                      : formData.modulos.filter(m => m !== modulo.id);
                    handleInputChange('modulos', newModulos);
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">{modulo.label}</div>
                  <div className="text-sm text-gray-500">{modulo.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.modulos && <p className="mt-1 text-sm text-red-600">{errors.modulos}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plan de Suscripción
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'gratis', name: 'Gratis', price: 'S/ 0', features: ['30 días de prueba', 'Módulos básicos', 'Soporte por email'] },
              { id: 'basico', name: 'Básico', price: 'S/ 99', features: ['Todos los módulos', 'Soporte prioritario', 'Backup automático'] },
              { id: 'premium', name: 'Premium', price: 'S/ 199', features: ['Módulos avanzados', 'Soporte 24/7', 'API personalizada'] },
            ].map((plan) => (
              <label key={plan.id} className="relative flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={formData.plan === plan.id}
                  onChange={(e) => handleInputChange('plan', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{plan.name}</span>
                  <span className="text-lg font-bold text-blue-600">{plan.price}</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
                {formData.plan === plan.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
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
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registra tu Clínica</h1>
          <p className="text-gray-600">Únete a ProCura en solo 3 pasos simples</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderCurrentStep()}

          {/* Navigation Buttons */}
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
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Registrando...' : 'Crear mi Clínica'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>¿Ya tienes una cuenta? <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization; 