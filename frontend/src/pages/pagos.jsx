import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ModalPago from "../components/modalPago";
import { useLocation } from "react-router-dom";

function Pagos() {

  const location = useLocation();
  const estadiaPre = location.state?.estadia;

  const [mostrarModal, setMostrarModal] = useState(false);
  const [estadiaSeleccionada, setEstadiaSeleccionada] = useState(null);
  
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const [totalHoy, setTotalHoy] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [cantidad, setCantidad] = useState(0);

  const navigate = useNavigate();

  const handleReverso = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas reversar este pago?")) return;
    
    try {
      await api.post(`/payments/${id}/reversar/`); // Ajustá la URL según tus urls.py
      fetchPagos();
      fetchMetrics();
    } catch (error) {
      alert(error.response?.data?.error || "Error al reversar");
    }
  };

  //  FETCH PAGOS
  const fetchPagos = async () => {
    try {

      let url = `/payments/?search=${busqueda}`;

      if (filtroFecha) {
        url += `&filtro=${filtroFecha}`;
      }

      const res = await api.get(url);
      setPagos(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  // MÉTRICAS
  const fetchMetrics = async () => {
    try {
      const hoy = await api.get("/payments/?filtro=hoy");
      const mes = await api.get("/payments/?filtro=mes");

      setTotalHoy(hoy.data.reduce((acc, p) => acc + parseFloat(p.monto), 0));
      setTotalMes(mes.data.reduce((acc, p) => acc + parseFloat(p.monto), 0));
      setCantidad(hoy.data.length);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (estadiaPre) {
        setEstadiaSeleccionada(estadiaPre);
        setMostrarModal(true);
    }
  }, [estadiaPre]);

  useEffect(() => {
    fetchPagos();
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchPagos();
  }, [busqueda, filtroFecha]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pagos</h1>

        <button
                onClick={() => {
                    setEstadiaSeleccionada(null);
                    setMostrarModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
            Registrar pago
            </button>
      </div>
      {mostrarModal && (
        <ModalPago
            estadiaInicial={estadiaSeleccionada}
            onClose={() => setMostrarModal(false)}
            onPagoExitoso={() => {
                fetchPagos();
                fetchMetrics();
            }}
        />
      )}

      {/* MÉTRICAS */}
      <div className="flex gap-4 flex-wrap">

        <div className="bg-white p-4 rounded shadow w-60">
          <p className="text-sm text-gray-500">Total hoy</p>
          <p className="text-xl font-bold">${totalHoy}</p>
        </div>

        <div className="bg-white p-4 rounded shadow w-60">
          <p className="text-sm text-gray-500">Total mes</p>
          <p className="text-xl font-bold">${totalMes}</p>
        </div>

        <div className="bg-white p-4 rounded shadow w-60">
          <p className="text-sm text-gray-500">Pagos hoy</p>
          <p className="text-xl font-bold">{cantidad}</p>
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
        placeholder="Buscar por patente o método de pago"
        className="border p-2 rounded w-full"
      />

      {/* TABLA */}
      <div className="bg-white rounded shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Patente</th>
              <th className="p-2">Monto</th>
              <th className="p-2">Método</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Estado</th> 
              <th className="p-2">Acción</th>
            </tr>
          </thead>

          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-t">

               <td className="p-2 text-center">
                    <div className="font-semibold">{p.patente}</div>
                    <div className="text-xs text-gray-500">
                        {p.marca} {p.modelo}
                    </div>
               </td>

                <td className="p-2 text-center font-semibold">
                  ${p.monto}
                </td>

                <td className="p-2 text-center">
                  {p.metodo_pago}
                </td>

                <td className="p-2 text-center">
                  {formatFecha(p.fecha_pago)}
                </td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${p.es_reverso ? "bg-red-200" : "bg-green-200 text-green-800"}`}>
                    {p.tipo.toUpperCase()}
                  </span>
                </td>

                <td className="p-2 text-center">
                  {!p.es_reverso && (
                    <button 
                      onClick={() => handleReverso(p.id)}
                      className="text-red-600 hover:underline text-xs"
                      title="Anular este pago"
                    >
                      Reversar
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Pagos;