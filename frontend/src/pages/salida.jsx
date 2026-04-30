import { useState } from "react";
import api from "../api/axios";


function Salida() {
  
  const formatearFecha = (fecha) => {
    const f = new Date(fecha);
    return f.toLocaleDateString(); // 01/04/2026
  };

  const formatearHora = (fecha) => {
  const f = new Date(fecha);
  return f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };  

  const calcularDuracion = (fechaEntrada) => {
  const inicio = new Date(fechaEntrada);
  const ahora = new Date();

  const diffMs = ahora - inicio;

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${horas}h ${minutos}m`;
  };


  const [patente, setPatente] = useState("");
  const [data, setData] = useState(null);
  const [metodo, setMetodo] = useState("efectivo");
  const [errorMsg, setErrorMsg] = useState("");

   //BUSCAR VEHÍCULO ACTIVO
  const buscar = async () => {
    try {
      setErrorMsg("") 
      const res = await api.get(`/parking/vehiculo-activo/?patente=${patente}`);
      setData(res.data);
    } catch (error) {
      setErrorMsg("Vehículo no encontrado o sin estadía activa");
      setData(null);
    }
  };

  const procesarSalida = async () => {
    try {
      await api.post("/parking/egreso/", {
        vehiculo: data.vehiculo_id,
        precio: data.deuda,
        metodo_pago: metodo
      });

      alert("Salida registrada");

      setData(null);
      setPatente("");

    } catch (error) {
      console.error(error);
      alert("Error al registrar salida");
    }
  };

  
  
    return (
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* 🟦 IZQUIERDA */}
      <div className="md:col-span-2 space-y-4">

        <div className="bg-white p-6 rounded shadow">

          <h2 className="text-xl font-bold mb-4">
            Registrar Salida de Vehículo
          </h2>

          {/* BUSCADOR */}
          <div className="flex gap-2 mb-4">
            <input
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              placeholder="ABC123"
              className="border p-2 rounded w-full"
            />
            
            <button
              onClick={buscar}
              className="bg-gray-200 px-4 rounded"
            >
              Buscar
            </button>
          </div>
          {errorMsg && (
            <p className="text-red-500 text-sm mt-2">
                {errorMsg}
            </p>
           )}

          {/* RESULTADO */}
          {data && (
            <div className="bg-gray-50 p-4 rounded space-y-3">

              <div>
                <h3 className="font-bold text-lg">
                  {data.patente}
                </h3>
                <p className="text-sm text-gray-600">
                  {data.marca} {data.modelo} - {data.color}
                </p>
              </div>

              <div className="flex justify-between text-sm">
                <p>Entrada: {formatearFecha(data.fecha_entrada)} - {formatearHora(data.fecha_entrada)}</p>
                <p>Duración: {calcularDuracion(data.fecha_entrada)}</p>
              </div>

              <hr />

              <div className="flex justify-between items-center">
                <p className="font-semibold">Total a pagar</p>
                <p className="text-xl font-bold">
                  ${data.deuda}
                </p>
              </div>

              {/* MÉTODO */}
              <div>
                <label className="text-sm">Método de pago</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="border p-2 rounded w-full mt-1"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {/* BOTONES */}
              <div className="flex gap-2 mt-4">

                <button
                  onClick={procesarSalida}
                  className="flex-1 bg-blue-600 text-white py-2 rounded"
                >
                  Procesar Pago y Salida
                </button>

                <button
                  onClick={() => setData(null)}
                  className="px-4 border rounded"
                >
                  Cancelar
                </button>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Salida;