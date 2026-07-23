import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";

function Estadias() {

  const [estadias, setEstadias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const location = useLocation(); // Hook para obtener la URL
  // Detectar si venimos del Dashboard por "Deudores"
  const [soloDeudores, setSoloDeudores] = useState(
    new URLSearchParams(location.search).get("deudores") === "true"
  );

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [total, setTotal] = useState(0);
  const [totalActivas, setTotalActivas] = useState(0);

  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [timerId, setTimerId] = useState(null);

  const mostrarAlerta = (msj, tipo = "success") => {
    if (timerId) clearTimeout(timerId);
    setNotificacion({ mostrar: true, mensaje: msj, tipo });
    const tiempoDuracion = tipo === "success" ? 1500 : 4500;
    const nuevoTimer = setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: "", tipo: "" });
    }, tiempoDuracion);
    setTimerId(nuevoTimer);
  };

  // 🔄 FETCH
  const fetchEstadias = async () => {
    try {

      let url = `/parking/?search=${busqueda}`;

      if (filtroFecha) {
        url += `&filtro=${filtroFecha}`;
      }

      if (filtroEstado === "activas") {
        url += `&activa=true`;
      } else if (filtroEstado === "finalizadas") {
        url += `&activa=false`;
      }

      const res = await api.get(url);
      let datos = res.data;

      // LÓGICA DE FILTRADO POR DEUDA
      if (soloDeudores) {
        datos = datos.filter(e => e.deuda > 0);
      }
      setEstadias(datos);

    } catch (error) {
      console.error(error);
    }
  };

  const fetchTotal = async () => {
    try {
      const res = await api.get("/parking/");
      setTotal(res.data.length);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchTotalActivas = async () => {
    try {
        const res = await api.get("/parking/?activa=true");
        setTotalActivas(res.data.length);
    } catch (error) {
        console.error(error);
    }
  };

  useEffect(() => {
    fetchEstadias();
    fetchTotal();
    fetchTotalActivas();
  }, []);

  useEffect(() => {
    fetchEstadias();
  }, [busqueda, filtroFecha, soloDeudores, filtroEstado]);

  //  FORMATEAR FECHA
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  return (
    <div className="space-y-6">
      {/* TÍTULO Y BOTÓN DE DEUDORES */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Estadías</h1>
        
        {soloDeudores && (
          <button 
            onClick={() => setSoloDeudores(false)}
            className="bg-red-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-red-600 transition-all flex items-center gap-2"
          >
            Filtrando por Deuda <span className="bg-white text-red-500 rounded-full px-1.5 text-xs">✕</span>
          </button>
        )}
      </div>

      {/* SECCIÓN PRINCIPAL DE INFO Y FILTROS */}
      <div className="flex flex-wrap items-end justify-between gap-6 w-full">
        
        {/* LADO IZQUIERDO: KPIs (Uno al lado del otro) */}
        <div className="flex gap-4 flex-1 min-w-fit">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-blue-500 flex-1 min-w-[200px]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total estadías</p>
            <p className="text-3xl font-black text-gray-800">{total}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-green-500 flex-1 min-w-[200px]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-wider">Activas</p>
            <p className="text-3xl font-black text-green-600">{totalActivas}</p>
          </div>
        </div>

        {/* LADO DERECHO: PANEL DE FILTROS (Más grande y legible) */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-50 flex flex-col gap-4 min-w-fit">
          <p className="text-sm font-black uppercase tracking-widest text-gray-400">Filtros</p>
          
          <div className="flex gap-8 items-center">
            {/* GRUPO DE FECHA */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 ml-1">FECHA</span>
              <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
                {["hoy", "ayer", "7dias", "mes"].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFiltroFecha(f)} 
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filtroFecha === f ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    {f === "7dias" ? "7 Días" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                {filtroFecha && (
                  <button onClick={() => setFiltroFecha("")} className="px-3 text-red-500 font-bold hover:bg-red-50 rounded-lg">✕</button>
                )}
              </div>
            </div>

            {/* DIVISOR */}
            <div className="h-12 w-[2px] bg-gray-200 rounded-full"></div>

            {/* GRUPO DE ESTADO */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 ml-1">ESTADO</span>
              <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
                <button 
                  onClick={() => setFiltroEstado("todas")} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'todas' ? 'bg-green-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFiltroEstado("activas")} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'activas' ? 'bg-green-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Activas
                </button>
                <button 
                  onClick={() => setFiltroEstado("finalizadas")} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'finalizadas' ? 'bg-green-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Finalizadas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      




      {/* BUSCADOR */}
      <div className="relative">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por patente, cliente o DNI..."
          className="w-full bg-white border border-gray-200 px-5 py-3 rounded-2xl text-lg font-medium text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
        />
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-black text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-center">Patente</th>
                <th className="px-6 py-4 text-center">Cliente</th>
                <th className="px-6 py-4 text-center">Entrada</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Pago</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {estadias.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-center">
                  <span className="bg-gray-800 text-white text-lg font-mono px-3 py-1 rounded-md font-bold tracking-wider shadow-sm">
                    {e.patente?.toUpperCase()}
                  </span>
                </td>
                  <td className="text-center text-lg px-6 py-4 font-medium text-gray-700">{e.cliente_nombre || e.cliente}</td>
                  <td className="text-center text-lg px-6 py-4 text-gray-500 font-medium">{formatFecha(e.fecha_entrada)}</td>
                  
                  {/* ESTADO BADGE */}
                  <td className="px-6 py-4 text-center">
                    {e.activa ? (
                      <span className="inline-flex px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-lg font-bold border border-green-100">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-lg font-bold border border-gray-200/50">
                        Finalizada
                      </span>
                    )}
                  </td>

                  {/* PAGO BADGE */}
                  <td className="px-6 py-4 text-center">
                    {Number(e.deuda) === 1000 ? (
                      /* Si la deuda es el valor base 1000, mostramos Pendiente */
                      <span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-lg font-black border border-amber-100">
                        ⏳ Pendiente de pago
                      </span>
                    ) : Number(e.deuda) > 0 ? (
                      /* Si es cualquier otro número mayor a cero, mostramos la deuda real */
                      <span className="inline-flex px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-lg font-black border border-red-100">
                        Deuda ${e.deuda}
                      </span>
                    ) : (
                      /* Si es 0, está totalmente saldada */
                      <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-lg font-black border border-emerald-100">
                        Pagada
                      </span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4 text-right">
                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-bold text-lg"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/parking/${e.id}/`);
                          setSelected(res.data);
                          setModal("acciones");
                        } catch (error) {
                          mostrarAlerta("Error al cargar la estadía", "error");
                        }
                      }}
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
              {estadias.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-400 font-medium">
                    No se encontraron estadías con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES */}

      {modal === "acciones" && (
        <AccionesModal
          estadia={selected}
          onClose={() => setModal(null)}
          onSelect={(tipo) => setModal(tipo)}
        />
      )}

      {modal === "detalles" && (
        <DetallesModal
          estadia={selected}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "editar" && (
        <EditarModal
          estadia={selected}
          onClose={() => setModal(null)}
          onSuccess={(msg, tipo) => {
            setModal(null);
            fetchEstadias();
            mostrarAlerta(msg, tipo);
          }}
        />
      )}

      {modal === "eliminar" && (
        <EliminarModal
          estadia={selected}
          onClose={() => setModal(null)}
          onSuccess={(msg, tipo) => {
            setModal(null);
            fetchEstadias();
            fetchTotal();
            fetchTotalActivas();
            mostrarAlerta(msg, tipo);
          }}
        />
      )}

      {/* NOTIFICACIÓN TOAST COMPARTIDA */}
      {notificacion.mostrar && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center z-[9999]">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl text-white font-black text-base flex items-center gap-3  ${
            notificacion.tipo === "success" ? "bg-green-600" : "bg-red-600"
          }`}>
            <span>{notificacion.tipo === "success" ? "✅" : "⚠️"}</span>
            {notificacion.mensaje}
          </div>
        </div>
      )}

    </div>
  );
}

export default Estadias;

function AccionesModal({ estadia, onClose, onSelect }) {
  const isDueno = localStorage.getItem('modo_dueno') === 'true';
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-2xl shadow-xl w-72 border border-gray-100 mx-4 space-y-1">
        <p className="text-sm font-black text-gray-400 uppercase tracking-wider pb-2 px-2">Acciones - Patente 
          <span className="font-black text-gray-700"> {estadia.patente}</span>
        </p>
        
        <button onClick={() => onSelect("detalles")} className="w-full text-left px-3 py-2.5 text-lg font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2">
          🔍 Ver detalles
        </button>

        <button onClick={() => onSelect("editar")} className="w-full text-left px-3 py-2.5 text-lg font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2">
          ✏️ Editar estadía
        </button>

        {isDueno && (
          <button onClick={() => onSelect("eliminar")} className="w-full text-left px-3 py-2.5 text-lg font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
            🗑️ Eliminar registro
          </button>
        )}
        
        <div className="pt-2">
          <button onClick={onClose} className="w-full border border-gray-200 py-2 rounded-xl font-bold text-md text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-wider">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetallesModal({ estadia, onClose }) {

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 border border-gray-100 mx-4 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-xl font-black text-gray-900">Detalles de Estadía</h2>
          <p className="text-md font-bold text-blue-600 mt-0.5">Patente: {estadia.patente}</p>
        </div>

        <div className="space-y-2.5 text-lg text-gray-600">
          <p className="flex justify-between border-b border-gray-50 pb-1.5"><b>Cliente:</b> <span className="font-bold text-gray-800">{estadia.cliente}</span></p>
          <p className="flex justify-between border-b border-gray-50 pb-1.5"><b>Tipo Cobro:</b> <span className="font-bold uppercase text-gray-800">{estadia.tipo_estadia}</span></p>
          <p className="flex justify-between border-b border-gray-50 pb-1.5"><b>Cantidad:</b> <span className="font-bold text-gray-800">{estadia.cantidad}</span></p>
          <p className="flex justify-between border-b border-gray-50 pb-1.5"><b>Ingreso:</b> <span className="font-medium text-gray-700">{formatFecha(estadia.fecha_entrada)}</span></p>

          {estadia.activa ? (
            <p className="flex justify-between border-b border-gray-50 pb-1.5"><b>Salida Estimada:</b> <span className="font-medium text-blue-600">{formatFecha(estadia.fecha_salida_estimada)}</span></p>
          ) : (
            <p className="flex justify-between border-b border-gray-50 pb-1.5"><b>Salida Real:</b> <span className="font-medium text-gray-700">{formatFecha(estadia.fecha_salida_real)}</span></p>
          )}

          {estadia.notas && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-1 mt-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Notas / Observaciones:</span>
              <p className="text-md font-medium text-gray-700 whitespace-pre-wrap">{estadia.notas}</p>
            </div>
          )}

          <div className={`p-3 rounded-xl flex justify-between items-center mt-4 ${
            Number(estadia.deuda) === 1000 
              ? "bg-amber-50 text-amber-700 border border-amber-100" 
              : estadia.deuda > 0 
                ? "bg-red-50 text-red-700 border border-red-100" 
                : "bg-emerald-50 text-emerald-800 border border-emerald-100"
          }`}>
            <span className="font-black text-sm uppercase tracking-wider">
              {Number(estadia.deuda) === 1000 ? "Estado Pago:" : estadia.deuda > 0 ? "Estado Deuda:" : "Estado Cuenta:"}
            </span>
            <span className="text-lg font-black">
              {Number(estadia.deuda) === 1000 ? "Pendiente" : `$${estadia.deuda}`}
            </span>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-lg shadow-sm transition-colors mt-2">
          Cerrar panel
        </button>
      </div>
    </div>
  );
}

function EditarModal({ estadia, onClose, onSuccess }) {

  const isDueno = localStorage.getItem('modo_dueno') === 'true';
  const yaEstaPaga = Number(estadia.deuda) === 0;

  const [form, setForm] = useState({
    tipo_estadia: estadia.tipo_estadia,
    cantidad: estadia.cantidad,
    precio: estadia.precio,
    notas: estadia.notas || ""
  });

  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    setLoading(true);
    try {

      const payload = { ...form };
      if (Number(payload.precio) === 1000) {
        delete payload.precio;
      }

      await api.patch(`/parking/${estadia.id}/`, payload);
      onSuccess("Estadía actualizada correctamente ✅", "success");
      
    } catch (error) {
      console.error(error);
      const msgErr = error.response?.data?.detail || "Error al actualizar la estadía.";
      onSuccess(msgErr, "error");
    }finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 border border-gray-100 mx-4 space-y-4">
        <div className="border-b border-gray-100 pb-2">
          <h2 className="text-xl font-black text-gray-900">Editar Tarifas / Tiempos</h2>
          <p className="text-lg text-gray-400 font-medium">Patente: {estadia.patente}</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-md font-bold text-gray-400 uppercase ml-1">Tiempo</label>
            <select
              value={form.tipo_estadia}
              onChange={(e) => setForm({ ...form, tipo_estadia: e.target.value })}
              className="border border-gray-200 p-2.5 rounded-xl text-md font-medium bg-gray-50 focus:outline-hidden focus:border-blue-500 w-full"
            >
              <option value="hora">Hora</option>
              <option value="dia">Día</option>
              <option value="mes">Mes</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-md font-bold text-gray-400 uppercase ml-1">Cantidad tiempo</label>
            <input
              type="number"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className="border border-gray-200 p-2.5 rounded-xl text-md font-medium bg-gray-50 focus:outline-hidden focus:border-blue-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-md font-bold text-gray-400 uppercase ml-1">Precio total ($)</label>
            {(!yaEstaPaga || isDueno) ? (
              // Si NO está paga (es deuda), o si el usuario es DUEÑO, se muestra el input normal para editar/ver
              <input 
                type="number"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-purple-500"
              />
            ) : (
              // Si YA está paga y es un EMPLEADO, bloquear la visualización por completo
              <div className="bg-gray-50 border border-gray-100 text-gray-400 p-2 rounded-xl font-bold flex items-center gap-2 select-none">
                🔒 Monto oculto (Ya abonado)
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-md font-bold text-gray-400 uppercase ml-1">Notas / Observaciones</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej: El cliente dejó las llaves, seguro vigente, etc..."
              rows="3"
              className="border border-gray-200 p-2.5 rounded-xl text-md font-medium bg-gray-50 focus:outline-hidden focus:border-blue-500 w-full resize-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={guardar} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl font-bold text-lg shadow-sm transition-colors">
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl font-bold text-lg text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function EliminarModal({ estadia, onClose, onSuccess }) {

  const [loading, setLoading] = useState(false);

  const eliminar = async () => {
    setLoading(true);
    try {
      await api.delete(`/parking/${estadia.id}/`);
      onSuccess("Registro de estadía eliminado permanentemente 🗑️", "success");
    } catch (error) {
      console.error(error);
      const msgErr = error.response?.data?.error || "No se pudo eliminar el registro de estadía.";
      onSuccess(msgErr, "error");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-80 text-center border-t-4 border-red-500">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">¿Confirmar eliminación?</h2>
        <p className="text-lg text-gray-500 mb-6">
          Estás por eliminar el registro de estadia de la patente <b className="text-gray-800">{estadia.patente}</b>. Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-2">
          <button onClick={eliminar} className=" text-lg bg-red-500 hover:bg-red-600 text-white flex-1 py-2 rounded font-bold transition-colors">
            Sí, Eliminar
          </button>
          <button onClick={onClose} className=" text-lg border-2 border-gray-100 hover:bg-gray-50 text-gray-600 flex-1 py-2 rounded font-bold transition-colors">
            No, Cancelar
          </button>
        </div>
      </div>
    </div>
  );




    /*<div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 text-center border border-gray-100 mx-4 space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl mx-auto font-bold">⚠️</div>
        
        <p className="text-gray-700 text-sm font-medium px-2">
          ¿Seguro que querés eliminar el registro de estadía de la patente <span className="font-black text-gray-900">{estadia.patente}</span>?
        </p>

        <div className="flex gap-2 pt-2">
          <button onClick={eliminar} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
          <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );*/
}

