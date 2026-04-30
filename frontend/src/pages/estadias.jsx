import { useEffect, useState } from "react";
import api from "../api/axios";

function Estadias() {

  const [estadias, setEstadias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [total, setTotal] = useState(0);
  const [totalActivas, setTotalActivas] = useState(0);


  // 🔄 FETCH
  const fetchEstadias = async () => {
    try {

      let url = `/parking/?search=${busqueda}`;

      if (filtroFecha) {
        url += `&filtro=${filtroFecha}`;
      }

      const res = await api.get(url);
      setEstadias(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  const fetchTotal = async () => {
    try {
      const res = await api.get("/parking/");
      setTotal(res.data.length);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchTotalActivas = async () => {
    try {
        const res = await api.get("/parking/?activa=true");
        setTotalActivas(res.data.length);
    } catch (error) {
        console.error(error);
    }
  };

  useEffect(() => {
    fetchEstadias();
    fetchTotal();
    fetchTotalActivas();
  }, []);

  useEffect(() => {
    fetchEstadias();
  }, [busqueda, filtroFecha]);

  // 🧠 FORMATEAR FECHA
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">Historial de Estadías</h1>

      {/* TOTAL */}
      <div className="flex gap-4">

        <div className="bg-white p-4 rounded shadow w-64">
            <p className="text-sm text-gray-500">Total estadías</p>
            <p className="text-xl font-bold">{total}</p>
        </div>

        <div className="bg-white p-4 rounded shadow w-64">
            <p className="text-sm text-gray-500">Activas</p>
            <p className="text-xl font-bold text-green-600">{totalActivas}</p>
        </div>

      </div>

      {/* FILTROS */}
      <div className="flex gap-2 flex-wrap">

        <button onClick={() => setFiltroFecha("hoy")} className="btn">
          Hoy
        </button>

        <button onClick={() => setFiltroFecha("ayer")} className="btn">
          Ayer
        </button>

        <button onClick={() => setFiltroFecha("7dias")} className="btn">
          7 días
        </button>

        <button onClick={() => setFiltroFecha("mes")} className="btn">
          Mes
        </button>

        <button onClick={() => setFiltroFecha("")} className="btn bg-gray-300">
          Limpiar
        </button>

      </div>

      {/* BUSCADOR */}
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por patente, cliente o DNI"
        className="border p-2 rounded w-full"
      />

      {/* TABLA */}
      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Patente</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Entrada</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Pago</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody>
            {estadias.map((e) => (
              <tr key={e.id} className="border-t">

                <td className="p-2">{e.patente}</td>

                <td className="p-2 text-center">
                  {e.cliente_nombre || e.cliente}
                </td>

                <td className="p-2 text-center">
                  {formatFecha(e.fecha_entrada)}
                </td>

                {/* ESTADO */}
                <td className="p-2 text-center">
                  {e.activa ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Activa
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                      Finalizada
                    </span>
                  )}
                </td>

                {/* PAGO */}
                <td className="p-2 text-center">
                  {e.deuda > 0 ? (
                    <span className="text-red-500 font-semibold">
                      Deuda ${e.deuda}
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      Pagada
                    </span>
                  )}
                </td>

                {/* ACCIONES */}
                <td className="p-2 text-center">
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.get(`/parking/${e.id}/`);
                        setSelected(res.data);
                        setModal("acciones");
                      } catch (error) {
                        alert("Error al cargar la estadía");
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

      {modal === "acciones" && (
        <AccionesModal
          estadia={selected}
          onClose={() => setModal(null)}
          onSelect={(tipo) => setModal(tipo)}
        />
      )}

      {modal === "detalles" && (
        <DetallesModal
          estadia={selected}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "editar" && (
        <EditarModal
          estadia={selected}
          onClose={() => {
            setModal(null);
            fetchEstadias();
          }}
        />
      )}

      {modal === "eliminar" && (
        <EliminarModal
          estadia={selected}
          onClose={() => {
            setModal(null);
            fetchEstadias();
            fetchTotal();
          }}
        />
      )}

    </div>
  );
}

export default Estadias;

function AccionesModal({ estadia, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded shadow space-y-2">

        <button onClick={() => onSelect("detalles")} className="w-full text-left">
          Ver detalles
        </button>

        <button onClick={() => onSelect("editar")} className="w-full text-left">
          Editar
        </button>

        
        <button onClick={() => onSelect("eliminar")} className="w-full text-left text-red-500">
          Eliminar
        </button>
        

        <button onClick={onClose} className="w-full border mt-2">
          Cancelar
        </button>

      </div>
    </div>
  );
}

function DetallesModal({ estadia, onClose }) {

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded shadow w-96 space-y-2">

        <h2 className="font-bold">Detalles de Estadía</h2>

        <p><b>Entrada:</b> {formatFecha(estadia.fecha_entrada)}</p>

        <p><b>Tipo:</b> {estadia.tipo_estadia}</p>
        <p><b>Cantidad:</b> {estadia.cantidad}</p>

        {estadia.activa ? (
          <p><b>Salida estimada:</b> {formatFecha(estadia.fecha_salida_estimada)}</p>
        ) : (
          <p><b>Salida real:</b> {formatFecha(estadia.fecha_salida_real)}</p>
        )}

        <hr />

        <p><b>Cliente:</b> {estadia.cliente}</p>
        <p><b>Patente:</b> {estadia.patente}</p>

        <p>
          <b>{estadia.deuda > 0 ? "Deuda:" : "Pagado:"}</b> ${estadia.deuda}
        </p>

        <button onClick={onClose} className="w-full bg-gray-200 mt-4 py-2">
          Cerrar
        </button>

      </div>

    </div>
  );
}

function EditarModal({ estadia, onClose }) {

  const [form, setForm] = useState({
    tipo_estadia: estadia.tipo_estadia,
    cantidad: estadia.cantidad,
    precio: estadia.precio
  });

  const guardar = async () => {
    try {
      await api.patch(`/parking/${estadia.id}/`, form);
      alert("Actualizado correctamente");
      onClose();
    } catch (error) {
        console.log(error.response?.data);

        alert(
            error.response?.data?.detail ||
            JSON.stringify(error.response?.data) ||
            "Error al actualizar"
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded shadow w-96 space-y-2">

        <h2 className="font-bold">Editar Estadía</h2>

        <select
          value={form.tipo_estadia}
          onChange={(e) => setForm({ ...form, tipo_estadia: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="hora">Hora</option>
          <option value="dia">Día</option>
          <option value="mes">Mes</option>
        </select>

        <input
          type="number"
          value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          type="number"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
          className="border p-2 w-full"
        />

        <button onClick={guardar} className="bg-blue-600 text-white w-full py-2">
          Guardar
        </button>

        <button onClick={onClose} className="border w-full py-2">
          Cancelar
        </button>

      </div>

    </div>
  );
}

function EliminarModal({ estadia, onClose }) {

  const eliminar = async () => {
    try {
      await api.delete(`/parking/${estadia.id}/`);
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || "No se puede eliminar");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded shadow text-center">

        <p>¿Eliminar esta estadía?</p>

        <button onClick={eliminar} className="bg-red-500 text-white px-4 py-2 mr-2">
          Sí
        </button>

        <button onClick={onClose} className="border px-4 py-2">
          Cancelar
        </button>

      </div>

    </div>
  );
}

