import { useEffect, useState } from "react";
import api from "../api/axios";

function ModalPago({ onClose, estadiaInicial, onPagoExitoso }) {

  const [patente, setPatente] = useState("");
  const [estadia, setEstadia] = useState(estadiaInicial || null);

  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");

  const [warnings, setWarnings] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // 🔍 Buscar estadía activa
  const buscarEstadia = async () => {
    try {
      const res = await api.get(`/parking/?activa=true&search=${patente}`);

      if (res.data.length === 0) {
        alert("No hay estadía activa para esa patente");
        setEstadia(null);
        return;
      }

      setEstadia(res.data[0]);

    } catch (error) {
      console.error(error);
    }
  };

  // ⏱ duración
  const calcularDuracion = () => {
    if (!estadia) return "";

    const inicio = new Date(estadia.fecha_entrada);
    const ahora = new Date();

    const diff = Math.floor((ahora - inicio) / 60000);
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;

    return `${horas}h ${minutos}m`;
  };

  // 🧠 VALIDAR
  const validar = async () => {
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
      alert("Error al validar");
    }
  };

  // 💰 CREAR
  const crearPago = async (confirmado = false) => {
    try {
      await api.post("/payments/create/", {
        estadia: estadia.id,
        monto: parseFloat(monto),
        metodo_pago: metodo,
        confirmado: confirmado
      });

      alert("Pago registrado correctamente");

      onPagoExitoso(); // 🔥 refresca tabla
      onClose();

    } catch (error) {
      console.log(error.response?.data);
      alert("Error al registrar pago");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">

      <div className="bg-white w-[500px] rounded shadow p-5 space-y-4">

        <h2 className="text-xl font-bold">Registrar Pago</h2>

        {/* 🔍 BUSCAR (solo si no viene del dashboard) */}
        {!estadiaInicial && (
          <div className="flex gap-2">
            <input
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              placeholder="Buscar patente"
              className="border p-2 w-full"
            />
            <button
              onClick={buscarEstadia}
              className="bg-blue-600 text-white px-4"
            >
              Buscar
            </button>
          </div>
        )}

        {/* 🧾 DATOS */}
        {estadia && (
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
            <p><b>Cliente:</b> {estadia.cliente}</p>
            <p><b>Patente:</b> {estadia.patente}</p>
            <p><b>Entrada:</b> {new Date(estadia.fecha_entrada).toLocaleString()}</p>
            <p><b>Duración:</b> {calcularDuracion()}</p>
            <p className="text-red-600 font-bold">Deuda: ${estadia.deuda}</p>
          </div>
        )}

        {/* 💳 FORM */}
        {estadia && (
          <>
            <input
              type="number"
              placeholder="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="border p-2 w-full"
            />

            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="border p-2 w-full"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>

            <button
              onClick={validar}
              className="bg-green-600 text-white w-full py-2 rounded"
            >
              Registrar pago
            </button>
          </>
        )}

        {/* BOTONES */}
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500">
            Cerrar
          </button>
        </div>

        {/* ⚠️ CONFIRMACION */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

            <div className="bg-white p-5 rounded shadow w-80">
              <h3 className="font-bold mb-2">Confirmar pago</h3>

              {warnings.map((w, i) => (
                <p key={i} className="text-red-500 text-sm">{w}</p>
              ))}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => crearPago(true)}
                  className="bg-green-600 text-white px-3 py-1"
                >
                  Confirmar
                </button>

                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  className="border px-3 py-1"
                >
                  Cancelar
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