import { useEffect, useState } from "react";
import api from "../api/axios";

function Vehiculos() {

  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const mostrarAlerta = (msj, tipo = "success") => {
    setNotificacion({ mostrar: true, mensaje: msj, tipo });
    setTimeout(() => setNotificacion({ mostrar: false, mensaje: "", tipo: "" }), 1500);
  };
  
  //FETCH VEHICULOS
  const fetchVehiculos = async () => {
    try {
      const res = await api.get(`/vehicles/?search=${busqueda}`);
      setVehiculos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTotal = async () => {
    try {
      const res = await api.get("/vehicles/");
      setTotal(res.data.length);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchVehiculos();
    fetchTotal();
  }, []);

  useEffect(() => {
    fetchVehiculos();
  }, [busqueda]);


  const [patentePrecargada, setPatentePrecargada] = useState("");
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const abrirNuevo = params.get("nuevo");
  const patenteURL = params.get("patente");

  if (abrirNuevo === "true") {
    if (patenteURL) setPatentePrecargada(patenteURL.toUpperCase());
    setModal("crear");
    //limpiar la URL después de abrirlo para que no se repita al recargar:
    //window.history.replaceState({}, document.title, "/vehiculos");
  }
  }, []);

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4">

        
        <h1 className="text-3xl font-bold text-gray-800">Vehículos</h1>
        <button
            onClick={() => setModal("crear")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 text-lg flex items-center gap-1.5"
            >
            <span>+</span> Nuevo Vehiculo
        </button>

      </div>
      <div className="w-64">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-blue-500">
        <p className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total vehículos</p>
        <p className="text-3xl font-black text-gray-800">{total}</p>
     </div>
      </div>
      

      {/* BUSCADOR */}
      <div className="w-full">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por patente o cliente..."
          className="border-2 border-gray-100 focus:border-blue-400 p-3 rounded-2xl w-full shadow-sm outline-none transition-all text-lg font-medium"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="p-2 text-center">Patente</th>
              <th className="p-2 text-center">Cliente</th>
              <th className="p-2 text-center">Teléfono</th>
              <th className="p-2 text-center">Tipo</th>
              <th className="p-2 text-center">Estado</th>
              <th className="p-2 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {vehiculos.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">

                <td className="p-4 text-center">
                  <span className="bg-gray-800 text-white text-lg font-mono px-3 py-1 rounded-md font-bold tracking-wider shadow-sm">
                    {v.patente?.toUpperCase()}
                  </span>
                </td>

                <td className="p-4 text-center font-semibold text-gray-800 text-lg">
                  {v.cliente}
                </td>

                <td className="p-4 text-center text-gray-600 font-mono text-lg">
                  {v.telefono || "—"}
                </td>

                <td className="p-4 text-center">
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-gray-600">
                    {v.tipo || "—"}
                  </span>
                </td>

                <td className="p-4 text-center">
                    {v.estacionado ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-green-100 text-green-700">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
                      ESTACIONADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gray-100 text-gray-400">
                      LIBRE
                    </span>
                  )}
                </td>

                <td className="p-4 text-center">
                  <button
                    className="text-gray-400 hover:text-gray-800 p-1.5 rounded-lg text-lg font-bold transition-colors"
                    onClick={async () => {
                        try {
                            const res = await api.get(`/vehicles/${v.id}/`);
                            setSelected(res.data); 
                            setModal("acciones");
                        } catch (error) {
                            console.error(error);
                            mostrarAlerta("Error al cargar el vehículo", "error");
                        }
                    }}
                  >
                    ⋮
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* MODALES */}
      {modal === "crear" && (
        <CrearVehiculoModal
          patenteInicial={patentePrecargada}
          onClose={() => {
            setModal(null);
            setPatentePrecargada("");
            window.history.replaceState({}, document.title, "/vehiculos"); // Limpiamos al cerrar
          }}
          onSuccess={(mensaje) => {
            setModal(null);
            setPatentePrecargada("");
            fetchVehiculos();
            fetchTotal();
            mostrarAlerta(mensaje || "Vehículo registrado correctamente");
          }}
        />
      )}

      {modal === "acciones" && (
        <AccionesVehiculoModal
            vehiculo={selected}
            onClose={() => setModal(null)}
            onSelect={(tipo) => setModal(tipo)}
        />
      )}

      {modal === "detalles" && (
        <DetallesVehiculoModal
            vehiculo={selected}
            onClose={() => setModal(null)}
        />
      )}

      {modal === "editar" && (
        <EditarVehiculoModal
            vehiculo={selected}
            onClose={() => setModal(null)}
            onSuccess={(msj) => {
            setModal(null);
            fetchVehiculos();
            mostrarAlerta(msj);
          }}
        />
      )}

      {modal === "eliminar" && (
        <EliminarVehiculoModal
            vehiculo={selected}
            onClose={() => setModal(null)}
            onSuccess={(msj) => {
              setModal(null);
              fetchVehiculos();
              fetchTotal();
              mostrarAlerta(msj);
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

export default Vehiculos;

function CrearVehiculoModal({ onClose, onSuccess, mostrarAlerta, notificacion }) {


  const params = new URLSearchParams(window.location.search);
  const patenteInicial = params.get("patente") || "";

  const [form, setForm] = useState({
    patente: patenteInicial|| "" ,
    marca: "",
    modelo: "",
    color: "",
    tipo: "",
    notas: "",
    cliente: "",
    es_extranjero: false
  });
// Estados para la búsqueda de clientes
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteSeleccionadoNombre, setClienteSeleccionadoNombre] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});

  // Efecto para buscar clientes mientras el usuario escribe
  useEffect(() => {
    if (busquedaCliente.length > 1) { // Empezar a buscar tras 2 caracteres
      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await api.get(`/clients/?search=${busquedaCliente}`);

          // Obtenemos los datos (manejando si vienen en .results o array directo)
          let data = res.data.results || res.data;

          const termino = busquedaCliente.toLowerCase();

          // 1. FILTRADO ESTRICTO: Solo dejamos los que EMPIEZAN con el término
          const soloQueEmpiezan = data.filter(c => {
            const dniStr = String(c.DNI).toLowerCase();
            const nombreStr = c.nombre.toLowerCase();
            return dniStr.startsWith(termino) || nombreStr.startsWith(termino);
          });

          // 2. ORDENAMIENTO (Opcional, pero útil para nombres)
          soloQueEmpiezan.sort((a, b) => a.nombre.localeCompare(b.nombre));

          // 3. ACTUALIZAR ESTADO
          setClientesFiltrados(soloQueEmpiezan);
          setMostrarLista(true);
        } catch (err) {
          console.error("Error buscando clientes", err);
        }
      }, 300); // Pequeña espera para no saturar el back
      return () => clearTimeout(delayDebounceFn);
    } else {
      setClientesFiltrados([]);
      setMostrarLista(false);
    }
  }, [busquedaCliente]);

  useEffect(() => {
    if (patenteInicial) {
      setForm(prev => ({ ...prev, patente: patenteInicial }));
    }
  }, [patenteInicial]);

  useEffect(() => {
    api.get("/clients/").then(res => setClientes(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.name === "patente" ? e.target.value.toUpperCase() : e.target.value
    });
  };

  const seleccionarCliente = (cliente) => {
    setForm({ ...form, cliente: cliente.id }); // Guardamos el ID para el POST
    setClienteSeleccionadoNombre(`${cliente.nombre} (DNI: ${cliente.DNI})`); // Para mostrar al usuario
    setBusquedaCliente(""); // Limpiamos el input de búsqueda
    setMostrarLista(false);
  };

  const guardar = async () => {
    // Limpiamos errores previos antes de validar de nuevo
    setErrores({});
    setError("");
    const errs = validar();
    if (Object.keys(errs).length > 0) {
        setErrores(errs);
        return;
    }
    try {
      await api.post("/vehicles/create/", form);
      onSuccess("Vehículo registrado correctamente ✅");
    } catch (err) {
      // Si el error viene del BACKEND (porque la validación falló allá)
      if (err.response && err.response.data) {
        const serverData = err.response.data;
        
        // Si el backend responde con { "error": true, "mensaje": [...] }
        if (serverData.error === true && serverData.mensaje) {
          const mensajeError = Array.isArray(serverData.mensaje) 
            ? serverData.mensaje[0] 
            : serverData.mensaje;

          // Si el mensaje habla de la patente, lo ponemos en errores.patente
          if (mensajeError.toLowerCase().includes("patente") || mensajeError.toLowerCase().includes("exists")) {
            setErrores({ patente: "Esta patente ya está registrada en el sistema." });
          } else {
            // Si es otro tipo de error, lo ponemos en el error general
            setError(mensajeError);
          }
        } 
        // Si el backend responde con el formato estándar de campos
        else if (typeof serverData === 'object') {
          const nuevosErrores = {};
          for (const campo in serverData) {
            nuevosErrores[campo] = Array.isArray(serverData[campo]) ? serverData[campo][0] : serverData[campo];
          }
          setErrores(nuevosErrores);
        }

      } else {
        setError("Error de conexión con el servidor");
      }
    }
  };

  const validar = () => {
    let errs = {};

    if (!form.patente) {
      errs.patente = "La patente es obligatoria";
    } else if (!form.es_extranjero) {
      // Validación de formato Argentino en el Front
      const formatoViejo = /^[A-Z]{3}\d{3}$/.test(form.patente);
      const formatoNuevo = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(form.patente);
      
      if (!formatoViejo && !formatoNuevo) {
        errs.patente = "Formato argentino inválido (Use AAA123 o AA123BB)";
      }
    }

    if (!form.cliente) {
      errs.cliente = "Debe seleccionar un cliente";
    }

    if (!form.tipo) {
      errs.tipo = "Debe seleccionar un tipo (Auto/Moto)";
    }


    return errs;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">

      <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 space-y-4 border-t-4 border-blue-600">

        <div>
          <h2 className="text-xl font-bold text-gray-800">Nuevo Vehículo</h2>
          {patenteInicial && (
            <p className="text-sm text-blue-600 font-bold mt-1">
              Registrando patente ingresada en Entrada
            </p>
          )}
        </div>

        <div className="space-y-3">
          <input
            name="patente"
            value={form.patente}
            onChange={handleChange}
            placeholder="PATENTE"
            className={` text-lg border-2 border-gray-100 p-2.5 w-full rounded-xl outline-none focus:border-blue-500 font-mono font-bold uppercase ${patenteInicial ? "bg-blue-50 border-blue-300" : ""}`}
          />

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="es_extranjero"
              checked={form.es_extranjero}
              onChange={(e) => {
                const marcado = e.target.checked;
                setForm({ ...form, es_extranjero: marcado });
                if (marcado) setErrores((prev) => ({ ...prev, patente: null }));
              }}
              className="w-4 h-4 cursor-pointer rounded accent-blue-600"
            />
            <label htmlFor="es_extranjero" className="text-sm text-gray-500 cursor-pointer select-none font-semibold">
              Es patente extranjera
            </label>
          </div>
          {errores.patente && <p className="text-red-500 text-sm font-bold pl-1">{errores.patente}</p>}

          <div className="grid grid-cols-2 gap-2">
            <input
              name="marca"
              value={form.marca}
              onChange={handleChange}
              placeholder="Marca"
              className="border-2 border-gray-100 p-2.5 w-full rounded-xl outline-none focus:border-blue-500 text-lg font-medium"
            />
            <input
              name="modelo"
              value={form.modelo}
              onChange={handleChange}
              placeholder="Modelo"
              className="border-2 border-gray-100 p-2.5 w-full rounded-xl outline-none focus:border-blue-500 text-lg font-medium"
            />
          </div>

          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            placeholder="Color"
            className="border-2 border-gray-100 p-2.5 w-full rounded-xl outline-none focus:border-blue-500 text-lg font-medium"
          />

          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="border-2 border-gray-100 p-2.5 w-full rounded-xl outline-none focus:border-blue-500 text-lg font-semibold text-gray-700 bg-white"
          >
            <option value="">Seleccionar tipo</option>
            <option value="auto">Auto</option>
            <option value="moto">Moto</option>
          </select>
          {errores.tipo && <p className="text-red-500 text-sm font-bold pl-1">{errores.tipo}</p>}

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

          {/* BUSCADOR DE CLIENTE */}
          <div className="relative pt-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cliente Responsable</label>
            
            {form.cliente && (
              <div className="flex justify-between items-center bg-blue-50 p-2.5 border border-blue-200 rounded-xl mb-2 animate-fade-in">
                <span className="text-lg text-blue-800 font-bold">{clienteSeleccionadoNombre}</span>
                <button 
                  onClick={() => setForm({...form, cliente: ""})}
                  className="text-red-500 text-md font-black hover:underline"
                >Cambiar</button>
              </div>
            )}

            {!form.cliente && (
              <>
                <input
                  type="text"
                  placeholder="Buscar por Nombre o DNI..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="border-2 border-blue-400 p-2.5 w-full rounded-xl outline-none text-lg font-medium"
                  autoComplete="off"
                />
                {mostrarLista && clientesFiltrados.length > 0 && (
                  <ul className="absolute Brab-list z-50 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1 divide-y divide-gray-50">
                    {clientesFiltrados.map(c => (
                      <li 
                        key={c.id}
                        onClick={() => seleccionarCliente(c)}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer text-md font-semibold text-gray-700 transition-colors"
                      >
                        {c.nombre} <span className="text-gray-400 font-mono text-md ml-1">- DNI: {c.DNI}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {mostrarLista && clientesFiltrados.length === 0 && (
                  <div className="absolute z-50 w-full bg-gray-50 p-3 border rounded-xl text-md text-gray-400 font-medium mt-1">
                    No se encontraron clientes.
                  </div>
                )}
              </>
            )}
            {errores.cliente && <p className="text-red-500 text-sm font-bold pl-1 mt-1">{errores.cliente}</p>}
          </div>

        </div>

        

        {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2 rounded-xl">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button          
            onClick={guardar}
            className=" text-lg bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl font-bold transition-colors shadow-md"
          >
            Guardar
          </button>

          <button
            onClick={onClose}
            className=" text-lg border w-full py-2 rounded"
          >
            Cancelar
          </button>
        </div>

      </div>

    </div>
  );
}



function AccionesVehiculoModal({ vehiculo, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-72 overflow-hidden border-t-4 border-blue-600">
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-xs font-bold text-gray-400 uppercase">Vehículo Seleccionado</p>
          <p className="font-mono font-bold text-lg text-gray-800">{vehiculo.patente}</p>
        </div>
        
        <div className="p-2 space-y-1">
          <button onClick={() => onSelect("detalles")} className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded flex items-center gap-3 transition-colors group">
            <span className="group-hover:scale-110 transition-transform">🔍</span>
            <span className="text-lg font-medium text-gray-700">Ver detalles</span>
          </button>

          <button onClick={() => onSelect("editar")} className="w-full text-left px-4 py-3 hover:bg-amber-50 rounded flex items-center gap-3 transition-colors group">
            <span className="group-hover:scale-110 transition-transform">✏️</span>
            <span className="text-lg font-medium text-gray-700">Editar información</span>
          </button>

          <button onClick={() => onSelect("eliminar")} className="w-full text-left px-4 py-3 hover:bg-red-50 rounded flex items-center gap-3 transition-colors group">
            <span className="group-hover:scale-110 transition-transform">🗑️</span>
            <span className="text-lg font-medium text-red-600">Eliminar vehículo</span>
          </button>
        </div>

        <button onClick={onClose} className="w-full py-3 text-md text-gray-400 hover:text-gray-600 font-bold uppercase tracking-widest bg-gray-50 border-t">
          Cerrar menú
        </button>
      </div>
    </div>
  );
}

function DetallesVehiculoModal({ vehiculo, onClose }) {
  const [dniCargado, setDniCargado] = useState("Cargando...");
  const [estaEstacionado, setEstaEstacionado] = useState(vehiculo.estacionado);
  useEffect(() => {
    // Si 'cliente' es un ID (como el 1 que mencionas), buscamos su info completa
    if (vehiculo.cliente && typeof vehiculo.cliente === "number") {
      api.get(`/clients/${vehiculo.cliente}/`)
        .then(res => {
          // Ajusta '.DNI' según como se llame en tu API de clientes
          setDniCargado(res.data.DNI || res.data.dni || "No disponible");
        })
        .catch(err => {
          console.error("Error al traer DNI del cliente:", err);
          setDniCargado("No disponible");
        });
    } else if (vehiculo.cliente_dni) {
      // Por si en algún momento el backend ya lo trae
      setDniCargado(vehiculo.cliente_dni);
    }

    api.get(`/vehicles/?search=${vehiculo.patente}`)
      .then(res => {
        // Como el search devuelve una lista, buscamos el primer resultado
        if (res.data.results && res.data.results.length > 0) {
            const vEncontrado = res.data.results[0];
            setEstaEstacionado(vEncontrado.estacionado);
        } else if (Array.isArray(res.data) && res.data.length > 0) {
            // Por si tu API devuelve array directo sin .results
            setEstaEstacionado(res.data[0].estacionado);
        }
      })
      .catch(err => {
        console.error("Error al buscar estado por patente:", err);
        setEstaEstacionado(false);
      });

  }, [vehiculo.patente, vehiculo.cliente]);



  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[400px] overflow-hidden border-t-4 border-indigo-600">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Ficha Técnica</h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Información del sistema</p>
            </div>
            <div className="bg-gray-800 text-white px-3 py-1 rounded font-mono text-xl shadow-lg border-2 border-gray-600">
              {vehiculo.patente}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-b pb-6 mb-6">
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block">Marca / Modelo</label>
              <p className="text-gray-800 font-semibold">{vehiculo.marca || "—"} {vehiculo.modelo || ""}</p>
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block">Color</label>
              <p className="text-gray-800 font-semibold">{vehiculo.color || "—"}</p>
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block">Tipo de Vehículo</label>
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm font-bold rounded uppercase">
                {vehiculo.tipo}
              </span>
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider block">Estado Actual</label>
              <div className="flex items-center gap-1.5 mt-1">
                {estaEstacionado === null ? (
                  <p className="text-[12px] text-gray-400 animate-pulse font-bold uppercase">Verificando...</p>
                ) : (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full ${estaEstacionado ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`}></span>
                    <p className={`text-sm font-bold ${estaEstacionado ? "text-green-600" : "text-gray-400"}`}>
                      {estaEstacionado ? "ESTACIONADO" : "FUERA DEL LOCAL"}
                    </p>
                  </>
                )}
              </div>
            </div>
            {vehiculo.notas && (
              <div className="col-span-2 text-sm bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-xl mt-2">
                💡 <b>Nota interna:</b> {vehiculo.notas}
              </div>
            )}
          </div>
          

          <div className="bg-gray-50 p-4 rounded-lg border">
            <label className="text-[12px] font-bold text-indigo-500 uppercase tracking-wider block mb-2">Cliente Propietario</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                {vehiculo.cliente_nombre?.charAt(0)}
              </div>
              <div>
                <p className="text-md font-bold text-gray-800">{vehiculo.cliente_nombre}</p>
                <p className="text-[15px] text-gray-500 font-mono">
                  DNI: <span className={dniCargado === "Cargando..." ? "animate-pulse" : ""}>{dniCargado}</span>
                </p>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="mt-6 w-full bg-gray-800 hover:bg-black text-white py-3 rounded-lg font-bold transition-all shadow-md">
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}

function EditarVehiculoModal({ vehiculo, onClose, onSuccess, mostrarAlerta }) {

  const [form, setForm] = useState(vehiculo);
  const [confirmando, setConfirmando] = useState(false); // Estado para el paso previo al save

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.name === "patente" ? e.target.value.toUpperCase() : e.target.value
    });
  };

  const guardar = async () => {

    // Si la patente cambió, primero pedimos confirmar
    if (form.patente !== vehiculo.patente && !confirmando) {
      setConfirmando(true);
      return;
    }

    try {
      await api.put(`/vehicles/${vehiculo.id}/`, form);
      onSuccess("Vehículo actualizado correctamente ✅");
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al intentar actualizar el vehículo", "error");
    }
  };

  // Función para volver atrás y restaurar la patente original
  const cancelarConfirmacion = () => {
    setForm({ ...form, patente: vehiculo.patente }); // Restauramos solo la patente
    setConfirmando(false);
  };

return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-96 space-y-4 border-t-4 border-blue-600">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {confirmando ? "🔍 Revisar Patente" : "✏️ Editar Vehículo"}
        </h2>

        {!confirmando ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patente</label>
              <input name="patente" value={form.patente} onChange={handleChange} className="border-2 border-gray-100 p-2 w-full rounded focus:border-blue-500 outline-none font-mono text-lg" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Marca</label>
                <input name="marca" value={form.marca} onChange={handleChange} className="border-2 border-gray-100 p-2 w-full rounded focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Modelo</label>
                <input name="modelo" value={form.modelo} onChange={handleChange} className="border-2 border-gray-100 p-2 w-full rounded focus:border-blue-500 outline-none" />
              </div>
            </div>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="border-2 border-gray-100 p-2 w-full rounded focus:border-blue-500 outline-none">
               <option value="auto">Auto</option>
               <option value="moto">Moto</option>
            </select>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-center space-y-3">
            <p className="text-sm text-blue-700">Has modificado la patente. Por favor, verificá que sea correcta antes de guardar:</p>
            <div className="bg-white border-2 border-gray-800 rounded inline-block px-4 py-1 shadow-md">
              <span className="text-[10px] block text-center leading-none text-gray-400 border-b mb-1">ARGENTINA</span>
              <span className="font-mono font-bold text-2xl uppercase">{form.patente}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={guardar} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded font-bold transition-colors">
            {confirmando ? "Confirmar y Guardar" : "Guardar Cambios"}
          </button>
          <button 
            onClick={() => confirmando ? cancelarConfirmacion() : onClose()} 
            className="border-2 border-gray-100 hover:bg-gray-50 text-gray-600 w-full py-2.5 rounded font-bold transition-colors"
          >
            {confirmando ? "Volver a editar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EliminarVehiculoModal({ vehiculo, onClose, onSuccess, mostrarAlerta }) {

  const eliminar = async () => {
    try {
      await api.delete(`/vehicles/${vehiculo.id}/`);
      onSuccess("Vehículo eliminado del sistema");
    } catch (error) {
      const msg = error.response?.data?.error || "No se pudo eliminar el vehículo";
      mostrarAlerta(msg, "error");
      onClose();      
    }
  };

return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-80 text-center border-t-4 border-red-500">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🗑️
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">¿Confirmar eliminación?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Estás por eliminar el vehículo con patente <b className="text-gray-800">{vehiculo.patente}</b>. Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-2">
          <button onClick={eliminar} className="bg-red-500 hover:bg-red-600 text-white flex-1 py-2 rounded font-bold transition-colors">
            Sí, Eliminar
          </button>
          <button onClick={onClose} className="border-2 border-gray-100 hover:bg-gray-50 text-gray-600 flex-1 py-2 rounded font-bold transition-colors">
            No, Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}


