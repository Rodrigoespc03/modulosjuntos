import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { useForm, useFieldArray as useFieldArrayRH } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConceptos } from "./ConceptosContext";
import { crearCobro, agregarConceptoACobro, getPacientes, getUsuarios, getConsultorios, getCobros, eliminarCobro, editarCobro } from "../services/cobrosService";
import PacienteSearch from "./PacienteSearch";
import TableFilters from "./TableFilters";
import { exportToPDF, exportToExcel, formatCobrosForExport } from "../services/exportService";
import ConceptoSearch from "./ConceptoSearch";
import { FaExclamationTriangle } from "react-icons/fa";
import { usePermisos, ConditionalRender } from '../hooks/usePermisos';

const conceptoSchema = z.object({
  conceptoId: z.string().min(1, "Selecciona un concepto"),
  precio_unitario: z.string().or(z.number()),
  cantidad: z.string().or(z.number()),
});

const cobroSchema = z.object({
  paciente: z.string().min(1, "El paciente es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  conceptos: z.array(conceptoSchema).min(1, "Agrega al menos un concepto"),
  pidioFactura: z.boolean().optional(),
  usuario: z.string().min(1, "El usuario es requerido"),
  consultorio: z.string().min(1, "El consultorio es requerido"),
  pagos: z.array(z.object({
    metodo: z.string().min(1, "Selecciona un método de pago"),
    monto: z.string().or(z.number()).refine(val => Number(val) > 0, "El monto es requerido"),
  })).min(1, "Agrega al menos un método de pago"),
});

type CobroForm = z.infer<typeof cobroSchema>;

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Cobros({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { servicios, loading } = useConceptos();
  const { permisos, rol } = usePermisos();
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CobroForm>({
    resolver: zodResolver(cobroSchema),
    defaultValues: {
      paciente: "",
      fecha: getToday(),
      conceptos: [
        { conceptoId: servicios[0]?.id ?? "", precio_unitario: servicios[0]?.precio_base?.toString() ?? "0", cantidad: "1" } as { conceptoId: string; precio_unitario: string | number; cantidad: string | number },
      ],
      pagos: [{ metodo: "", monto: "" }],
    },
  });

  const { fields, append, remove, update } = useFieldArrayRH({
    control,
    name: "conceptos",
  });

  const {
    fields: pagoFields,
    append: appendPago,
    remove: removePago,
  } = useFieldArrayRH({
    control,
    name: "pagos",
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Limpiar mensajes automáticamente después de 5 segundos
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);
  
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [cobros, setCobros] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [filteredCobros, setFilteredCobros] = useState<any[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [estadoCobro, setEstadoCobro] = useState('PENDIENTE');
  const [editCobro, setEditCobro] = useState<any>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);

  useEffect(() => {
    getPacientes().then(setPacientes);
    getUsuarios().then(setUsuarios);
    getConsultorios().then(setConsultorios);
    getCobros().then((data) => {
      console.log('Cobros data received:', data);
      console.log('First cobro:', data[0]);
      console.log('First cobro paciente:', data[0]?.paciente);
      setCobros(data);
      setFilteredCobros(data);
    });
  }, []);

  // Pre-llenar usuario y consultorio cuando se cargan los datos
  useEffect(() => {
    if (usuarios.length > 0 && consultorios.length > 0) {
      // Obtener el usuario actual del localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const currentUser = usuarios.find(u => u.id === user.id);
          if (currentUser) {
            setValue('usuario', currentUser.id);
            setValue('consultorio', currentUser.consultorio_id);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, [usuarios, consultorios, setValue]);

  const refreshCobros = async () => {
    const data = await getCobros();
    setCobros(data);
    setFilteredCobros(data);
  };

  const handleFiltersChange = (filters: {
    pacienteId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) => {
    let filtered = [...cobros];

    if (filters.pacienteId) {
      filtered = filtered.filter(c => c.paciente_id === filters.pacienteId);
    }

    if (filters.fechaDesde) {
      filtered = filtered.filter(c => c.fecha_cobro >= filters.fechaDesde!);
    }

    if (filters.fechaHasta) {
      filtered = filtered.filter(c => c.fecha_cobro <= filters.fechaHasta!);
    }

    setFilteredCobros(filtered);
  };

  const handleExportPDF = async () => {
    const exportData = formatCobrosForExport(filteredCobros);
    await exportToPDF(exportData);
  };

  const handleExportExcel = async () => {
    const exportData = formatCobrosForExport(filteredCobros);
    await exportToExcel(exportData);
  };

  const calcularSubtotal = (concepto: any) => {
    const precio = parseFloat(String(concepto.precio_unitario ?? "0"));
    const cantidad = parseInt(String(concepto.cantidad ?? "1"));
    return precio * cantidad;
  };

  const calcularTotal = () => {
    return fields.reduce((total, field, idx) => {
      const precio = parseFloat(String(watch(`conceptos.${idx}.precio_unitario`) ?? servicios.find(s => s.id === field.conceptoId)?.precio_base ?? 0));
      const cantidad = parseInt(String(watch(`conceptos.${idx}.cantidad`) ?? 1));
      return total + (precio * cantidad);
    }, 0);
  };

  const calcularTotalPagos = () => {
    return pagoFields.reduce((total, field, idx) => {
      const monto = parseFloat(String(watch(`pagos.${idx}.monto`) || 0));
      return total + monto;
    }, 0);
  };

  const onSubmit = async (data: CobroForm) => {
    console.log("submit start", data);
    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const monto_total = data.conceptos.reduce((total, concepto) => {
        const precio = parseFloat(String(concepto.precio_unitario ?? servicios.find(s => s.id === concepto.conceptoId)?.precio_base ?? 0));
        const cantidad = parseInt(String(concepto.cantidad ?? 1));
        return total + (precio * cantidad);
      }, 0);
      if (data.pagos && calcularTotalPagos() !== monto_total) {
        setErrorMsg("La suma de los métodos de pago debe ser igual al total del cobro");
        setFormLoading(false);
        console.log("submit error: suma de métodos de pago no coincide");
        return;
      }
      const payload = {
        paciente_id: selectedPaciente?.id || data.paciente,
        usuario_id: data.usuario,
        fecha_cobro: data.fecha,
        monto_total,
        estado: estadoCobro,
        notas: data.pidioFactura ? 'Pidió factura' : '',
        pagos: data.pagos.map(pago => ({
          metodo: pago.metodo,
          monto: parseFloat(String(pago.monto))
        }))
      };
      console.log("payload a enviar", payload);
      const cobro = await crearCobro(payload);
      for (const concepto of data.conceptos) {
        console.log("agregando concepto", concepto);
        await agregarConceptoACobro({
          cobro_id: cobro.id,
          servicio_id: concepto.conceptoId,
          precio_unitario: parseFloat(String(concepto.precio_unitario ?? servicios.find(s => s.id === concepto.conceptoId)?.precio_base ?? 0)),
          cantidad: parseInt(String(concepto.cantidad ?? 1)),
          subtotal: (parseFloat(String(concepto.precio_unitario ?? servicios.find(s => s.id === concepto.conceptoId)?.precio_base ?? 0)) * parseInt(String(concepto.cantidad ?? 1))),
          consultorio_id: data.consultorio,
        });
      }
      setSuccessMsg("Cobro registrado correctamente");
      setShowForm(false);
      await refreshCobros();
      console.log("submit success");
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || e?.message || "Error al registrar el cobro");
      console.log("submit error", e);
    } finally {
      setFormLoading(false);
    }
  };

  console.log("Form render", { errors, fields, pagoFields, selectedPaciente, pacienteValue: watch("paciente") });

  return (
    <div className={embedded ? "" : "w-full max-w-[1600px] pt-10"}>
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-extrabold text-[#4285f2]">Gestión de Cobros</h1>
        <Button
          className="bg-[#4285f2] text-white h-14 px-10 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-2xl font-bold"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancelar" : "Nuevo Cobro"}
        </Button>
      </div>
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-xl p-10 mb-12 max-w-4xl mx-auto flex flex-col gap-8 border border-gray-200 animate-fade-in"
        >
          <h2 className="text-3xl font-bold text-[#4285f2] mb-4">Registrar Nuevo Cobro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xl font-semibold mb-2 text-gray-900">Paciente *</label>
              <PacienteSearch
                pacientes={pacientes}
                onPacienteSelect={(paciente) => {
                  setSelectedPaciente(paciente);
                  setValue("paciente", paciente.id);
                  console.log("setValue paciente", paciente.id);
                }}
                placeholder="Buscar paciente por nombre..."
              />
              <input type="hidden" {...register("paciente")}/>
              {!selectedPaciente && (
                <p className="text-red-500 text-lg mt-1">Debe seleccionar un paciente</p>
              )}
              {errors.paciente && <span className="text-red-500 text-lg block mt-1">{errors.paciente.message as string}</span>}
            </div>
            <div>
              <label className="block text-xl font-semibold mb-2 text-gray-900">Usuario *</label>
              <select {...register("usuario")}
                className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                defaultValue="">
                <option value="" disabled>Selecciona un usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                ))}
              </select>
              {errors.usuario && <span className="text-red-500 text-lg block mt-1">{errors.usuario.message as string}</span>}
            </div>
            <div>
              <label className="block text-xl font-semibold mb-2 text-gray-900">Consultorio *</label>
              <select {...register("consultorio")}
                className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                defaultValue="">
                <option value="" disabled>Selecciona un consultorio</option>
                {consultorios.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.consultorio && <span className="text-red-500 text-lg block mt-1">{errors.consultorio.message as string}</span>}
            </div>
            <div>
              <label className="block text-xl font-semibold mb-2 text-gray-900">Fecha</label>
              <Input
                type="date"
                {...register("fecha")}
                value={getToday()}
                readOnly
                className="bg-gray-50 cursor-not-allowed h-14 px-4 text-xl text-gray-900"
              />
              {errors.fecha && <span className="text-red-500 text-lg">{errors.fecha.message}</span>}
            </div>
          </div>
          <div>
            <label className="block text-xl font-semibold mb-3 text-gray-900">Conceptos de Cobro</label>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-end mb-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Concepto</label>
                  <ConceptoSearch
                    conceptos={servicios}
                    value={field.conceptoId}
                    onChange={concepto => {
                      if (concepto) {
                        update(idx, {
                          conceptoId: concepto.id,
                          precio_unitario: concepto.precio_base.toString(),
                          cantidad: field.cantidad ?? "1"
                        });
                      } else {
                        update(idx, {
                          conceptoId: "",
                          precio_unitario: "0",
                          cantidad: field.cantidad ?? "1"
                        });
                      }
                    }}
                    placeholder="Buscar concepto por nombre..."
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Precio unitario</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register(`conceptos.${idx}.precio_unitario` as const)}
                    className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Precio"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Unidades</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    {...register(`conceptos.${idx}.cantidad` as const)}
                    className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Cant."
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Subtotal</label>
                  <span className="w-full h-14 flex items-center text-xl font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4">${calcularSubtotal({
                    precio_unitario: watch(`conceptos.${idx}.precio_unitario`) || servicios.find(s => s.id === field.conceptoId)?.precio_base || 0,
                    cantidad: watch(`conceptos.${idx}.cantidad`) || 1,
                  }).toFixed(2)}</span>
                </div>
                <div className="flex items-end h-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 px-6 text-xl font-semibold"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                  >
                    Quitar
                  </Button>
                </div>
                {errors.conceptos?.[idx]?.conceptoId && <span className="text-red-500 text-lg block mt-1 col-span-5">{errors.conceptos[idx].conceptoId.message as string}</span>}
                {errors.conceptos?.[idx]?.precio_unitario && <span className="text-red-500 text-lg block mt-1 col-span-5">{errors.conceptos[idx].precio_unitario.message as string}</span>}
                {errors.conceptos?.[idx]?.cantidad && <span className="text-red-500 text-lg block mt-1 col-span-5">{errors.conceptos[idx].cantidad.message as string}</span>}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-14 px-8 text-xl font-semibold mt-2"
              onClick={() => append({ conceptoId: "", precio_unitario: "0", cantidad: "1" })}
            >
              + Agregar Concepto
            </Button>
            {errors.conceptos && typeof errors.conceptos.message === 'string' && <span className="text-red-500 text-lg block mt-2">{errors.conceptos.message}</span>}
            <div className="flex justify-end mt-4">
              <span className="text-2xl font-bold text-gray-900">Total: ${calcularTotal().toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-8">
            <label className="block text-xl font-semibold mb-3 text-gray-900">Métodos de Pago *</label>
            {pagoFields.map((field, idx) => (
              <div key={field.id} className="flex gap-4 items-end mb-2">
                <select
                  {...register(`pagos.${idx}.metodo` as const)}
                  className="w-60 h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  defaultValue={field.metodo || ""}
                >
                  <option value="" disabled>Selecciona un método</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTRO">Otro</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register(`pagos.${idx}.monto` as const)}
                  className="w-40 h-14 px-4 text-xl border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Monto"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 px-6 text-xl font-semibold"
                  onClick={() => removePago(idx)}
                  disabled={pagoFields.length === 1}
                >
                  Quitar
                </Button>
                {errors.pagos?.[idx]?.metodo && <span className="text-red-500 text-lg block mt-1">{errors.pagos[idx].metodo.message as string}</span>}
                {errors.pagos?.[idx]?.monto && <span className="text-red-500 text-lg block mt-1">{errors.pagos[idx].monto.message as string}</span>}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-14 px-8 text-xl font-semibold mt-2"
              onClick={() => appendPago({ metodo: "", monto: "" })}
            >
              + Agregar método
            </Button>
            <div className="flex justify-end mt-2">
              <span className="text-lg font-bold text-gray-900">Total métodos: ${calcularTotalPagos().toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 mt-8">
              <input type="checkbox" {...register("pidioFactura")} className="w-6 h-6" />
              <label className="text-xl font-semibold text-gray-900">¿Pidió factura?</label>
            </div>
          </div>
          <div className="mt-8">
            <label className="block text-xl font-semibold mb-3 text-gray-900">Estado del Cobro *</label>
            <select
              value={estadoCobro}
              onChange={e => setEstadoCobro(e.target.value)}
              className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div className="flex justify-end gap-6 mt-8">
            <Button
              type="button"
              variant="outline"
              className="h-14 px-10 text-2xl font-bold"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-14 px-10 text-2xl font-bold bg-[#4285f2] text-white shadow-lg hover:bg-[#4285f2]/90"
              disabled={formLoading}
            >
              {formLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          {errorMsg && (
            <div className="text-red-600 text-xl mt-4 font-bold">{errorMsg === "La suma de los métodos de pago debe ser igual al total del cobro" ? `La suma de los métodos de pago ($${calcularTotalPagos().toFixed(2)}) debe ser igual al total del cobro ($${calcularTotal().toFixed(2)})` : errorMsg}</div>
          )}
        </form>
      )}
      {/* Filtros y tabla de cobros */}
      {!embedded && (
        <TableFilters
          pacientes={pacientes}
          onFiltersChange={handleFiltersChange}
        />
      )}
      
      {/* Resumen de cobros pendientes cuando está embebido */}
      {embedded && cobros.filter(c => c.estado === 'PENDIENTE').length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <FaExclamationTriangle className="text-yellow-600 text-lg" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800">
                  Cobros Pendientes Requieren Atención
                </h4>
                <p className="text-yellow-700 text-sm">
                  {cobros.filter(c => c.estado === 'PENDIENTE').length} cobro{cobros.filter(c => c.estado === 'PENDIENTE').length > 1 ? 's' : ''} pendiente{cobros.filter(c => c.estado === 'PENDIENTE').length > 1 ? 's' : ''} por un total de ${cobros.filter(c => c.estado === 'PENDIENTE').reduce((sum, c) => sum + Number(c.monto_total || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const pendientes = cobros.filter(c => c.estado === 'PENDIENTE');
                setFilteredCobros(pendientes);
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              Ver Pendientes
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Cobros ({filteredCobros.length} registros)
        </h3>
        
        {/* Filtros rápidos */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              const pendientes = cobros.filter(c => c.estado === 'PENDIENTE');
              setFilteredCobros(pendientes);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filteredCobros.every(c => c.estado === 'PENDIENTE') && filteredCobros.length > 0
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes ({cobros.filter(c => c.estado === 'PENDIENTE').length})
          </button>
          <button
            onClick={() => {
              setFilteredCobros(cobros);
            }}
            className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
          >
            Todos
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 border-blue-500">
          📄 PDF
        </Button>
        <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2 bg-green-500 text-white hover:bg-green-600 border-green-500">
          📊 Excel
        </Button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto mt-12 border border-gray-300">
        <table className="min-w-full text-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Paciente</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Conceptos</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Monto</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Fecha</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Estado</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Método</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Factura</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCobros.map((cobro) => (
              <tr key={cobro.id} className={`hover:bg-gray-50 transition-colors ${
                cobro.estado === 'PENDIENTE' ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
              }`}>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                  {cobro.paciente?.nombre} {cobro.paciente?.apellido}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                  {cobro.conceptos && cobro.conceptos.length > 0
                    ? cobro.conceptos.map((con: any) => `${con.servicio?.nombre || ''} ${con.cantidad}`).join(', ')
                    : '-'}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm font-semibold text-green-600">
                  ${cobro.monto_total}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                  {cobro.fecha_cobro?.slice(0,10)}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {cobro.estado === 'PENDIENTE' ? (
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 animate-pulse">
                      ⏳ Pendiente
                    </span>
                  ) : cobro.estado === 'COMPLETADO' ? (
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ Completado
                    </span>
                  ) : cobro.estado === 'CANCELADO' ? (
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      ❌ Cancelado
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {cobro.estado || 'Sin estado'}
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {Array.isArray(cobro.metodos_pago) && cobro.metodos_pago.length > 0 ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[#e3f0fd] text-[#4285f2]">
                      {cobro.metodos_pago.map((mp: any) => mp.metodo_pago).join(', ')}
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-black">-</span>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {cobro.notas?.toLowerCase().includes("factura") ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap flex gap-2">
                  {cobro.estado === 'PENDIENTE' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        if (window.confirm('¿Marcar este cobro como completado?')) {
                          try {
                            console.log('Actualizando cobro:', cobro.id, 'a estado COMPLETADO');
                            const updateData = {
                              estado: 'COMPLETADO'
                            };
                            console.log('Datos de actualización:', updateData);
                            const result = await editarCobro(cobro.id, updateData);
                            console.log('Resultado de actualización:', result);
                            setSuccessMsg('Cobro marcado como completado exitosamente');
                            await refreshCobros();
                          } catch (e: any) {
                            console.error('Error al actualizar el cobro:', e);
                            console.error('Error response:', e.response);
                            console.error('Error message:', e.message);
                            const errorMessage = e.message || e.response?.data?.error || 'Error al actualizar el cobro';
                            
                            // Si es un error de autenticación, mostrar mensaje específico
                            if (errorMessage.includes('Sesión expirada') || errorMessage.includes('inicia sesión')) {
                              setErrorMsg('Sesión expirada. Por favor, recarga la página e inicia sesión nuevamente.');
                            } else {
                              setErrorMsg(`Error al actualizar el cobro: ${errorMessage}`);
                            }
                          }
                        }
                      }} 
                      className="bg-green-500 text-white hover:bg-green-600 border-green-500"
                    >
                      ✅ Completar
                    </Button>
                  )}
                  {cobro.estado === 'CANCELADO' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        if (window.confirm('¿Reactivar este cobro como pendiente?')) {
                          try {
                            const updateData = {
                              estado: 'PENDIENTE'
                            };
                            await editarCobro(cobro.id, updateData);
                            setSuccessMsg('Cobro reactivado exitosamente');
                            await refreshCobros();
                          } catch (e: any) {
                            console.error('Error al reactivar el cobro:', e);
                            const errorMessage = e.message || e.response?.data?.error || 'Error al reactivar el cobro';
                            setErrorMsg(errorMessage);
                          }
                        }
                      }} 
                      className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                    >
                      🔄 Reactivar
                    </Button>
                  )}
                  <ConditionalRender condition={permisos?.puede_editar_cobros || false}>
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditCobro(cobro);
                      setEditFormOpen(true);
                    }} className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500">Editar</Button>
                  </ConditionalRender>
                  <ConditionalRender condition={permisos?.puede_eliminar_cobros || false}>
                    <Button variant="destructive" size="sm" onClick={async () => {
                      if (window.confirm('¿Seguro que deseas eliminar este cobro?')) {
                        try {
                          console.log('Eliminando cobro:', cobro.id);
                          const result = await eliminarCobro(cobro.id);
                          console.log('Resultado de eliminación:', result);
                          setSuccessMsg('Cobro eliminado exitosamente');
                          await refreshCobros();
                        } catch (e: any) {
                          console.error('Error al eliminar el cobro:', e);
                          console.error('Error response:', e.response);
                          console.error('Error message:', e.message);
                          const errorMessage = e.message || e.response?.data?.error || 'Error al eliminar el cobro';
                          
                          // Si es un error de autenticación, mostrar mensaje específico
                          if (errorMessage.includes('Sesión expirada') || errorMessage.includes('inicia sesión')) {
                            setErrorMsg('Sesión expirada. Por favor, recarga la página e inicia sesión nuevamente.');
                          } else {
                            setErrorMsg(`Error al eliminar el cobro: ${errorMessage}`);
                          }
                        }
                      }
                    }} className="bg-red-500 text-white hover:bg-red-600">Eliminar</Button>
                  </ConditionalRender>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCobros.length === 0 && (
          <div className="text-center py-12">
                    <div className="text-black text-xl mb-2">📅</div>
        <p className="text-black text-lg font-medium">
              No se encontraron cobros en el rango de fechas seleccionado
            </p>
            <p className="text-black text-base mt-1">
              Intenta cambiar las fechas o agregar un nuevo cobro
            </p>
          </div>
        )}
      </div>
      {successMsg && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-8 py-5 rounded-xl shadow-2xl text-2xl font-bold animate-in slide-in-from-right-2 duration-500">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300">
          <div className="flex items-center gap-2">
            <span>❌ {errorMsg}</span>
            {errorMsg.includes('Sesión expirada') && (
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.reload();
                }}
                className="bg-white text-red-500 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100"
              >
                Reiniciar Sesión
              </button>
            )}
          </div>
        </div>
      )}
      {editFormOpen && editCobro && (
        <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cobro</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Recoge los datos del formulario (puedes usar un ref o un pequeño formulario controlado)
                // Aquí solo un ejemplo básico:
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload: any = {};
                formData.forEach((value, key) => { payload[key] = value; });
                try {
                  await editarCobro(editCobro.id, payload);
                  setEditFormOpen(false);
                  setEditCobro(null);
                  await refreshCobros();
                } catch (err) {
                  alert('Error al editar el cobro');
                }
              }}
              className="flex flex-col gap-4"
            >
              <label>Monto
                <input name="monto_total" defaultValue={editCobro.monto_total} className="border p-2 rounded w-full" />
              </label>
              <label>Notas
                <input name="notas" defaultValue={editCobro.notas} className="border p-2 rounded w-full" />
              </label>
              {/* Agrega más campos según lo que quieras permitir editar */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditFormOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 