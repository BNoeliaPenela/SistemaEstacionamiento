import { useState } from "react";
import api from "../api/axios";

function Entrada() {

  const [patente, setPatente] = useState("");
  const [vehiculo, setVehiculo] = useState(null);
  const [noExiste, setNoExiste] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // Nuevo: Mensaje de éxito
  const [loading, setLoading] = useState(false); // Nuevo: Estado de carga

  const [form, setForm] = useState({
    tipo_estadia: "hora",
    cantidad: 1,
    precio: ""
  });

  // BUSCAR VEHÍCULO
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

      const res = await api.get(`/vehicles/search/?patente=${patente.toUpperCase()}`);

      if (res.data.exists) {
        setVehiculo(res.data.vehicle);
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
    // Si el usuario cambia la patente, limpiamos estados previos
    if (e.target.name === "patente") {
        setPatente(e.target.value.toUpperCase());
        setErrorMsg("");
        setNoExiste(false);
        setVehiculo(null);
    } else {
        setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  // REGISTRAR ENTRADA
  const registrarEntrada = async () => {
    // Validaciones antes de llamar a la API
    if (!vehiculo) {
      setErrorMsg("Primero debe buscar y seleccionar un vehículo registrado.");
      return;
    }
    if (form.cantidad <= 0) {
      setErrorMsg("La cantidad debe ser al menos 1.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/parking/entrada/", {
        vehiculo: vehiculo.id,
        tipo_estadia: form.tipo_estadia,
        cantidad: Number(form.cantidad),
        precio: form.precio ? Number(form.precio) : null
      });

      // Feedback de éxito
      setSuccessMsg(`¡Entrada registrada con éxito para la patente ${vehiculo.patente}!`);
      
      // Reset total del formulario
      setVehiculo(null);
      setPatente("");
      setForm({ tipo_estadia: "hora", cantidad: 1, precio: "" });
      
      // Quitar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMsg(""), 5000);

    } catch (error) {
      const serverMsg = error.response?.data?.error || "Error al procesar la entrada.";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
          Registrar Entrada de Vehículo
        </h2>

        {/* MENSAJE DE ÉXITO */}
        {successMsg && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-sm flex justify-between items-center animate-fade-in">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="font-bold">×</button>
          </div>
        )}

        {/* BUSCADOR */}
        <div className="flex gap-2 mb-4">
          <input
            value={patente}
            name="patente"
            onChange={handleChange}
            placeholder="Ej: ABC 123 o AF 123 BK"
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
          />
          <button
            onClick={buscarVehiculo}
            disabled={loading}
            className="bg-gray-800 text-white px-6 rounded-lg hover:bg-black transition-colors disabled:bg-gray-400"
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>

        {/* MENSAJES DE ERROR */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* VEHÍCULO ENCONTRADO */}
        {vehiculo && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex justify-between items-center">
            <div>
              <p className="text-xs text-blue-500 font-bold uppercase">Vehículo Identificado</p>
              <p className="text-lg font-bold text-blue-900">{vehiculo.patente}</p>
              <p className="text-blue-700">{vehiculo.marca} {vehiculo.modelo}</p>
            </div>
            <span className="text-3xl">🚗</span>
          </div>
        )}

        {/* VEHÍCULO NO EXISTE */}
        {noExiste && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
            <p className="text-orange-700 font-medium mb-3">
              Esta patente no figura en la base de datos de Garage.
            </p>
            <button
              onClick={() => window.location.href = "/vehiculos"}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm"
            >
              + Registrar Vehículo Nuevo
            </button>
          </div>
        )}

        {/* FORMULARIO DE ESTADÍA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-xl">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1 ml-1">Tipo de Estadía</label>
            <select
              name="tipo_estadia"
              value={form.tipo_estadia}
              onChange={handleChange}
              className="border p-3 rounded-lg bg-white"
            >
              <option value="hora">Por hora</option>
              <option value="dia">Por día</option>
              <option value="mes">Por mes</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1 ml-1">Cantidad</label>
            <input
              name="cantidad"
              type="number"
              min="1"
              value={form.cantidad}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="flex flex-col col-span-full">
            <label className="text-xs font-bold text-gray-500 mb-1 ml-1">Precio</label>
            <input
              name="precio"
              type="number"
              value={form.precio}
              onChange={handleChange}
              className="border p-3 rounded-lg"
              placeholder="Dejar vacío para usar precio base"
            />
          </div>
        </div>

        <button
          onClick={registrarEntrada}
          disabled={loading || !vehiculo}
          className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all shadow-lg shadow-blue-100 disabled:shadow-none"
        >
          {loading ? "Procesando..." : "Confirmar Registro de Entrada"}
        </button>
      </div>

      {/* DERECHA (INFO ADICIONAL) */}
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 uppercase text-xs font-black tracking-widest">Turno Actual</p>
          <p className="text-3xl font-bold text-gray-800 my-1">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-gray-500 text-sm">{new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl text-white">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>📋</span> Guía Rápida
          </h3>
          <ul className="text-sm space-y-3 text-gray-300">
            <li className="flex gap-2">
              <span className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white">1</span>
              Ingresá la patente del vehículo.
            </li>
            <li className="flex gap-2">
              <span className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white">2</span>
              Verificá que los datos del auto sean correctos.
            </li>
            <li className="flex gap-2">
              <span className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white">3</span>
              Elegí el tiempo de estadía.
            </li>
            <li className="flex gap-2">
              <span className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white">4</span>
              Hacé clic en confirmar entrada.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Entrada;