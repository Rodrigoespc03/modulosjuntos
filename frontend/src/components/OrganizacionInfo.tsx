import React from 'react';
import { usePermisos } from '../hooks/usePermisos';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Building2, Users, Calendar, DollarSign } from 'lucide-react';

interface OrganizacionInfoProps {
  showStats?: boolean;
}

export const OrganizacionInfo: React.FC<OrganizacionInfoProps> = ({ showStats = false }) => {
  const { organizacion, loading, error } = usePermisos();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !organizacion) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No se pudo cargar la información de la organización</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {organizacion.nombre}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizacion.ruc && (
              <div>
                <label className="text-sm font-medium text-gray-500">RUC</label>
                <p className="text-sm">{organizacion.ruc}</p>
              </div>
            )}
            {organizacion.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{organizacion.email}</p>
              </div>
            )}
            {organizacion.telefono && (
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-sm">{organizacion.telefono}</p>
              </div>
            )}
            {organizacion.direccion && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Dirección</label>
                <p className="text-sm">{organizacion.direccion}</p>
              </div>
            )}
          </div>

          {/* Colores de la organización */}
          {(organizacion.color_primario || organizacion.color_secundario) && (
            <div>
              <label className="text-sm font-medium text-gray-500">Colores de marca</label>
              <div className="flex gap-2 mt-1">
                {organizacion.color_primario && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: organizacion.color_primario }}
                    ></div>
                    <span className="text-xs">Primario</span>
                  </div>
                )}
                {organizacion.color_secundario && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: organizacion.color_secundario }}
                    ></div>
                    <span className="text-xs">Secundario</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estadísticas (si se solicitan) */}
          {showStats && organizacion._count && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500 mb-3 block">Estadísticas</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-semibold">{organizacion._count.usuarios || 0}</p>
                  <p className="text-xs text-gray-500">Usuarios</p>
                </div>
                <div className="text-center">
                  <Building2 className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-semibold">{organizacion._count.consultorios || 0}</p>
                  <p className="text-xs text-gray-500">Consultorios</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  <p className="text-lg font-semibold">{organizacion._count.pacientes || 0}</p>
                  <p className="text-xs text-gray-500">Pacientes</p>
                </div>
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                  <p className="text-lg font-semibold">{organizacion._count.servicios || 0}</p>
                  <p className="text-xs text-gray-500">Servicios</p>
                </div>
              </div>
            </div>
          )}

          {/* Badge de estado */}
          <div className="flex justify-end">
            <Badge variant="secondary" className="text-xs">
              Organización activa
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 
 
 