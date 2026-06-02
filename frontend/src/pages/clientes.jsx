import { useEffect, useState } from "react";
import api from "../api/axios";

function Clientes() {

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // detalles | editar | eliminar
  const [totalClientes, setTotalClientes] = useState(0);

  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [timerId, setTimerId] = useState(null);

  const mostrarAlerta = (msj, tipo = "success") => {
    if (timerId) clearTimeout(timerId);

    setNotificacion({ mostrar: true, mensaje: msj, tipo });

    // ⏱️ Definimos los tiempos en milisegundos
    // Éxito: 1.5 segundos (rápido y fluido) | Error: 4.5 segundos (da tiempo a leer)
    const tiempoDuracion = tipo === "success" ? 1500 : 2500;

    const nuevoTimer = setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: "", tipo: "" });
    }, tiempoDuracion);

    setTimerId(nuevoTimer);
  };
  

  // 🔄 CARGAR CLIENTES
  const fetchClientes = async () => {
    try {
      const res = await api.get(`/clients/?search=${busqueda}`);
      setClientes(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchTotalClientes = async () => {
    try {
        const res = await api.get("/clients/");
        setTotalClientes(res.data.length);
    } catch (error) {
        console.error(error);
    }
  }
  const fetchDetalleCliente = async (id) => {
    try {
      const res = await api.get(`/clients/${id}/`);
      setSelected(res.data); // Actualizamos el seleccionado con la info completa
      setModal("detalles");  // Recién ahí abrimos el modal
    } catch (error) {
      console.error("Error al obtener detalle:", error);
      mostrarAlerta("No se pudo obtener la información completa", "error");
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchTotalClientes();
  }, [busqueda]);

  return (
    <div className="grid grid-cols-1  gap-6 p-1">

      {/* 🟦 IZQUIERDA */}
      <div className="space-y-5">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Clientes</h1>

          <button
            onClick={() => setModal("crear")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 text-lg flex items-center gap-1.5"
            >
            <span>+</span> Nuevo Cliente
          </button>
        </div>

        {/* TOTAL */}
        <div className="w-64">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-blue-500 ">
            <p className="text-gray-400 font-bold uppercase text-sm tracking-wider">Total de clientes</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{totalClientes}</p>
          </div>
        </div>
        

        {/* BUSCADOR */}
        <div >
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, apellido o DNI"
            className="border border-gray-200 p-3 rounded-xl w-full shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
        </div>
        

        {/* TABLA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
              <tr>
                <th className="p-4 text-left uppercase font-semibold">Nombre</th>
                <th className="p-4 text-center uppercase font-semibold">Teléfono</th>
                <th className="p-4 text-center uppercase font-semibold">Email</th>
                <th className="p-4 text-center uppercase font-semibold">Vehículos</th>
                <th className="p-4 text-center uppercase font-semibold">Registro</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 text-gray-700">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">

                  <td className="p-4 font-medium text-gray-900 text-lg">
                    {c.nombre} {c.apellido}
                  </td>

                  <td className="p-4 text-center font-mono text-lg text-gray-600">{c.telefono}</td>
                  <td className="p-4 text-center text-lg text-gray-600">{c.email || "—"}</td>
                  <td className="p-4 text-center">                    
                    <span className="bg-gray-100 text-gray-700 text-lg px-2.5 py-1 rounded-full font-bold">
                      {c.vehiculos ?? 0}
                    </span>
                  </td>

                  <td className="p-4 text-center text-lg text-gray-500">
                    {new Date(c.fecha_registro).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelected(c);
                        setModal("acciones");
                      }}
                      className="text-gray-400 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 transition-all text-lg font-bold leading-none"
                    >
                      ⋮
                    </button>
                  </td>

                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                    No se encontraron clientes.
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
          cliente={selected}
          onClose={() => setModal(null)}
          onSelect={(tipo) => {
            if (tipo === "detalles") {
              fetchDetalleCliente(selected.id);
            } else {
              setModal(tipo);
            }
          }}
        />
      )}

      {modal === "detalles" && (
        <DetallesModal cliente={selected} onClose={() => setModal(null)} />
      )}

      {modal === "editar" && (
        <EditarModal
          cliente={selected}
          onClose={() => setModal(null)}
          onSuccess={(msg, tipo) => {
            setModal(null);
            fetchClientes();
            mostrarAlerta(msg, tipo);
          }}
        />
      )}

      {modal === "eliminar" && (
        <EliminarModal
          cliente={selected}
          onClose={() => setModal(null)}
          onSuccess={(msg, tipo) => {
            setModal(null);
            if (tipo === "success") {
              fetchClientes();
              fetchTotalClientes();
            }
            mostrarAlerta(msg, tipo);
          }}
        />
      )}

      {modal === "crear" && (
        <CrearClienteModal
            onClose={() => setModal(null)}
            onSuccess={(msg, tipo) => {
            setModal(null);
            fetchClientes();
            fetchTotalClientes();
            mostrarAlerta(msg, tipo);
            }}
        />
      )}

      {notificacion.mostrar && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[9999]">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl text-white font-bold text-lg transition-all duration-100  flex items-center gap-3 animate-fade-in ${
            notificacion.tipo === "success" ? "bg-green-600" : "bg-red-600"
          }`}>
            {notificacion.tipo === "success" ? "✅" : "⚠️"}
            {notificacion.mensaje}
          </div>
        </div>
      )}

    </div>
  );
}

export default Clientes;
const imprimirFichaCliente = async (clienteId) => {
    try {
      const response = await api.get(`/clients/${clienteId}/pdf/`, {
        responseType: 'blob', // CRÍTICO para archivos
      });
      
      // Crear un link temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha_cliente_${clienteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error al descargar el PDF", error);
      mostrarAlerta("No se pudo descargar la ficha del cliente", "error");
    }
  };

function AccionesModal({ cliente, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">

      <div className="bg-white p-5 rounded-2xl shadow-xl w-64 space-y-1.5 border border-gray-100">

        <h3 className="text-lg font-black text-gray-400 uppercase tracking-wider pb-2 border-b mb-1">Acciones</h3>
        <button onClick={() => onSelect("detalles")} className="w-full text-left py-2 px-3 text-lg font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
          🔍 Ver detalles
        </button>

        <button onClick={() => onSelect("editar")} className="w-full text-left py-2 px-3 text-lg font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
          ✏️ Editar
        </button>

        <button 
                onClick={() => imprimirFichaCliente(cliente.id)}
                className="w-full text-left py-2 px-3 text-lg font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
          🖨️ Imprimir Ficha
        </button>

        <button onClick={() => onSelect("eliminar")} className="w-full text-left py-2 px-3 text-lg font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          🗑️ Eliminar
        </button>
        

        <button onClick={onClose} className="w-full mt-2 py-2 text-lg font-bold text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center">
          Cancelar
        </button>

      </div>

    </div>
  );
}

function DetallesModal({ cliente, onClose }) {
  const listaVehiculos = cliente.vehiculos || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[450px] max-w-full">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Ficha del Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Nombre Completo</p>
            <p className="text-gray-900 text-lg font-medium">{cliente.nombre} {cliente.apellido}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">DNI</p>
            <p className="text-gray-900 text-lg font-medium">{cliente.DNI || cliente.dni || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Teléfono</p>
            <p className="text-gray-900 text-lg font-medium">{cliente.telefono}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Email</p>
            <p className="text-gray-900 text-lg font-medium truncate">{cliente.email || "No registra"}</p>
          </div>
          {cliente.notas && (
            <div className="col-span-2 text-sm bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-xl mt-2">
              💡 <b>Nota interna:</b> {cliente.notas}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            🚗 Vehículos Asociados
          </h3>
          <div className="flex flex-wrap gap-2">
            {listaVehiculos.length > 0 ? (
              listaVehiculos.map((v, index) => (
                <div key={index} className="bg-white border-2 border-gray-800 rounded px-2 py-1 shadow-sm">
                   <span className="text-[10px] block text-center leading-none text-gray-400 border-b mb-1">ARGENTINA</span>
                   <span className="font-mono font-bold text-lg uppercase tracking-tighter">
                     {v.patente}
                   </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No tiene vehículos registrados.</p>
            )}
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function EditarModal({ cliente, onClose, onSuccess }) {
  // Al iniciar, nos aseguramos de que el valor del DNI esté en 'dni' 
  // independientemente de cómo venga del back (DNI o dni)
  const [form, setForm] = useState({
    ...cliente,
    dni: cliente.DNI || cliente.dni || "" 
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Bloqueamos edición de DNI (aunque el input sea readOnly, por seguridad)
    if (name === "dni") return; 

    if (name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "");
      setForm({ ...form, [name]: soloNumeros });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const guardar = async () => {
    
    setLoading(true);

    try {
      // 1. Preparamos el paquete de datos. 
      // Mandamos 'DNI' y 'dni' para que el back lo encuentre sí o sí.
      const dataAEnviar = {
        ...form,
        DNI: form.dni,
        dni: form.dni
      };

      // 2. Usamos PATCH para actualización parcial
      await api.patch(`/clients/${cliente.id}/`, dataAEnviar);
      onSuccess("Datos del cliente actualizados ✅");
    } catch (error) {
      console.error(error);
      if (error.response?.data) {
        const serverData = error.response.data;
        
        // Manejo de error "ya existe" (salvavidas)
        const msj = serverData.mensaje || "";
        if (msj.toString().toLowerCase().includes("exist") || msj.toString().toLowerCase().includes("existe")) {
          // Si el DNI es el mismo que ya tenía, el back se confundió, cerramos con éxito.
          onSuccess("Cliente actualizado ✅");
        } else {
          setErrores(serverData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 space-y-4 border border-gray-100 mx-4">
        <h2 className="text-lg font-black text-gray-800 border-b pb-2 tracking-tight">Editar Cliente</h2>

        <div className="space-y-1">
          <label className="text-sm text-gray-400 uppercase font-bold tracking-wider">Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className="border border-gray-200 p-2.5 w-full rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-red-500 uppercase font-bold tracking-wider">DNI (No editable)</label>
          <input 
            name="dni" 
            value={form.dni} 
            readOnly // Esto impide que el usuario escriba
            className="border border-gray-200 p-2.5 w-full rounded-xl text-lg bg-gray-50 cursor-not-allowed text-gray-400 font-mono" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-400 uppercase font-bold tracking-wider">Teléfono</label>
          <input name="telefono" value={form.telefono} onChange={handleChange} className="border border-gray-200 p-2.5 w-full rounded-xl text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-400 uppercase font-bold tracking-wider">Email</label>
          <input name="email" value={form.email} onChange={handleChange} className="border border-gray-200 p-2.5 w-full rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={guardar} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl font-bold text-lg shadow-sm transition-colors">
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl font-bold text-lg text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function EliminarModal({ cliente, onClose, onSuccess }) {

  const [loading, setLoading] = useState(false);
  const eliminar = async () => {
    setLoading(true);
    try {
      await api.delete(`/clients/${cliente.id}/`);
      onSuccess("Cliente eliminado correctamente ✅", "success");
    } catch (error) {
      console.error(error);
      onSuccess("No se pudo eliminar. Verificá si tiene dependencias asociadas.", "error");
    }finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 text-center border border-gray-100 mx-4 space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl mx-auto font-bold">⚠️</div>
        
        <p className="text-gray-700 text-lg font-medium px-2">
          ¿Seguro que querés eliminar permanentemente a <span className="font-black text-gray-900">{cliente.nombre} {cliente.apellido}</span>?
        </p>

        <div className="flex gap-2 pt-2">
          <button onClick={eliminar} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white w-full py-2.5 rounded-xl font-bold text-lg shadow-sm transition-colors">
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
          <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl font-bold text-lg text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
    
  );
}

function CrearClienteModal({ onClose, onSuccess }) {

  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    email: "",
    notas: ""
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "dni" || name === "telefono") {
      const soloNumeros = value.replace(/\D/g, ""); // Elimina todo lo que no sea número
      setForm({ ...form, [name]: soloNumeros });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  // VALIDACIÓN FRONT
  const validar = () => {
    let errs = {};

    if (!form.nombre) errs.nombre = "El nombre es obligatorio";
    if (!form.dni) errs.dni = "El DNI es obligatorio";
    if (!form.telefono) errs.telefono = "El teléfono es obligatorio";

    return errs;
  };

  // GUARDAR
  const guardar = async () => {

    setErrores({});
    const errs = validar();
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }

    try {
      setLoading(true);

      await api.post("/clients/create/", form);

      onSuccess("Cliente registrado correctamente ✅");

    } catch (error) {

      console.error(error);

      if (error.response?.data) {
      const serverData = error.response.data;

      // ERRORES ESPECÍFICOS
      if (serverData.error === true && serverData.mensaje) {
        const msj = Array.isArray(serverData.mensaje) ? serverData.mensaje[0] : serverData.mensaje;
        
        // Atajamos el error de DNI duplicado específicamente
        if (msj.toLowerCase().includes("dni") || msj.toLowerCase().includes("exists")) {
          setErrores({ dni: "Este DNI ya pertenece a otro cliente." });
        } else {
          setErrores({ general: msj });
        }
      } else {
        // Formato estándar de Django
        const nuevosErrores = {};
        for (const campo in serverData) {
          nuevosErrores[campo] = Array.isArray(serverData[campo]) ? serverData[campo][0] : serverData[campo];
        }
        setErrores(nuevosErrores);
      }
    }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 space-y-4 border-t-4 border-blue-600 mx-4">

        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 tracking-tight">Nuevo Cliente</h2>

        {/* NOMBRE */}
        <div className="space-y-1">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            className="border border-gray-200 p-2.5 w-full rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
          {errores.nombre && (
            <p className="text-red-500 text-xs px-1 font-medium">{errores.nombre}</p>
          )}
        </div>

        {/* DNI */}
        <div className="space-y-1">
          <input
            name="dni"
            value={form.dni}
            onChange={handleChange}
            placeholder="DNI"
            className="border border-gray-200 p-2.5 w-full rounded-xl text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
          {errores.dni && (
            <p className="text-red-500 text-xs px-1 font-medium">{errores.dni}</p>
          )}
        </div>
        {errores.general && (
          <p className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-medium">{errores.general}</p>
        )}

        {/* TELÉFONO */}
        <div className="space-y-1">
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
            className="border border-gray-200 p-2.5 w-full rounded-xl text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
          {errores.telefono && (
            <p className="text-red-500 text-xs px-1 font-medium">{errores.telefono}</p>
          )}
        </div>

        {/* EMAIL */}
        <div className="space-y-1">
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email (opcional)"
            className="border border-gray-200 p-2.5 w-full rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
          {errores.email && (
            <p className="text-red-500 text-xs px-1 font-medium">{errores.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 w-full">
          <label className="text-md font-bold text-gray-400 uppercase ml-1">
            Notas / Observaciones (Opcional)
          </label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Escribí acá cualquier detalle o recordatorio importante..."
            rows="3"
            className="border border-gray-200 p-2.5 rounded-xl text-md font-medium bg-gray-50 focus:outline-hidden focus:border-blue-500 w-full resize-none"
          />
        </div>

        {/* BOTONES */}
        <div className="flex gap-2 pt-2">

          <button
            onClick={guardar}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl font-bold text-lg shadow-sm transition-colors"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>

          <button
            onClick={onClose}
            className="w-full border border-gray-200 py-2.5 rounded-xl font-bold text-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>
  );
}
