import { useEffect, useState } from "react";
import api from "../api/axios";

function Clientes() {

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // detalles | editar | eliminar
  const [totalClientes, setTotalClientes] = useState(0);

  

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

  useEffect(() => {
    fetchClientes();
    fetchTotalClientes();
  }, [busqueda]);

  return (
    <div className="grid grid-cols-1  gap-6">

      {/* 🟦 IZQUIERDA */}
      <div className="space-y-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clientes</h1>

          <button
            onClick={() => setModal("crear")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            >
            + Nuevo Cliente
          </button>
        </div>

        {/* TOTAL */}
        <div className="bg-white p-4 rounded shadow inline-block ">
          <p className="text-sm text-gray-500">Total de clientes</p>
          <p className="text-xl font-bold">{totalClientes}</p>
        </div>

        {/* BUSCADOR */}
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido o DNI"
          className="border p-2 rounded w-full"
        />

        {/* TABLA */}
        <div className="bg-white rounded shadow overflow-hidden">

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2">Teléfono</th>
                <th className="p-2">Email</th>
                <th className="p-2">Vehículos</th>
                <th className="p-2">Registro</th>
                <th className="p-2"></th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t">

                  <td className="p-2">
                    {c.nombre} {c.apellido}
                  </td>

                  <td className="p-2 text-center">{c.telefono}</td>
                  <td className="p-2 text-center">{c.email}</td>
                  <td className="p-2 text-center">{c.vehiculos ?? 0}</td>

                  <td className="p-2 text-center">
                    {new Date(c.fecha_registro).toLocaleDateString()}
                  </td>

                  <td className="p-2 text-center">
                    <button
                      onClick={() => {
                        setSelected(c);
                        setModal("acciones");
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

      </div>


      {/* MODALES */}
      {modal === "acciones" && (
        <AccionesModal
          cliente={selected}
          onClose={() => setModal(null)}
          onSelect={(tipo) => setModal(tipo)}
        />
      )}

      {modal === "detalles" && (
        <DetallesModal cliente={selected} onClose={() => setModal(null)} />
      )}

      {modal === "editar" && (
        <EditarModal
          cliente={selected}
          onClose={() => {
            setModal(null);
            fetchClientes();
          }}
        />
      )}

      {modal === "eliminar" && (
        <EliminarModal
          cliente={selected}
          onClose={() => {
            setModal(null);
            fetchClientes();
          }}
        />
      )}

      {modal === "crear" && (
        <CrearClienteModal
            onClose={() => setModal(null)}
            onSuccess={() => {
            setModal(null);
            fetchClientes();
            fetchTotalClientes();
            }}
        />
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
      alert("No se pudo generar la ficha.");
    }
  };

function AccionesModal({ cliente, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">

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
        <button 
                onClick={() => imprimirFichaCliente(cliente.id)}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-200 transition">
          🖨️ Imprimir Ficha
        </button>

        <button onClick={onClose} className="w-full mt-2 border rounded">
          Cancelar
        </button>

      </div>

    </div>
  );
}

function DetallesModal({ cliente, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="font-bold mb-4">Detalles</h2>

        <p><b>Nombre:</b> {cliente.nombre} {cliente.apellido}</p>
        <p><b>DNI:</b> {cliente.DNI || "—"}</p>
        <p><b>Teléfono:</b> {cliente.telefono}</p>
        <p><b>Email:</b> {cliente.email}</p>

        <button onClick={onClose} className="mt-4 w-full bg-gray-200 py-2 rounded">
          Cerrar
        </button>
      </div>

    </div>
  );
}

function EditarModal({ cliente, onClose }) {

  const [form, setForm] = useState(cliente);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardar = async () => {
    try {
      await api.put(`/clients/${cliente.id}/`, form);
      onClose();
    } catch (error) {
      alert("Error al editar");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-96 space-y-2">

        <h2 className="font-bold">Editar Cliente</h2>

        <input name="nombre" value={form.nombre} onChange={handleChange} className="border p-2 w-full" placeholder="Nombre" />
        <input name="apellido" value={form.apellido} onChange={handleChange} className="border p-2 w-full" placeholder="Apellido" />
        <input name="dni" value={form.DNI || ""} onChange={handleChange} className="border p-2 w-full" placeholder="DNI" />
        <input name="telefono" value={form.telefono} onChange={handleChange} className="border p-2 w-full" placeholder="Teléfono" />
        <input name="email" value={form.email} onChange={handleChange} className="border p-2 w-full" placeholder="Email" />

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

function EliminarModal({ cliente, onClose }) {

  const eliminar = async () => {
    try {
      await api.delete(`/clients/${cliente.id}/`);
      onClose();
    } catch (error) {
      alert("No se puede eliminar");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-80 text-center">

        <p className="mb-4">
          ¿Seguro que querés eliminar a {cliente.nombre}?
        </p>

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

function CrearClienteModal({ onClose, onSuccess }) {

  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    email: ""
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
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

    const errs = validar();
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }

    try {
      setLoading(true);

      await api.post("/clients/create/", form);

      onSuccess();

    } catch (error) {

      console.error(error);

      // errores del backend
      if (error.response?.data) {
        setErrores(error.response.data);
      } else {
        alert("Error al crear cliente");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-6 rounded shadow w-96 space-y-3">

        <h2 className="text-xl font-bold">Nuevo Cliente</h2>

        {/* NOMBRE */}
        <div>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            className="border p-2 w-full"
          />
          {errores.nombre && (
            <p className="text-red-500 text-sm">{errores.nombre}</p>
          )}
        </div>

        {/* DNI */}
        <div>
          <input
            name="dni"
            value={form.dni}
            onChange={handleChange}
            placeholder="DNI"
            className="border p-2 w-full"
          />
          {errores.dni && (
            <p className="text-red-500 text-sm">{errores.dni}</p>
          )}
        </div>

        {/* TELÉFONO */}
        <div>
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
            className="border p-2 w-full"
          />
          {errores.telefono && (
            <p className="text-red-500 text-sm">{errores.telefono}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email (opcional)"
            className="border p-2 w-full"
          />
          {errores.email && (
            <p className="text-red-500 text-sm">{errores.email}</p>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex gap-2 pt-2">

          <button
            onClick={guardar}
            disabled={loading}
            className="bg-blue-600 text-white w-full py-2 rounded"
          >
            {loading ? "Guardando..." : "Guardar"}
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
