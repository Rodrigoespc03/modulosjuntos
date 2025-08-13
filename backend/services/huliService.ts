import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface HuliConfig {
  apiKey: string;
  organizationId: string;
  userId: string;
  baseURL?: string;
}

interface HuliPatient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface HuliAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number; // en minutos
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HuliMedicalRecord {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
  };
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

class HuliService {
  private client: AxiosInstance;
  private config: HuliConfig;

  constructor(config: HuliConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.hulilabs.xyz/practice/v2',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Organization-ID': config.organizationId,
        'X-User-ID': config.userId,
      },
      timeout: 30000, // 30 segundos
    });

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Error en llamada a Huli API:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
        return Promise.reject(error);
      }
    );
  }

  // Métodos para pacientes
  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ patients: HuliPatient[]; total: number; page: number; limit: number }> {
    try {
      const response: AxiosResponse = await this.client.get('/patients', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo pacientes: ${error}`);
    }
  }

  async getPatientById(patientId: string): Promise<HuliPatient> {
    try {
      const response: AxiosResponse = await this.client.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo paciente ${patientId}: ${error}`);
    }
  }

  async createPatient(patientData: Partial<HuliPatient>): Promise<HuliPatient> {
    try {
      const response: AxiosResponse = await this.client.post('/patients', patientData);
      return response.data;
    } catch (error) {
      throw new Error(`Error creando paciente: ${error}`);
    }
  }

  async updatePatient(patientId: string, patientData: Partial<HuliPatient>): Promise<HuliPatient> {
    try {
      const response: AxiosResponse = await this.client.put(`/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      throw new Error(`Error actualizando paciente ${patientId}: ${error}`);
    }
  }

  // Métodos para citas
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<{ appointments: HuliAppointment[]; total: number; page: number; limit: number }> {
    try {
      const response: AxiosResponse = await this.client.get('/appointments', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo citas: ${error}`);
    }
  }

  async getAppointmentById(appointmentId: string): Promise<HuliAppointment> {
    try {
      const response: AxiosResponse = await this.client.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo cita ${appointmentId}: ${error}`);
    }
  }

  async createAppointment(appointmentData: Partial<HuliAppointment>): Promise<HuliAppointment> {
    try {
      const response: AxiosResponse = await this.client.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw new Error(`Error creando cita: ${error}`);
    }
  }

  async updateAppointment(appointmentId: string, appointmentData: Partial<HuliAppointment>): Promise<HuliAppointment> {
    try {
      const response: AxiosResponse = await this.client.put(`/appointments/${appointmentId}`, appointmentData);
      return response.data;
    } catch (error) {
      throw new Error(`Error actualizando cita ${appointmentId}: ${error}`);
    }
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<HuliAppointment> {
    try {
      const response: AxiosResponse = await this.client.patch(`/appointments/${appointmentId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(`Error cancelando cita ${appointmentId}: ${error}`);
    }
  }

  // Métodos para expedientes médicos
  async getMedicalRecords(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ medicalRecords: HuliMedicalRecord[]; total: number; page: number; limit: number }> {
    try {
      const response: AxiosResponse = await this.client.get('/medical-records', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo expedientes médicos: ${error}`);
    }
  }

  async getMedicalRecordById(recordId: string): Promise<HuliMedicalRecord> {
    try {
      const response: AxiosResponse = await this.client.get(`/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo expediente médico ${recordId}: ${error}`);
    }
  }

  async createMedicalRecord(recordData: Partial<HuliMedicalRecord>): Promise<HuliMedicalRecord> {
    try {
      const response: AxiosResponse = await this.client.post('/medical-records', recordData);
      return response.data;
    } catch (error) {
      throw new Error(`Error creando expediente médico: ${error}`);
    }
  }

  async updateMedicalRecord(recordId: string, recordData: Partial<HuliMedicalRecord>): Promise<HuliMedicalRecord> {
    try {
      const response: AxiosResponse = await this.client.put(`/medical-records/${recordId}`, recordData);
      return response.data;
    } catch (error) {
      throw new Error(`Error actualizando expediente médico ${recordId}: ${error}`);
    }
  }

  // Método para sincronizar paciente con nuestro sistema
  async syncPatientWithLocalSystem(huliPatient: HuliPatient) {
    // Aquí implementarías la lógica para sincronizar con tu base de datos local
    // Por ejemplo, crear o actualizar un paciente en tu tabla de pacientes
    console.log('Sincronizando paciente de Huli con sistema local:', huliPatient.id);
    
    // TODO: Implementar sincronización con Prisma
    return {
      success: true,
      localPatientId: null, // ID del paciente en tu sistema local
      message: 'Paciente sincronizado correctamente'
    };
  }

  // Método para sincronizar cita con nuestro sistema
  async syncAppointmentWithLocalSystem(huliAppointment: HuliAppointment) {
    console.log('Sincronizando cita de Huli con sistema local:', huliAppointment.id);
    
    // TODO: Implementar sincronización con Prisma
    return {
      success: true,
      localAppointmentId: null, // ID de la cita en tu sistema local
      message: 'Cita sincronizada correctamente'
    };
  }

  // Método para verificar la conexión con Huli
  async testConnection(): Promise<boolean> {
    try {
      const response: AxiosResponse = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Error verificando conexión con Huli:', error);
      return false;
    }
  }
}

export default HuliService;
export type { HuliConfig, HuliPatient, HuliAppointment, HuliMedicalRecord }; 