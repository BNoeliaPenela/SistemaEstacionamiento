import { useState, useEffect } from "react"; // Importante: agregamos useEffect
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import TicketImpresion from "../components/TicketImpresion";

function Entrada() {
  const navigate = useNavigate();
  const [patente, setPatente] = useState("");
  const [sugerencias, setSugerencias] = useState([]); // Nuevo: para la lista desplegable
  const [vehiculo, setVehiculo] = useState(null);
  const [noExiste, setNoExiste] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [estadiaParaImprimir, setEstadiaParaImprimir] = useState(null);
  const [abonaAhora, setAbonaAhora] = useState(false);

  const [fechaActual, setFechaActual] = useState(new Date());

  const [form, setForm] = useState({
    tipo_estadia: "hora",
    cantidad: 1,
    precio: "1000",
    notas: ""
  });

  useEffect(() => {
    const timerReloj = setInterval(() => {
      setFechaActual(new Date());
    }, 1000);

    // Limpieza al desmontar el componente
    return () => clearInterval(timerReloj);
  }, []);

  // LÓGICA DE AUTOCOMPLETADO
  useEffect(() => {
    const buscarSugerencias = async () => {
      // Solo buscamos si hay 2 o más caracteres para no saturar el servidor
      if (patente.length > 1 && !vehiculo) {
        try {
          // Usamos tu endpoint de búsqueda existente
          const res = await api.get(`/vehicles/buscar/?patente=${patente.toUpperCase()}`);
          
          // Si tu backend devuelve un objeto con "exists", lo manejamos así:
          if (res.data.sugerencias) {
              setSugerencias(res.data.sugerencias); 
          } else if (res.data.exists) {
              setSugerencias([res.data.vehicle]);
          } else {
              setSugerencias([]);
          }
        } catch (error) {
          console.error("Error en sugerencias", error);
        }
      } else {
        setSugerencias([]);
      }
    };

    // "Debounce": esperamos 300ms antes de disparar la búsqueda para que sea fluida
    const timer = setTimeout(buscarSugerencias, 300);
    return () => clearTimeout(timer);
  }, [patente, vehiculo]);


  // BUSCAR VEHÍCULO (Manual con botón)
  const buscarVehiculo = async () => {
    if (!patente.trim()) {
      setErrorMsg("Por favor, ingrese una patente para buscar.");
      return;
    }

    setLoading(true);
    try {
      setErrorMsg("");
      setSuccessMsg("");
      setNoExiste(false);

      const res = await api.get(`/vehicles/buscar/?patente=${patente.toUpperCase()}`);

      if (res.data.exists) {
        setVehiculo(res.data.vehicle);
        setSugerencias([]); // Cerramos sugerencias al encontrar
      } else {
        setVehiculo(null);
        setNoExiste(true);
      }
    } catch (error) {
      setErrorMsg("Ocurrió un error en el servidor al buscar el vehículo.");
    } finally {
      setLoading(false);
    }
  };

  // INPUTS
  const handleChange = (e) => {
    if (e.target.name === "patente") {
      setPatente(e.target.value.toUpperCase());
      setErrorMsg("");
      setNoExiste(false);
      setVehiculo(null);
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  // SELECCIONAR DESDE LA LISTA
  const seleccionarSugerencia = (v) => {
    setVehiculo(v);
    setPatente(v.patente);
    setSugerencias([]);
    setNoExiste(false);
  };

  // REGISTRAR ENTRADA
  const registrarEntrada = async () => {
    if (!vehiculo) {
      setErrorMsg("Primero debe buscar y seleccionar un vehículo registrado.");
      return;
    }
    if (form.cantidad <= 0) {
      setErrorMsg("La cantidad debe ser al menos 1.");
      return;
    }
    if (!form.precio || Number(form.precio) <= 0) {
      setErrorMsg("El precio es obligatorio y debe ser mayor a 0 para estimar la estadía.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/parking/entrada/", {
        vehiculo: vehiculo.id,
        tipo_estadia: form.tipo_estadia,
        cantidad: Number(form.cantidad),
        precio: Number(form.precio),
        notas: form.notas || ""
      });

      const activos = await api.get("/parking/?activa=true");


      setSuccessMsg(`¡Entrada registrada con éxito para la patente ${vehiculo.patente}!`);
      const datosEstadia = {
        id: res.data?.id || res.data?.estadia?.id,
        patente: patente.toUpperCase(),
        tipo_vehiculo: vehiculo?.tipo || vehiculo?.tipo_vehiculo || "xd",
        marca: vehiculo?.marca || "",
        modelo: vehiculo?.modelo || "",
        tipo_estadia: form.tipo_estadia,
        cantidad: form.cantidad,
        fecha_entrada: new Date(),
        fecha_salida_estimada: activos.data[0]?.fecha_salida_estimada || "-", 
        deuda: Number(form.precio),
        precio: form.precio,
        notas: form.notas || ""
      };
      
      if (abonaAhora) {
        // Redirigimos a pagos pasándole la estadía en el state EXACTAMENTE como lo hace tu dashboard
        navigate("/pagos", { state: { estadia: datosEstadia } });
      } else {
        // Si no abona ahora, se imprime de forma tradicional el ticket "Pendiente"
        setEstadiaParaImprimir(datosEstadia);
        setVehiculo(null);
        setPatente("");
        setForm({ tipo_estadia: "hora", cantidad: 1, precio: "1000" });
        setAbonaAhora(false);
        setTimeout(() => setSuccessMsg(""), 5000);
      }

    } catch (error) {
      const serverMsg = error.response?.data?.error || "Error al procesar la entrada.";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const botonDeshabilitado = loading || !vehiculo || !form.precio || Number(form.precio) <= 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Registrar Entrada de Vehículo
          </h2>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-r-xl shadow-2xs flex justify-between items-center font-bold text-sm">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="font-black text-lg hover:text-emerald-950">×</button>
          </div>
        )}

        {/* BUSCADOR CON SUGERENCIAS */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              value={patente}
              name="patente"
              onChange={handleChange}
              autoComplete="off"
              placeholder="Ej: ABC123 o AF123BK"
              className="border border-gray-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase font-mono tracking-wider font-bold"
            />
            <button
              onClick={buscarVehiculo}
              disabled={loading}
              className="bg-gray-900 text-white px-6 rounded-xl hover:bg-black font-black text-md transition-colors disabled:bg-gray-300"
            >
              {loading ? "..." : "Buscar"}
            </button>
          </div>

          {/* LISTA DESPLEGABLE DE SUGERENCIAS */}
          {sugerencias.length > 0 && !vehiculo && (
            <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {sugerencias.map((s) => (
                <li
                  key={s.id}
                  onClick={() => seleccionarSugerencia(s)}
                  className="p-3 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-none"
                >
                  <div>
                    <span className="font-black text-md bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded text-gray-900 tracking-wide">{s.patente}</span>
                    <span className="ml-3 text-gray-400 font-bold text-md uppercase">{s.marca} {s.modelo}</span>
                  </div>
                  <span className="text-blue-600 text-sm font-black uppercase tracking-wider">Seleccionar →</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-md border border-red-100 font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {vehiculo && (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="text-xs text-blue-500 font-black uppercase tracking-wider">Vehículo Identificado</p>
              <p className="text-lg font-black text-blue-900 tracking-wide uppercase">{vehiculo.patente}</p>
              <p className="text-xs font-bold text-blue-700 uppercase">{vehiculo.marca} {vehiculo.modelo}</p>
            </div>
            <span className="text-2xl bg-white w-10 h-10 flex items-center justify-center rounded-xl border border-blue-200/50 shadow-2xs">🚗</span>
          </div>
        )}

        {noExiste && (
          <div className="bg-amber-50/60 border border-amber-200/70 p-5 rounded-xl text-center space-y-3">
            <p className="text-amber-800 text-md font-bold">
              Esta patente no figura en la base de datos de Garage.
            </p>
            <button
              onClick={() => { window.location.href = `/vehiculos?nuevo=true&patente=${patente.toUpperCase()}`; }}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-md font-black hover:bg-amber-700 transition shadow-xs"
            >
              + Registrar Vehículo Nuevo
            </button>
          </div>
        )}

        {/* FORMULARIO DE ESTADÍA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 border border-gray-100/80 p-4 rounded-xl">
          <div className="flex flex-col">
            <label className="text-sm font-black text-gray-600 uppercase tracking-wider mb-1 ml-1">Tipo de Estadía</label>
            <select
              name="tipo_estadia"
              value={form.tipo_estadia}
              onChange={handleChange}
              className="border border-gray-200 p-3 rounded-xl bg-white font-bold text-gray-700 text-sm outline-none focus:border-blue-500"
            >
              <option value="hora">Por hora</option>
              <option value="dia">Por día</option>
              <option value="mes">Por mes</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-black text-gray-600 uppercase tracking-wider mb-1 ml-1">Cantidad</label>
            <input
              name="cantidad"
              type="number"
              min="1"
              value={form.cantidad}
              onChange={handleChange}
              className="border border-gray-200 p-3 rounded-xl font-bold text-gray-700 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col col-span-full">
            <label className="text-sm font-black text-gray-600 uppercase tracking-wider mb-1 ml-1">Precio</label>
            <input
              name="precio"
              type="number"
              min="1"
              required // Exigido nativamente por el navegador
              value={form.precio}
              onChange={handleChange}
              className="border border-gray-200 p-3 rounded-xl font-bold text-gray-700 text-sm outline-none focus:border-blue-500"
              placeholder="Ingresá la base estimada"
            />
          </div>
          <div className="flex flex-col col-span-full">
            <label className="text-sm font-black text-gray-600 uppercase tracking-wider mb-1 ml-1">
              Notas / Observaciones (Opcional)
            </label>
            <textarea
              name="notas"
              rows="2"
              value={form.notas}
              onChange={handleChange}
              placeholder="Ej: El auto ingresa con un raspón en la puerta izquierda, dejó llaves..."
              className="border border-gray-200 p-3 rounded-xl font-medium text-gray-700 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* CHECKBOX ABONA AHORA*/}
          <div className="col-span-full flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200/60 mt-1 select-none cursor-pointer" onClick={() => setAbonaAhora(!abonaAhora)}>
            <input
              type="checkbox"
              id="abonaAhora"
              checked={abonaAhora}
              onChange={(e) => setAbonaAhora(e.target.checked)}
              className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
            />
            <div className="flex flex-col">
              <label htmlFor="abonaAhora" className="text-sm font-black text-gray-800 uppercase tracking-wide cursor-pointer pointer-events-none">
                ¿El cliente abona la estadía en este momento?
              </label>
              <span className="text-xs text-gray-400 font-bold">Si se marca, redirigirá directamente al panel de cobros.</span>
            </div>
          </div>
        </div>

        <button
          onClick={registrarEntrada}
          disabled={botonDeshabilitado}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black text-lg transition-all shadow-md shadow-blue-500/10 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
        >
          {loading ? "Procesando..." : abonaAhora ? "Registrar Entrada e Ir a Pagar →" : "Confirmar Registro de Entrada"}
        </button>
      </div>

      {/* COLUMNA LATERAL (RELOJ Y GUÍA) */}
      <div className="space-y-4">
        {/* TARJETA DEL RELOJ EN VIVO */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 text-center border-t-4 border-t-indigo-500">
          <p className="text-gray-400 uppercase text-md font-black tracking-widest">Turno Actual</p>
          <p className="text-4xl font-black text-gray-900 my-1 font-mono tracking-tight">
            {fechaActual.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-gray-400 text-md font-bold uppercase tracking-wider mt-1">
            {fechaActual.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl text-white shadow-xs space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
            <span>📋</span> Guía Rápida
          </h3>
          <ul className="text-md space-y-3.5 text-gray-400 font-medium">
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-sm font-black text-white shrink-0 border border-gray-700">1</span>
              <span>Ingresá la patente del vehículo.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-sm font-black text-white shrink-0 border border-gray-700">2</span>
              <span>Verificá o seleccioná de la lista desplegable.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-sm font-black text-white shrink-0 border border-gray-700">3</span>
              <span>Elegí el tipo de estadía correspondiente.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-sm font-black text-white shrink-0 border border-gray-700">4</span>
              <span>Marcá si paga ahora o dale directo a registrar.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-sm font-black text-white shrink-0 border border-gray-700">4</span>
              <span>Hacé clic en **Confirmar Registro** para guardar.</span>
            </li>
          </ul>
        </div>
      </div>
      {estadiaParaImprimir && (
        <TicketImpresion 
          estadia={estadiaParaImprimir} 
          tipoTicket="TICKET DE INGRESO"
          alTerminarImprimir={() => setEstadiaParaImprimir(null)} 
        />
      )}
    </div>
  );
}

export default Entrada;