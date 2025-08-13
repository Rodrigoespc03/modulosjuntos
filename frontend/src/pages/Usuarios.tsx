import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getUsuarios, crearUsuario } from "@/services/usuariosService";
import { 
  obtenerUsuariosConsultorio, 
  actualizarPermisosUsuario, 
  crearUsuario as crearUsuarioPermisos,
  actualizarUsuario,
  eliminarUsuario,
  ROLES,
  type Usuario as UsuarioPermisos
} from "@/services/permisosService";
import { usePermisos, ConditionalRender } from "@/hooks/usePermisos";
import Consultorios from './Consultorios';
import { Combobox } from "@headlessui/react";
import { User, Edit, Trash2, Shield, Settings, Plus } from "lucide-react";

const usuarioSchema = z.object({
  rol: z.string().min(1, "El rol es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

const roles = [
  { value: ROLES.DOCTOR, label: "Doctor" },
  { value: ROLES.SECRETARIA, label: "Secretaria" },
  { value: ROLES.ENFERMERA, label: "Enfermera" },
  { value: ROLES.PACIENTE, label: "Paciente" },
];

export default function UsuariosYConsultorios() {
  const [usuarios, setUsuarios] = useState<UsuarioPermisos[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permisosOpen, setPermisosOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [selectedRol, setSelectedRol] = useState(roles[0]);
  const [selectedConsultorio, setSelectedConsultorio] = useState<any>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioPermisos | null>(null);
  const [permisosUsuario, setPermisosUsuario] = useState({
    puede_editar_cobros: false,
    puede_eliminar_cobros: false,
    puede_ver_historial: false,
    puede_gestionar_usuarios: false,
  });

  // Verificar permisos
  const { permisos, esDoctor, loading: permisosLoading } = usePermisos();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
  });

  useEffect(() => {
    if (!permisosLoading && esDoctor) {
    loadUsuarios();
    fetchConsultorios();
    }
  }, [permisosLoading, esDoctor]);

  const loadUsuarios = async () => {
    try {
      const data = await obtenerUsuariosConsultorio();
      setUsuarios(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const fetchConsultorios = async () => {
    try {
      const res = await fetch('/api/consultorios');
      const data = await res.json();
      setConsultorios(data);
    } catch {
      setConsultorios([]);
    }
  };

  const onSubmit = async (data: UsuarioForm) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await crearUsuarioPermisos(data);
      setSuccessMsg("Usuario registrado correctamente");
      setOpen(false);
      reset();
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al registrar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUsuario = (usuario: UsuarioPermisos) => {
    setSelectedUsuario(usuario);
    setValue('nombre', usuario.nombre);
    setValue('apellido', usuario.apellido);
    setValue('email', usuario.email);
    setValue('telefono', usuario.telefono);
    setValue('rol', usuario.rol);
    setEditOpen(true);
  };

  const handleEditSubmit = async (data: UsuarioForm) => {
    if (!selectedUsuario) return;
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await actualizarUsuario(selectedUsuario.id, data);
      setSuccessMsg("Usuario actualizado correctamente");
      setEditOpen(false);
      setSelectedUsuario(null);
      reset();
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al actualizar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsuario = async (usuarioId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    
    try {
      await eliminarUsuario(usuarioId);
      setSuccessMsg("Usuario eliminado correctamente");
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al eliminar el usuario");
    }
  };

  const handlePermisosUsuario = (usuario: UsuarioPermisos) => {
    setSelectedUsuario(usuario);
    setPermisosUsuario({
      puede_editar_cobros: usuario.puede_editar_cobros,
      puede_eliminar_cobros: usuario.puede_eliminar_cobros,
      puede_ver_historial: usuario.puede_ver_historial,
      puede_gestionar_usuarios: usuario.puede_gestionar_usuarios,
    });
    setPermisosOpen(true);
  };

  const handlePermisosSubmit = async () => {
    if (!selectedUsuario) return;
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await actualizarPermisosUsuario(selectedUsuario.id, permisosUsuario);
      setSuccessMsg("Permisos actualizados correctamente");
      setPermisosOpen(false);
      setSelectedUsuario(null);
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al actualizar los permisos");
    } finally {
      setLoading(false);
    }
  };

  const getRolLabel = (rol: string) => {
    const roleObj = roles.find(r => r.value === rol);
    return roleObj ? roleObj.label : rol;
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case ROLES.DOCTOR: return "bg-blue-100 text-blue-800";
      case ROLES.SECRETARIA: return "bg-green-100 text-green-800";
      case ROLES.ENFERMERA: return "bg-purple-100 text-purple-800";
      case ROLES.PACIENTE: return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Si no es doctor, mostrar mensaje de acceso denegado
  if (permisosLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (!esDoctor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los doctores pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] pt-10">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-extrabold text-[#4285f2]">Gestión de Usuarios</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4285f2] text-white h-14 px-10 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-2xl font-bold">
              <Plus className="w-6 h-6 mr-2" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Tabla de Usuarios */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6" />
            Usuarios del Consultorio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Usuario</th>
                  <th className="text-left p-4 font-semibold">Rol</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Permisos</th>
                  <th className="text-left p-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{usuario.nombre} {usuario.apellido}</div>
                        <div className="text-sm text-gray-500">{usuario.telefono}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRolColor(usuario.rol)}>
                        {getRolLabel(usuario.rol)}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{usuario.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {usuario.puede_editar_cobros && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            ✏️ Editar Cobros
                          </Badge>
                        )}
                        {usuario.puede_eliminar_cobros && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                            🗑️ Eliminar Cobros
                          </Badge>
                        )}
                        {usuario.puede_ver_historial && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            📋 Ver Historial
                          </Badge>
                        )}
                        {usuario.puede_gestionar_usuarios && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            👥 Gestionar Usuarios
                          </Badge>
                        )}
                        {!usuario.puede_editar_cobros && !usuario.puede_eliminar_cobros && 
                         !usuario.puede_ver_historial && !usuario.puede_gestionar_usuarios && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            🔒 Sin permisos especiales
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUsuario(usuario)}
                          title="Editar información del usuario"
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-xs">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermisosUsuario(usuario)}
                          title="Gestionar permisos del usuario"
                          className="flex items-center gap-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">Permisos</span>
                        </Button>
                        <ConditionalRender condition={usuario.rol !== ROLES.DOCTOR}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUsuario(usuario.id)}
                            title="Eliminar usuario"
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">Eliminar</span>
                          </Button>
                        </ConditionalRender>
                      </div>
                    </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </CardContent>
      </Card>

      {/* Mensajes de éxito/error */}
      {successMsg && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-8 py-5 rounded-xl shadow-2xl text-2xl font-bold animate-in slide-in-from-right-2 duration-500">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300">
          ❌ {errorMsg}
        </div>
      )}

      {/* Modal para crear usuario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  {...register("nombre")}
                  placeholder="Nombre del usuario"
                  className="text-gray-900"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  {...register("apellido")}
                  placeholder="Apellido del usuario"
                  className="text-gray-900"
                />
                {errors.apellido && (
                  <p className="text-red-500 text-sm">{errors.apellido.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@ejemplo.com"
                className="text-gray-900"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                placeholder="Teléfono"
                className="text-gray-900"
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm">{errors.telefono.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Mínimo 6 caracteres"
                className="text-gray-900"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rol">Rol *</Label>
              <select
                id="rol"
                {...register("rol")}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Selecciona un rol</option>
                {roles.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
              {errors.rol && (
                <p className="text-red-500 text-sm">{errors.rol.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuario */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  {...register("nombre")}
                  placeholder="Nombre del usuario"
                  className="text-gray-900"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  {...register("apellido")}
                  placeholder="Apellido del usuario"
                  className="text-gray-900"
                />
                {errors.apellido && (
                  <p className="text-red-500 text-sm">{errors.apellido.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                {...register("email")}
                placeholder="email@ejemplo.com"
                className="text-gray-900"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-telefono">Teléfono *</Label>
              <Input
                id="edit-telefono"
                {...register("telefono")}
                placeholder="Teléfono"
                className="text-gray-900"
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm">{errors.telefono.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-rol">Rol *</Label>
              <select
                id="edit-rol"
                {...register("rol")}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Selecciona un rol</option>
                {roles.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
              {errors.rol && (
                <p className="text-red-500 text-sm">{errors.rol.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Usuario"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para gestionar permisos */}
      <Dialog open={permisosOpen} onOpenChange={setPermisosOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Gestionar Permisos
            </DialogTitle>
          </DialogHeader>
          {selectedUsuario && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">{selectedUsuario.nombre} {selectedUsuario.apellido}</h3>
                <p className="text-sm text-gray-600">{selectedUsuario.email}</p>
                <Badge className={getRolColor(selectedUsuario.rol)}>
                  {getRolLabel(selectedUsuario.rol)}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editar-cobros">Puede editar cobros</Label>
                                     <Switch
                     id="editar-cobros"
                     checked={permisosUsuario.puede_editar_cobros}
                     onCheckedChange={(checked: boolean) => 
                       setPermisosUsuario(prev => ({ ...prev, puede_editar_cobros: checked }))
                     }
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <Label htmlFor="eliminar-cobros">Puede eliminar cobros</Label>
                   <Switch
                     id="eliminar-cobros"
                     checked={permisosUsuario.puede_eliminar_cobros}
                     onCheckedChange={(checked: boolean) => 
                       setPermisosUsuario(prev => ({ ...prev, puede_eliminar_cobros: checked }))
                     }
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <Label htmlFor="ver-historial">Puede ver historial</Label>
                   <Switch
                     id="ver-historial"
                     checked={permisosUsuario.puede_ver_historial}
                     onCheckedChange={(checked: boolean) => 
                       setPermisosUsuario(prev => ({ ...prev, puede_ver_historial: checked }))
                     }
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <Label htmlFor="gestionar-usuarios">Puede gestionar usuarios</Label>
                   <Switch
                     id="gestionar-usuarios"
                     checked={permisosUsuario.puede_gestionar_usuarios}
                     onCheckedChange={(checked: boolean) => 
                       setPermisosUsuario(prev => ({ ...prev, puede_gestionar_usuarios: checked }))
                     }
                   />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handlePermisosSubmit} disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar Permisos"}
                </Button>
                <Button variant="outline" onClick={() => setPermisosOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sección de Consultorios */}
      <div className="mt-12">
        <Consultorios />
      </div>
    </div>
  );
} 