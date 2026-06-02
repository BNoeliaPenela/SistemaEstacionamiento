import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [data, setData] = useState(null); // State para almacenar los datos del dashboard
    const [vehiculos, setVehiculos] = useState([]);
    const [actividad, setActividad] = useState([]);
    const [generandoPdf, setGenerandoPdf] = useState(false);

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
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getActividadEstilos = (tipo) => {
    switch (tipo) {
      case "entrada":
        return { 
          bg: "bg-blue-50 text-blue-700 border-blue-100", 
          shadow: "shadow-[0_4px_14px_rgba(37,99,235,0.08)] border-l-4 border-l-blue-500", 
          icon: "📥", 
          label: "Entrada" 
        };
      case "salida":
        return { 
          bg: "bg-red-50 text-red-700 border-red-100", 
          shadow: "shadow-[0_4px_14px_rgba(239,68,68,0.08)] border-l-4 border-l-red-500", 
          icon: "📤", 
          label: "Salida" 
        };
      case "pago":
        return { 
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100", 
          shadow: "shadow-[0_4px_14px_rgba(16,185,129,0.08)] border-l-4 border-l-emerald-500", 
          icon: "💰", 
          label: "Pago" 
        };
      case "reverso":
        return { 
          bg: "bg-amber-50 text-amber-700 border-amber-100", 
          shadow: "shadow-[0_4px_14px_rgba(245,158,11,0.08)] border-l-4 border-l-amber-500", 
          icon: "🔄", 
          label: "Reverso" 
        };
      default:
        return { 
          bg: "bg-gray-50 text-gray-700 border-gray-100", 
          shadow: "shadow-xs border-l-4 border-l-gray-400", 
          icon: "📄", 
          label: tipo 
        };
    }
  };


  /*const getColor = (tipo) => {
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
  };*/

  // Función para descargar el PDF de autos estacionados
  const imprimirAutosEstacionados = async () => {
    setGenerandoPdf(true);
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
        
    } finally {
        setGenerandoPdf(false);
    }
  };

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400 font-black text-sm tracking-widest uppercase animate-pulse">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Control</h1>
        <p className="text-md text-gray-400 font-medium mt-1">Estado en tiempo real y operaciones rápidas del garaje.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* INGRESOS HOY */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 border-l-8 border-emerald-500">
          <p className="text-gray-400 font-bold uppercase text-md tracking-wider">Ingresos hoy</p>
          <h2 className="text-3xl font-black text-emerald-600 mt-1">${data.ingresos_hoy}</h2>
        </div>

        {/* INGRESOS MES */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 border-l-8 border-blue-500">
          <p className="text-gray-400 font-bold uppercase text-md tracking-wider">Ingresos mes</p>
          <h2 className="text-3xl font-black text-blue-600 mt-1">${data.ingresos_mes}</h2>
        </div>

        {/* VEHÍCULOS ACTIVOS */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 border-l-8 border-indigo-500">
          <p className="text-gray-400 font-bold uppercase text-md tracking-wider">Ocupación Actual</p>
          <h2 className="text-3xl font-black text-gray-900 mt-1">{data.autos_activos} <span className="text-xs font-normal text-gray-400">autos</span></h2>
        </div>

        {/* DEUDORES (ACCIONABLE) */}
        <div
          onClick={() => navigate("/estadias?deudores=true")}
          className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 border-l-8 border-red-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex justify-between items-start">
            <p className="text-gray-400 font-bold uppercase text-md tracking-wider group-hover:text-red-500 transition-colors">Deudores pendientes</p>
            <span className="text-xs font-black bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity">VER →</span>
          </div>
          <h2 className="text-3xl font-black text-red-600 mt-1">{data.deudores}</h2>
        </div>

      </div>

      {/* 🟦 CONTENIDO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        
        {/* 🚗 SECCIÓN VEHÍCULOS ESTACIONADOS */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Vehículos Estacionados</h2>
              <p className="text-md text-gray-400 font-medium mt-0.5">Listado de vehículos que se encuentran dentro del establecimiento.</p>
            </div>
            
            {/* BOTÓN IMPRIMIR LISTADO */}
            <button 
              onClick={imprimirAutosEstacionados}
              disabled={generandoPdf}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl transition-all text-md font-black border border-gray-200/60 disabled:opacity-50"
            >
              <span>{generandoPdf ? "⏳ Generando..." : "🖨️ Reporte PDF"}</span>
            </button>
          </div>

          {/* CONTENEDOR DE TARJETAS DE AUTOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[540px] overflow-y-auto pr-1">
            {vehiculos.map(v => {
              const esALiquidar = v.deuda === null;
              const estaPagado = v.deuda <= 0;

              return (
                <div key={v.id} className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 p-4 rounded-xl flex justify-between items-center transition-all">
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-lg text-gray-900 tracking-wide uppercase bg-white px-2 py-0.5 rounded-md border border-gray-200/50 shadow-2xs">{v.patente}</span>
                      <span className="text-md font-bold text-gray-400 uppercase truncate max-w-[100px]">{v.marca} {v.modelo}</span>
                    </div>
                    
                    <div className="text-md text-gray-500 space-y-0.5 pt-1">
                      <p><b>Ingreso:</b> {formatFecha(v.fecha_entrada)}</p>
                      <p className="text-indigo-600"><b>Salida est:</b> {formatFecha(v.fecha_salida_estimada)}</p>
                    </div>
                    
                    <div className="pt-1">
                      {estaPagado ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md font-black text-xs uppercase tracking-wider inline-block">
                          ✓ Total Saldado
                        </span>
                      ) : Number(v.deuda) === 1000 ? (
                        /* Si es 1000, ocultamos el número y ponemos el cartel */
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-md font-black text-xs uppercase tracking-wider inline-block">
                          ⏳ Pendiente de pago
                        </span>
                      ) : (
                        /* Si es cualquier otro número, mostramos la deuda real modificada */
                        <p className="text-md font-black text-red-600">
                          Deuda: ${v.deuda}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ACCIONES RÁPIDAS MODIFICADAS */}
                  <div className="flex flex-col gap-1.5 min-w-[85px]">
                    {estaPagado ? (
                      /* 🛑 BOTÓN DESHABILITADO SI YA PAGÓ */
                      <button
                        disabled
                        className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-md font-black cursor-not-allowed border border-emerald-200 text-center"
                      >
                        ✓ Pagado
                      </button>
                    ) : (
                      /* 💰 BOTÓN ACTIVO SI REGISTRA DEUDA */
                      <button
                        onClick={() => navigate("/pagos", { state: { estadia: v } })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-md font-black shadow-xs transition-colors"
                      >
                        Pagar
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate("/salida")}
                      className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-600 px-3 py-1.5 rounded-lg text-md font-bold transition-all"
                    >
                      Salida
                    </button>
                  </div>

                </div>
              );
            })}

            {vehiculos.length === 0 && (
              <p className="col-span-2 text-center text-md text-gray-400 font-medium py-12">
                No hay vehículos estacionados en este momento.
              </p>
            )}
          </div>
        </div>


        {/* SECCIÓN ACTIVIDAD RECIENTE */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Actividad Reciente</h2>
            <p className="text-md text-gray-400 font-medium mt-0.5">Últimos movimientos registrados en el sistema.</p>
          </div>

          <div className="space-y-3.5 max-h-[540px] overflow-y-auto pr-1 py-1">
            {actividad.map((a, i) => {
              const estilos = getActividadEstilos(a.tipo);
              return (
                <div 
                  key={i} 
                  className={`bg-white p-3 rounded-xl border border-gray-100/70 flex items-start gap-3 transition-all hover:scale-[1.01] ${estilos.shadow}`}
                >
                  {/* BADGE ICONO TIPO */}
                  <div className={`mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg text-md font-bold border shrink-0 ${estilos.bg}`}>
                    {estilos.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-md font-black uppercase tracking-wider text-gray-700">
                        {estilos.label}
                      </span>
                      <span className="text-md font-black text-gray-400 uppercase bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {a.hora}
                      </span>
                    </div>
                    
                    <p className="text-md font-bold text-gray-800 mt-1 truncate">
                      {a.patente} <span className="font-medium text-gray-400 text-xs">({a.cliente || "Sin Cliente"})</span>
                    </p>
                    
                    <p className="text-md text-gray-400 font-medium mt-0.5">
                      {new Date(a.fecha).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
              );
            })}

            {actividad.length === 0 && (
              <p className="text-center text-md text-gray-400 font-medium py-12">
                Sin movimientos recientes en el historial.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;