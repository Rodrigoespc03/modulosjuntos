import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Calendar, User, FileText, Clock, MapPin, Phone, Mail, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
  duration: number;
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

const ExpedientesMedicos: React.FC = () => {
  const [patients, setPatients] = useState<HuliPatient[]>([]);
  const [appointments, setAppointments] = useState<HuliAppointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<HuliMedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<HuliPatient | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HuliMedicalRecord | null>(null);

  // Función para obtener pacientes
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/huli/patients?page=1&limit=50&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener pacientes');
      }

      const data = await response.json();
      setPatients(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener expedientes médicos de un paciente
  const fetchMedicalRecords = async (patientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/huli/patients/${patientId}/medical-records?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener expedientes médicos');
      }

      const data = await response.json();
      setMedicalRecords(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener citas
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/huli/appointments?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener citas');
      }

      const data = await response.json();
      setAppointments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  // Filtrar pacientes por término de búsqueda
  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  // Función para obtener el estado de la cita
  const getAppointmentStatus = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Programada', color: 'bg-blue-100 text-blue-800' };
      case 'CONFIRMED':
        return { label: 'Confirmada', color: 'bg-green-100 text-green-800' };
      case 'CANCELLED':
        return { label: 'Cancelada', color: 'bg-red-100 text-red-800' };
      case 'COMPLETED':
        return { label: 'Completada', color: 'bg-gray-100 text-gray-800' };
      case 'NO_SHOW':
        return { label: 'No asistió', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Función para formatear hora
  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expedientes Médicos</h1>
        <p className="text-gray-600">Gestión de expedientes médicos integrados con HuliPractice</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="records">Expedientes</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar pacientes</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchPatients} disabled={loading}>
                {loading ? 'Cargando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {patient.email}
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {patient.phone}
                    </div>
                  )}
                  {patient.dateOfBirth && (
                    <div className="text-sm text-gray-600">
                      Nacimiento: {formatDate(patient.dateOfBirth)}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        fetchMedicalRecords(patient.id);
                      }}
                    >
                      Ver Expedientes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Citas Programadas</h3>
            <Button onClick={fetchAppointments} disabled={loading}>
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>

          <div className="space-y-4">
            {appointments.map((appointment) => {
              const status = getAppointmentStatus(appointment.status);
              return (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {formatDate(appointment.date)} - {formatTime(appointment.time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Duración: {appointment.duration} minutos
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        )}
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="text-center text-gray-500">
            Selecciona un paciente para ver sus expedientes médicos
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para mostrar expedientes de un paciente */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Expedientes Médicos - {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-4">
              {medicalRecords.map((record) => (
                <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">Consulta del {formatDate(record.date)}</h4>
                        <p className="text-sm text-gray-600">Dr. ID: {record.doctorId}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-sm">Síntomas:</span>
                        <p className="text-sm text-gray-700">{record.symptoms}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Diagnóstico:</span>
                        <p className="text-sm text-gray-700">{record.diagnosis}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Tratamiento:</span>
                        <p className="text-sm text-gray-700">{record.treatment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal para mostrar detalles del expediente */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalles del Expediente Médico</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-4">
              {selectedRecord && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="font-medium">Fecha de Consulta</Label>
                      <p className="text-sm text-gray-700">{formatDate(selectedRecord.date)}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="font-medium">Síntomas</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedRecord.symptoms}</p>
                    </div>
                    
                    <div>
                      <Label className="font-medium">Diagnóstico</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedRecord.diagnosis}</p>
                    </div>
                    
                    <div>
                      <Label className="font-medium">Tratamiento</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedRecord.treatment}</p>
                    </div>
                    
                    {selectedRecord.prescription && selectedRecord.prescription.medications.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="font-medium">Medicamentos Recetados</Label>
                          <div className="space-y-2 mt-2">
                            {selectedRecord.prescription.medications.map((med, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-sm">{med.name}</p>
                                <p className="text-xs text-gray-600">
                                  Dosis: {med.dosage} | Frecuencia: {med.frequency} | Duración: {med.duration}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedRecord.notes && (
                      <>
                        <Separator />
                        <div>
                          <Label className="font-medium">Notas Adicionales</Label>
                          <p className="text-sm text-gray-700 mt-1">{selectedRecord.notes}</p>
                        </div>
                      </>
                    )}
                    
                    {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="font-medium">Archivos Adjuntos</Label>
                          <div className="space-y-2 mt-2">
                            {selectedRecord.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{attachment.name}</span>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                    Ver
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpedientesMedicos; 