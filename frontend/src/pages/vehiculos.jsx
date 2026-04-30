import { useEffect, useState } from "react";
import api from "../api/axios";

function Vehiculos() {

  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

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

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <button
          onClick={() => setModal("crear")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Nuevo Vehículo
        </button>

      </div>
      <div className="bg-white p-4 rounded shadow w-64">
        <p className="text-sm text-gray-500">Total vehículos</p>
        <p className="text-xl font-bold">{total}</p>
     </div>

      {/* BUSCADOR */}
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por patente o cliente"
        className="border p-2 rounded w-full"
      />

      {/* TABLA */}
      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Patente</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Estado</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody>
            {vehiculos.map((v) => (
              <tr key={v.id} className="border-t">

                <td className="p-2">{v.patente}</td>

                <td className="p-2 text-center">
                  {v.cliente}
                </td>

                <td className="p-2 text-center">
                  {v.telefono || "—"}
                </td>

                <td className="p-2 text-center">
                  {v.tipo || "—"}
                </td>

                <td className="p-2 text-center">
                    {v.estacionado ? (
                        <span className="text-green-600 font-semibold">
                        Estacionado
                        </span>
                    ) : (
                        <span className="text-gray-400">
                        Libre
                        </span>
                    )}
                </td>

                <td className="p-2 text-center">
                  <button
                    onClick={async () => {
                        try {
                            const res = await api.get(`/vehicles/${v.id}/`);
                            setSelected(res.data); 
                            setModal("acciones");
                        } catch (error) {
                            console.error(error);
                            alert("Error al cargar el vehículo");
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
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            fetchVehiculos();
            fetchTotal();
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
            onClose={() => {
            setModal(null);
            fetchVehiculos();
            }}
        />
      )}

      {modal === "eliminar" && (
        <EliminarVehiculoModal
            vehiculo={selected}
            onClose={() => {
            setModal(null);
            fetchVehiculos();
            fetchTotal();
            }}
        />
      )}
      

    </div>
  );
}

export default Vehiculos;

function CrearVehiculoModal({ onClose, onSuccess }) {

  const [form, setForm] = useState({
    patente: "",
    marca: "",
    modelo: "",
    color: "",
    tipo: "",
    cliente: ""
  });

  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});

  useEffect(() => {
    api.get("/clients/").then(res => setClientes(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardar = async () => {
    const errs = validar();
    if (Object.keys(errs).length > 0) {
        setErrores(errs);
        return;
    }
    try {
      await api.post("/vehicles/create/", form);
      alert("Vehículo registrado correctamente ✅");
      onSuccess();
    } catch (err) {
      setError("Error al crear vehículo");
    }
  };

  const validar = () => {
    let errs = {};

    if (!form.patente) {
        errs.patente = "La patente es obligatoria";
    } else if (!/^[A-Za-z0-9]{6,10}$/.test(form.patente)) {
        errs.patente = "Patente inválida (solo letras y números)";
    }

    if (!form.cliente) {
        errs.cliente = "Debe seleccionar un cliente";
    }

    return errs;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-96 space-y-3">

        <h2 className="text-xl font-bold">Nuevo Vehículo</h2>

        <input
          name="patente"
          value={form.patente}
          onChange={handleChange}
          placeholder="Patente"
          className="border p-2 w-full"
        />
        {errores.patente && <p className="text-red-500 text-sm">{errores.patente}</p>}
        <input
          name="marca"
          value={form.marca}
          onChange={handleChange}
          placeholder="Marca"
          className="border p-2 w-full"
        />

        <input
          name="modelo"
          value={form.modelo}
          onChange={handleChange}
          placeholder="Modelo"
          className="border p-2 w-full"
        />

        <input
          name="color"
          value={form.color}
          onChange={handleChange}
          placeholder="Color"
          className="border p-2 w-full"
        />

        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="border p-2 w-full"
          >
          <option value="">Seleccionar tipo</option>
          <option value="auto">Auto</option>
          <option value="moto">Moto</option>
        </select>

        <select
          name="cliente"
          value={form.cliente}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">Seleccionar cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} - DNI: {c.DNI}
            </option>
          ))}
        </select>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={guardar}
            className="bg-blue-600 text-white w-full py-2 rounded"
          >
            Guardar
          </button>

          <button
            onClick={onClose}
            className="border w-full py-2 rounded"
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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-4 rounded shadow w-64 space-y-2">

        <button onClick={() => onSelect("detalles")} className="w-full text-left">
          Ver detalles
        </button>

        <button onClick={() => onSelect("editar")} className="w-full text-left">
          Editar
        </button>

        <button onClick={() => onSelect("eliminar")} className="w-full text-left text-red-500">
          Eliminar
        </button>

        <button onClick={onClose} className="w-full border rounded mt-2">
          Cancelar
        </button>

      </div>

    </div>
  );
}

function DetallesVehiculoModal({ vehiculo, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="font-bold mb-4">Detalles</h2>

        <p><b>Patente:</b> {vehiculo.patente}</p>
        <p><b>Marca:</b> {vehiculo.marca}</p>
        <p><b>Modelo:</b> {vehiculo.modelo}</p>
        <p><b>Color:</b> {vehiculo.color}</p>
        <p><b>Tipo:</b> {vehiculo.tipo}</p>
        <p><b>Cliente:</b> {vehiculo.cliente_nombre}</p>

        <button onClick={onClose} className="mt-4 w-full bg-gray-200 py-2 rounded">
          Cerrar
        </button>
      </div>

    </div>
  );
}

function EditarVehiculoModal({ vehiculo, onClose }) {

  const [form, setForm] = useState(vehiculo);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardar = async () => {
    try {
      await api.put(`/vehicles/${vehiculo.id}/`, form);
      onClose();
    } catch (error) {
      alert("Error al editar");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-96 space-y-2">

        <h2 className="font-bold">Editar Vehículo</h2>

        <input name="patente" value={form.patente} onChange={handleChange} className="border p-2 w-full" placeholder="Patente" />
        <input name="marca" value={form.marca} onChange={handleChange} className="border p-2 w-full" placeholder="Marca" />
        <input name="modelo" value={form.modelo} onChange={handleChange} className="border p-2 w-full" placeholder="Modelo" />
        <input name="color" value={form.color} onChange={handleChange} className="border p-2 w-full" placeholder="Color" />
        <input name="tipo" value={form.tipo} onChange={handleChange} className="border p-2 w-full" placeholder="Tipo" />

        <button onClick={guardar} className="bg-blue-600 text-white w-full py-2 rounded">
          Guardar
        </button>

        <button onClick={onClose} className="w-full border py-2 rounded">
          Cancelar
        </button>

      </div>

    </div>
  );
}

function EliminarVehiculoModal({ vehiculo, onClose }) {

  const eliminar = async () => {
    try {
      await api.delete(`/vehicles/${vehiculo.id}/`);
      onClose();
    } catch (error) {
        const msg =
            error.response?.data?.error ||
            "No se pudo eliminar el vehículo";

        alert(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-80 text-center">

        <p>¿Eliminar vehículo {vehiculo.patente}?</p>

        <button onClick={eliminar} className="bg-red-500 text-white px-4 py-2 rounded mr-2">
          Sí
        </button>

        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancelar
        </button>

      </div>

    </div>
  );
}


