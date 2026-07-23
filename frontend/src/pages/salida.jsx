import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import api from "../api/axios";
import TicketImpresion from "../components/TicketImpresion";


function Salida() {

  const location = useLocation();

  const [patente, setPatente] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [data, setData] = useState(null);
  const [metodo, setMetodo] = useState("efectivo");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [estadiaParaImprimir, setEstadiaParaImprimir] = useState(null);

  

  // 🕒 Reloj en tiempo real
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    const estadiaPrecargada = location.state?.estadia;
    if (estadiaPrecargada) {
      // Mapeamos el objeto para asegurar que cumpla con lo que espera el botón de egreso: data.vehiculo_id
      // Como tu JSON del dashboard devuelve "vehiculo": 21, se lo asignamos a vehiculo_id
      const vehiculoAdaptado = {
        ...estadiaPrecargada,
        vehiculo_id: estadiaPrecargada.vehiculo_id || estadiaPrecargada.vehiculo
      };

      setData(vehiculoAdaptado);
      setPatente(vehiculoAdaptado.patente);
      setSugerencias([]);
      setErrorMsg("");
    }
  }, [location.state]);

  
  useEffect(() => {
    const timerReloj = setInterval(() => {
      setFechaActual(new Date());
    }, 1000);
    return () => clearInterval(timerReloj);
  }, []);
  
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }; 

  const calcularDuracion = (fechaEntrada) => {
  const inicio = new Date(fechaEntrada);
  const ahora = new Date();

  const diffMs = ahora - inicio;

  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${dias}d ${horas}h ${minutos}m`;
  };


  // 🔍 BUSCADOR PREDICTIVO AUTOMÁTICO (Debounce de 300ms)
  useEffect(() => {
    const buscarSugerencias = async () => {
      const patenteLimpia = patente.trim();

      // Si tiene menos de 2 caracteres o ya seleccionamos un auto, limpiamos todo y salimos
      if (patenteLimpia.length < 2 || data) {
        setSugerencias([]);
        setErrorMsg(""); // Limpia el error si el usuario borró o dejó 1 letra
        return;
      }

      try {
        const res = await api.get(`/parking/vehiculo-activo/?patente=${patenteLimpia.toUpperCase()}`);

        if (res.data.sugerencias && res.data.sugerencias.length > 0) {
          setSugerencias(res.data.sugerencias);
          setErrorMsg(""); // Encontró coincidencias, removemos cualquier cartel de error
        } else {
          // ❌ El backend devolvió un 200 pero con el array vacío (no hubo coincidencias)
          setSugerencias([]);
          setErrorMsg(`No se encontró una patente que comience con "${patenteLimpia.toUpperCase()}" con una estadía activa.`);
        }
      } catch (error) {
        // Fallo de red o del servidor
        setSugerencias([]);
        setErrorMsg("Ocurrió un error al intentar consultar el servidor.");
      }
    };

    const timer = setTimeout(buscarSugerencias, 300);
    return () => clearTimeout(timer);
  }, [patente, data]);


  const handleChangePatente = (e) => {
    setPatente(e.target.value.toUpperCase());
    setErrorMsg("");
    setData(null); // Al escribir de nuevo, limpiamos el panel de cobro activo
  };

  const seleccionarSugerencia = (vehiculoActivo) => {
    setData(vehiculoActivo);
    setPatente(vehiculoActivo.patente);
    setSugerencias([]);
    setErrorMsg("");
  };

  const procesarSalida = async () => {
    if (!data) return;

    setLoading(true);
    try {

      let tipoEstadia = "Estadía";
      let cantidad = 1;
      let marcaVehiculo = data.marca || "";
      let modeloVehiculo = data.modelo || "";
      let colorVehiculo = data.color || "";
      let tipoVehiculo = data.tipo || data.tipo_vehiculo || "Auto";
      let notasEstadia = data.notas || "";

      try {
        const resEstadia = await api.get(`/parking/?activa=true&search=${data.patente}`);
        // Si la API devuelve un array y encuentra la estadía activa:
        if (resEstadia.data && resEstadia.data.length > 0) {
          const estadiaActiva = resEstadia.data[0];
          tipoEstadia = estadiaActiva.tipo_estadia || "Estadía";
          cantidad = estadiaActiva.cantidad || 1;

        }
      } catch (errCtrl) {
        console.error("No se pudieron recuperar detalles de la estadía para el ticket", errCtrl);
        // No bloqueamos el flujo, si falla cae en los valores por defecto
      }

      if (!marcaVehiculo && data.vehiculo_id) {
        try {
          const resVehiculo = await api.get(`vehicles/${data.vehiculo_id}/`);
          if (resVehiculo.data) {
            marcaVehiculo = resVehiculo.data.marca || "";
            modeloVehiculo = resVehiculo.data.modelo || "";
            colorVehiculo = resVehiculo.data.color || "";
            tipoVehiculo = resVehiculo.data.tipo_vehiculo || resVehiculo.data.tipo || "Auto";
          }
        } catch (errVehiculo) {
          console.error("No se pudo recuperar el detalle del vehículo por ID", errVehiculo);
        }
      }
      await api.post("/parking/egreso/", {
        vehiculo: data.vehiculo_id,
        precio: data.deuda,
        metodo_pago: metodo
      });

      setSuccessMsg(`¡Salida registrada con éxito para la patente ${data.patente}!`);
      
      setEstadiaParaImprimir({
        id: data.id || data.estadia?.id,
        patente: data.patente,
        tipo_vehiculo: tipoVehiculo,
        marca: marcaVehiculo,
        modelo: modeloVehiculo,
        color: colorVehiculo,
        tipo_estadia: tipoEstadia,
        cantidad: cantidad,
        fecha_entrada: data.fecha_entrada,
        fecha_salida_real: new Date(), // Saliendo ahora
        deuda: 0, 
        precio: data.deuda > 0 ? data.deuda : data.precio,
        notas: notasEstadia
      });

      // Resetear estados del formulario
      setData(null);
      setPatente("");
      setMetodo("efectivo");

      // Ocultar mensaje automáticamente
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (error) {
      setErrorMsg("Error al registrar la salida en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  
  
  return (
    
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 🟦 COLUMNA PRINCIPAL: FORMULARIO */}
      <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-6">
        
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Registrar Salida de Vehículo
          </h2>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            Procesá el egreso y cobro de vehículos con estadías activas.
          </p>
        </div>

        {/* Notificación de éxito integrada */}
        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-r-xl shadow-2xs flex justify-between items-center font-bold text-sm">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="font-black text-lg hover:text-emerald-950">×</button>
          </div>
        )}

        <div className="relative">
          <input
            value={patente}
            onChange={handleChangePatente}
            autoComplete="off"
            placeholder="Ej: ABC 123 o AF 123 BK"
            className="border border-gray-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase font-mono tracking-wider font-bold"
          />

          {/* LISTA DESPLEGABLE DE SUGERENCIAS */}
          {sugerencias.length > 0 && !data && (
            <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {sugerencias.map((s, idx) => (
                <li
                  key={s.vehiculo_id || idx}
                  onClick={() => seleccionarSugerencia(s)}
                  className="p-3 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-none"
                >
                  <div>
                    <span className="font-black text-sm bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded text-gray-900 tracking-wide">
                      {s.patente}
                    </span>
                    <span className="ml-3 text-gray-400 font-bold text-xs uppercase">
                      {s.marca} {s.modelo}
                    </span>
                  </div>
                  <span className="text-blue-600 text-xs font-black uppercase tracking-wider">Seleccionar →</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-100 font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* DETALLE DE COBRO O ESTADÍA PAGADA */}
        {data && (
          <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-xl space-y-4">
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 font-black uppercase tracking-wider">Vehículo Seleccionado</p>
                <h3 className="text-lg font-black text-gray-900 tracking-wide uppercase">
                  {data.patente}
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase">
                  {data.marca} {data.modelo} {data.color && `• ${data.color}`}
                </p>
              </div>
              <span className="text-2xl bg-white w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200/50 shadow-2xs">
                {data.deuda === 0 ? "✅" : "💵"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-gray-200/40 text-md font-bold text-gray-600">
              <div>
                <p className="text-gray-600 text-sm uppercase font-black tracking-wider mb-0.5">Ingreso</p>
                <p className="text-gray-800">{formatearFecha(data.fecha_entrada)} — {formatearHora(data.fecha_entrada)} hs</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm uppercase font-black tracking-wider mb-0.5">Tiempo Transcurrido</p>
                <p className="text-indigo-600 font-black">{calcularDuracion(data.fecha_entrada)}</p>
              </div>
            </div>
            {/* NOTAS / OBSERVACIONES DE LA ESTADÍA */}
            {data.notas && (
              <div className="bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-xl space-y-1">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <span>📌</span> Notas / Observaciones:
                </span>
                <p className="text-sm font-semibold text-amber-950 whitespace-pre-wrap">
                  {data.notas}
                </p>
              </div>
            )}

            {/* CONDICIONAL SEGÚN SI YA ESTÁ PAGO O TIENE DEUDA */}
            {data.deuda === 0 && data.info_pago ? (
              /* 🟢 VISTA SI YA FUE PAGADO PREVIAMENTE */
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <p className="text-md font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>✔</span> ESTADÍA ABONADA
                </p>
                <div className="text-lg font-bold text-emerald-700 space-y-1">
                  <p>• Monto registrado: <span className="font-mono font-black text-xl text-emerald-900">${data.info_pago.monto}</span></p>
                  <p>• Método utilizado: <span className="uppercase text-emerald-900">{data.info_pago.metodo_pago}</span></p>
                  <p>• Fecha Pago: <span>{new Date(data.info_pago.fecha_pago).toLocaleString("es-AR")} hs</span></p>
                </div>
              </div>
            ) : (
              /* 🔴 VISTA TRADICIONAL SI TIENE DEUDA ACTIVA */
              <>
                <div className="flex justify-between items-center bg-blue-50/40 border border-blue-100/50 p-4 rounded-xl">
                  <p className="text-sm font-black text-blue-900 uppercase tracking-wide">Total a Liquidar</p>
                  <p className="text-2xl font-black text-blue-600 font-mono">${data.deuda}</p>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-black text-gray-600 uppercase tracking-wider mb-1 ml-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value)}
                    className="border border-gray-200 p-3 rounded-xl bg-white font-bold text-gray-700 text-md outline-none focus:border-blue-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                    <option value="transferencia">Transferencia / Cuenta Digital</option>
                  </select>
                </div>
              </>
            )}

            {/* ACCIONES DE SALIDA */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={procesarSalida}
                disabled={loading}
                className={`flex-1 py-3.5 rounded-xl font-black text-lg transition-all shadow-md ${
                  data.deuda === 0 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10" 
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                }`}
              >
                {loading 
                  ? "Procesando..." 
                  : data.deuda === 0 
                    ? "Confirmar Salida" 
                    : "Confirmar Pago y Egreso"
                }
              </button>
              
              <button
                onClick={() => { setData(null); setPatente(""); }}
                className="px-5 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-xl text-lg font-black transition-colors bg-white"
              >
                Cancelar
              </button>
            </div>

          </div>
        )}

      </div>

      {/* 🕒 COLUMNA LATERAL: RELOJ Y GUÍA */}
      <div className="space-y-4">
        
        {/* TARJETA DEL RELOJ IN-LIVE */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 text-center border-t-4 border-t-blue-500">
          <p className="text-gray-400 uppercase text-md font-black tracking-widest">Hora Salida</p>
          <p className="text-[35px] font-black text-gray-900 my-1 font-mono tracking-tight">
            {fechaActual.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-gray-400 text-md font-bold uppercase tracking-wider mt-1">
            {fechaActual.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* GUÍA RÁPIDA */}
        <div className="bg-gray-900 p-6 rounded-2xl text-white shadow-xs space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
            <span>📋</span> Guía de Egreso
          </h3>
          <ul className="text-md space-y-3.5 text-gray-400 font-medium">
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-[15px] font-black text-white shrink-0 border border-gray-700">1</span>
              <span>Escribí la patente para filtrar los vehículos en el predio.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-[15px] font-black text-white shrink-0 border border-gray-700">2</span>
              <span>Hacé clic sobre la sugerencia para cargar la liquidación.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-[15px] font-black text-white shrink-0 border border-gray-700">3</span>
              <span>Corroborá el tiempo transcurrido y la deuda calculada.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center text-[15px] font-black text-white shrink-0 border border-gray-700">4</span>
              <span>Definí la forma de pago y presioná **Confirmar Pago**.</span>
            </li>
          </ul>
        </div>

      </div>
      {estadiaParaImprimir && (
        <TicketImpresion 
          estadia={estadiaParaImprimir} 
          tipoTicket="SALIDA"
          alTerminarImprimir={() => setEstadiaParaImprimir(null)} 
        />
      )}

    </div>
  );
}

export default Salida;