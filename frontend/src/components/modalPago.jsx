import { useEffect, useState } from "react";
import api from "../api/axios";

function ModalPago({ onClose, estadiaInicial, onPagoExitoso }) {

  const [patente, setPatente] = useState(estadiaInicial?.vehiculo?.patente || estadiaInicial?.patente || "");
  const [sugerencias, setSugerencias] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [estadia, setEstadia] = useState(estadiaInicial || null);
""
  const [monto, setMonto] = useState(estadiaInicial?.deuda || "");
  const [metodo, setMetodo] = useState("efectivo");

  const [warnings, setWarnings] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [errorMensaje, setErrorMensaje] = useState("");
  const [exitoMensaje, setExitoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  

  // 🔍 Lógica de búsqueda predictiva (Autocomplete)
  useEffect(() => {
    const buscarPredictivo = async () => {
      if (patente && patente.length >= 2 && !estadia) {
        try {
          // Buscamos solo estadías activas
          const res = await api.get(`/parking/?activa=true&search=${patente}`);
          setSugerencias(res.data || []);
          setBusquedaRealizada(true);
        } catch (error) {
          console.error("Error en búsqueda predictiva", error);
          setErrorMensaje("No se pudo conectar con el servidor para buscar patentes.");
          setBusquedaRealizada(true);
        }
      } else {
        setSugerencias([]);
        setBusquedaRealizada(false);
      }
    };

    const timeoutId = setTimeout(buscarPredictivo, 300);
    return () => clearTimeout(timeoutId);
  }, [patente, estadia]);

  const seleccionarEstadia = (e) => {
    setEstadia(e);
    setPatente(e.vehiculo.patente);
    setMonto(e.deuda);
    setSugerencias([]);
    setErrorMensaje("");
  };

  // ⏱ duración
  const calcularDuracion = () => {
    if (!estadia) return "";

    const inicio = new Date(estadia.fecha_entrada);
    const ahora = new Date();

    const diff = Math.floor((ahora - inicio) / 60000);
    const dias = Math.floor(diff / (60 * 24));
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;

    return `${dias}d ${horas % 24}h ${minutos}m`;
  };

  // VALIDAR
  const validar = async () => {
    setErrorMensaje("");
    setCargando(true);
    try {
      const res = await api.post("/payments/validate/", {
        estadia: estadia.id,
        monto: parseFloat(monto)
      });

      if (res.data.requiere_confirmacion) {
        setWarnings(res.data.warnings);
        setMostrarConfirmacion(true);
      } else {
        crearPago(true);
      }

    } catch (error) {
      console.log(error.response?.data);
      const mensajeBackend = error.response?.data?.detail || error.response?.data?.error || "Error al validar el pago.";
      setErrorMensaje(mensajeBackend);
    }finally {
      setCargando(false);
    }
  };

  // 💰 CREAR
  const crearPago = async (confirmado = false) => {
    setErrorMensaje("");
    setCargando(true);
    try {
      await api.post("/payments/create/", {
        estadia: estadia.id,
        monto: parseFloat(monto),
        metodo_pago: metodo,
        confirmado: confirmado
      });

      setExitoMensaje("🎉 ¡Pago registrado con éxito!");
      setMostrarConfirmacion(false);

      setTimeout(() => {
        onPagoExitoso();
        onClose();
      }, 1500);

    } catch (error) {
      console.log(error.response?.data);
      const mensajeBackend = error.response?.data?.detail || error.response?.data?.error || "Error al registrar el pago en el sistema.";
      setErrorMensaje(mensajeBackend);
      setMostrarConfirmacion(false);
    }finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">

      <div className="bg-white w-[500px] rounded shadow p-5 space-y-4">

        <h2 className="text-xl font-bold">Registrar Pago</h2>

        {/* 🔍 BUSCADOR PREDICTIVO */}
        {!estadiaInicial && !estadia && (
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Buscar Vehículo</label>
            <input
              value={patente || ""}
              onChange={(e) => {
                setPatente(e.target.value.toUpperCase());
                if (estadia) setEstadia(null);
              }}
              placeholder="Escribe la patente (mín. 2 letras)"
              className="border-2 p-3 w-full rounded-xl text-lg font-bold focus:border-blue-500 outline-none transition-all"
              autoFocus
            />
            
            {/* Lista de sugerencias */}
            {sugerencias.length > 0 && (
              <div className="absolute z-10 w-full bg-white border-2 border-t-0 rounded-b-xl shadow-xl max-h-48 overflow-y-auto">
                {sugerencias.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => seleccionarEstadia(e)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-lg">{e.patente}</span>
                      <p className="text-xs text-gray-500">Cliente: {e.cliente}</p>
                    </div>
                    <span className="text-blue-600 font-bold text-xs">SELECCIONAR →</span>
                  </div>
                ))}
              </div>
            )}

            {patente.length >= 2 && busquedaRealizada && sugerencias.length === 0 && (
              <div className="absolute z-10 w-full bg-red-50 border-2 border-red-200 border-t-0 rounded-b-xl p-4 shadow-xl text-center">
                <p className="text-red-700 font-bold text-sm">
                  ⚠️ No se encontraron autos activos con la patente <span className="underline">{patente}</span>
                </p>
              </div>
            )}
          </div>
        )}



        {/* DATOS DEL VEHÍCULO SELECCIONADO */}
        {estadia && (
          <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 relative">
            {!estadiaInicial && (
              <button 
                onClick={() => setEstadia(null)} 
                className="absolute top-2 right-3 text-blue-400 hover:text-blue-600 text-xs font-bold"
              >
                CAMBIAR
              </button>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><b className="text-blue-800">Patente:</b> <span className="text-lg font-black">{estadia.vehiculo?.patente || estadia.patente}</span></p>
              <p><b className="text-blue-800">Duración:</b> {calcularDuracion()}</p>
              <p className="col-span-2 border-t pt-2 mt-1">
                <b className="text-blue-800">Deuda actual:</b> 
                <span className="ml-2 text-xl font-black text-red-600">${estadia.deuda}</span>
              </p>
            </div>
          </div>
        )}


        {/* 💳 FORMULARIO DE PAGO */}
        {estadia && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Monto a pagar</label>
              <input
                
                placeholder="0.00"
                value={monto || ""}
                onChange={(e) => setMonto(e.target.value)}
                className="border-2 p-3 w-full rounded-xl text-2xl font-black text-green-700 focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Medio de Pago</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="border-2 p-3 w-full rounded-xl text-lg font-bold bg-white"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">📱 Transferencia</option>
                <option value="tarjeta">💳 Tarjeta</option>
              </select>
            </div>

            <button
              onClick={validar}
              disabled={!monto || monto <= 0}
              className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all ${
                !monto || monto <= 0 ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              }`}
            >
              REGISTRAR PAGO
            </button>
          </div>
        )}

        {/* BOTONES */}
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500">
            Cerrar
          </button>
        </div>

        {/* ⚠️ MODAL DE CONFIRMACIÓN (WARNINGS) */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs text-center">
              <div className="text-yellow-500 text-5xl mb-2">⚠️</div>
              <h3 className="font-black text-xl mb-2 text-gray-800">¡Atención!</h3>
              {warnings.map((w, i) => (
                <p key={i} className="text-gray-600 font-medium mb-1 italic">"{w}"</p>
              ))}
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={() => crearPago(true)}
                  className="bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700"
                >
                  Sí, registrar igual
                </button>
                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  className="text-gray-500 font-bold py-2"
                >
                  No, corregir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ModalPago;