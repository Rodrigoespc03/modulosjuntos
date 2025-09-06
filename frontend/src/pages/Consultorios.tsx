import React, { useEffect, useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Edit, Trash2, Plus, Building2 } from 'lucide-react';
import { usePermisos } from '../hooks/usePermisos';

interface Consultorio {
  id: string;
  nombre: string;
  direccion: string;
}

export default function Consultorios() {
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingConsultorio, setEditingConsultorio] = useState<Consultorio | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');

  // Verificar permisos
  const { esDoctor } = usePermisos();

  useEffect(() => {
    fetchConsultorios();
  }, []);

  async function fetchConsultorios() {
    setLoading(true);
    try {
      const res = await fetch('/api/consultorios');
      const data = await res.json();
      console.log('🔍 DEBUG - Respuesta completa de consultorios:', data);
      // El backend devuelve { success: true, data: consultorios }
      setConsultorios(data.data || data);
    } catch {
      alert('Error al cargar consultorios');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre || !direccion) return alert('Completa todos los campos');
    setLoading(true);
    try {
      const res = await fetch('/api/consultorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, direccion })
      });
      if (!res.ok) throw new Error();
      setNombre('');
      setDireccion('');
      fetchConsultorios();
      alert('Consultorio agregado exitosamente');
    } catch {
      alert('Error al agregar consultorio');
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(consultorio: Consultorio) {
    setEditingConsultorio(consultorio);
    setEditNombre(consultorio.nombre);
    setEditDireccion(consultorio.direccion);
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConsultorio || !editNombre || !editDireccion) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/consultorios/${editingConsultorio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, direccion: editDireccion })
      });
      if (!res.ok) throw new Error();
      setEditOpen(false);
      setEditingConsultorio(null);
      fetchConsultorios();
      alert('Consultorio actualizado exitosamente');
    } catch {
      alert('Error al actualizar consultorio');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(consultorioId: string) {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este consultorio?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/consultorios/${consultorioId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error();
      fetchConsultorios();
      alert('Consultorio eliminado exitosamente');
    } catch {
      alert('Error al eliminar consultorio');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Consultorios</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {consultorios.length} consultorio{consultorios.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Formulario para agregar consultorio */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar Nuevo Consultorio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre del Consultorio *</Label>
              <Input 
                id="nombre"
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Ej: Consultorio Principal"
                required 
                className="mt-1 text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input 
                id="direccion"
                value={direccion} 
                onChange={e => setDireccion(e.target.value)} 
                placeholder="Ej: Av. Principal 123, Ciudad"
                required 
                className="mt-1 text-gray-900"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Agregando..." : "Agregar Consultorio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de consultorios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Consultorios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Nombre</th>
                  <th className="text-left p-4 font-semibold">Dirección</th>
                  <th className="text-left p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultorios.map(consultorio => (
                  <tr key={consultorio.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{consultorio.nombre}</td>
                    <td className="p-4 text-gray-600">{consultorio.direccion}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(consultorio)}
                          title="Editar consultorio"
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-xs">Editar</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(consultorio.id)}
                          title="Eliminar consultorio"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para editar consultorio */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Consultorio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre del Consultorio *</Label>
              <Input 
                id="edit-nombre"
                value={editNombre} 
                onChange={e => setEditNombre(e.target.value)} 
                placeholder="Ej: Consultorio Principal"
                required 
                className="mt-1 text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input 
                id="edit-direccion"
                value={editDireccion} 
                onChange={e => setEditDireccion(e.target.value)} 
                placeholder="Ej: Av. Principal 123, Ciudad"
                required 
                className="mt-1 text-gray-900"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Actualizando..." : "Actualizar Consultorio"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 