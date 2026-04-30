import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [data, setData] = useState(null); // State para almacenar los datos del dashboard
    const [vehiculos, setVehiculos] = useState([]);
    const [actividad, setActividad] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/parking/dashboard/");
      setData(res.data);

      // activos
      const activos = await api.get("/parking/?activa=true");
      setVehiculos(activos.data);

      // actividad
      const act = await api.get("/parking/dashboard/actividad/");
      setActividad(act.data);

    } catch (err) {
      console.error(err);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString();
  };

  const getColor = (tipo) => {
    switch (tipo) {
        case "entrada":
        return "text-blue-600";
        case "salida":
        return "text-red-500";
        case "pago":
        return "text-green-600";
        case "reverso":
        return "text-yellow-600";
        default:
        return "text-gray-600";
    }
  };

  // Función para descargar el PDF de autos estacionados
  const imprimirAutosEstacionados = async () => {
    try {
        const response = await api.get('/parking/pdf/estacionados/', {
        responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'autos_estacionados.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Error al descargar el PDF", error);
        alert("No se pudo generar el reporte.");
    }
  };

  if (!data) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6 space-y-6">

      {/* 🟪 KPIs */}
      <div className="grid grid-cols-4 gap-4">

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Ingresos hoy</p>
          <h2 className="text-xl font-bold">${data.ingresos_hoy}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Ingresos mes</p>
          <h2 className="text-xl font-bold">${data.ingresos_mes}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Vehículos activos</p>
          <h2 className="text-xl font-bold">{data.autos_activos}</h2>
        </div>

        <div
          onClick={() => navigate("/estadias?deudores=true")}
          className="bg-white p-4 rounded shadow cursor-pointer hover:bg-gray-100"
        >
          <p className="text-gray-500 text-sm">Deudores</p>
          <h2 className="text-xl font-bold">{data.deudores}</h2>
        </div>

      </div>

      {/* 🟦 CONTENIDO */}
      <div className="grid grid-cols-3 gap-6">

        {/* 🚗 VEHÍCULOS */}
        <div className="col-span-2 bg-white p-4 rounded shadow">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Vehículos estacionados</h2>
            
            {/* BOTÓN IMPRIMIR LISTADO */}
            <button 
                onClick={imprimirAutosEstacionados}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition text-sm border"
            >
                <span>🖨️ Imprimir Listado</span>
            </button>
          </div>


          <div className="space-y-3">

            {vehiculos.map(v => (
              <div key={v.id} className="border p-3 rounded flex justify-between items-center">

                {/* INFO */}
                <div>
                  <p className="font-bold">{v.patente}</p>
                  <p className="text-xs text-gray-500">
                    {v.marca} {v.modelo}
                  </p>
                  <p className="text-sm">
                    Entrada: {formatFecha(v.fecha_entrada)}
                  </p>
                  <p className="text-sm">
                    Salida estimada: {formatFecha(v.fecha_salida_estimada)}
                  </p>
                  <p className="text-sm font-semibold">
                    ${v.precio}
                  </p>
                </div>

                {/* BOTONES */}
                <div className="flex gap-2">

                  <button
                    onClick={() => navigate("/salida")}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Salida
                  </button>

                  <button
                    onClick={() => navigate("/pagos", { state: { estadia: v } })}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Pagar
                  </button>

                </div>

              </div>
            ))}

          </div>
        </div>

        {/* 🟨 ACTIVIDAD */}
        <div className="bg-white p-4 rounded shadow">

          <h2 className="text-lg font-bold mb-4">Actividad reciente</h2>

          <div className="space-y-3 text-sm">

            {actividad.map((a, i) => (
              <div key={i} className="border-b pb-2">

                <p className={`font-semibold capitalize ${getColor(a.tipo)}`}>
                  {a.tipo}
                </p>

                <p className="text-gray-600">
                  {a.patente} - {a.cliente}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(a.fecha).toLocaleDateString()} - {a.hora}
                </p>

              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;