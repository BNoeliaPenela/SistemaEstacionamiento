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
  const [pagoAConfirmar, setPagoAConfirmar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const [totalHoy, setTotalHoy] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [cantidad, setCantidad] = useState(0);

  const [generandoPdf, setGenerandoPdf] = useState(false);

  const navigate = useNavigate();
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const mostrarAlerta = (msj, tipo = "success") => {
    setNotificacion({ mostrar: true, mensaje: msj, tipo });
    setTimeout(() => setNotificacion({ mostrar: false, mensaje: "", tipo: "" }), 1500);
  };

  const handleReverso = async (id) => {
    
    try {
      await api.post(`/payments/${id}/reversar/`); // Ajustá la URL según tus urls.py
      fetchPagos();
      fetchMetrics();
      mostrarAlerta("Pago reversado exitosamente ✅");
    } catch (error) {
      console.error(error);
      const msjError = error.response?.data?.error || "Error al reversar";
      mostrarAlerta(msjError, "error");    }
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
      mostrarAlerta("Error al cargar la lista de pagos", "error");
    }
  };

  // MÉTRICAS
  const fetchMetrics = async () => {
    try {
      const hoy = await api.get("/payments/?filtro=hoy");
      const mes = await api.get("/payments/?filtro=mes");

      setTotalHoy(hoy.data.reduce((acc, p) => acc + parseFloat(p.monto), 0));
      setTotalMes(mes.data.reduce((acc, p) => acc + parseFloat(p.monto), 0));
      const pagosRealesHoy = hoy.data.filter(p => p.tipo !== "reverso");
      setCantidad(pagosRealesHoy.length);

    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar métricas", "error");
    }
  };

  const handleDescargarReporteCaja = async () => {
    setGenerandoPdf(true);
    try {
        const response = await api.get('/payments/reportes/pagos-diarios/', {
        responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'reporte_pagos_diarios.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Error al descargar el PDF", error);
        
    } finally {
        setGenerandoPdf(false);
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
    <div className="space-y-4 relative">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pagos</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDescargarReporteCaja}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs"
          >
            🖨️ Imprimir Caja Diaria
          </button>

          <button
                  onClick={() => {
                      setEstadiaSeleccionada(null);
                      setMostrarModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
              >
              Registrar pago
          </button>

        </div>
        
      </div>

      {/* SECCIÓN PRINCIPAL DE INFO Y FILTROS */}
      <div className="flex flex-wrap items-end justify-between gap-6 w-full">
        
        {/* LADO IZQUIERDO: KPIs CON BORDE LATERAL COLOREADO */}
        <div className="flex gap-4 flex-1 min-w-fit">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-blue-500 flex-1 min-w-[180px]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-wider">Caja de Hoy</p>
            <p className="text-3xl font-black text-gray-800">${totalHoy}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-green-500 flex-1 min-w-[180px]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total del Mes</p>
            <p className="text-3xl font-black text-green-600">${totalMes}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-purple-500 flex-1 min-w-[150px]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-wider">Pagos de Hoy</p>
            <p className="text-3xl font-black text-purple-600">{cantidad}</p>
          </div>
        </div>

        {/* LADO DERECHO: PANEL DE FILTROS IDÉNTICO A ESTADIAS */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-50 flex flex-col gap-4 min-w-fit">
          <p className="text-sm font-black uppercase tracking-widest text-gray-400">Filtros</p>
          
          <div className="flex gap-8 items-center">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 ml-1">FECHA DE EMISIÓN</span>
              <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
                {["hoy", "ayer", "7dias", "mes"].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFiltroFecha(f)} 
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      filtroFecha === f 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === "7dias" ? "7 Días" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                {filtroFecha && (
                  <button 
                    onClick={() => setFiltroFecha("")} 
                    className="px-3 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BUSCADOR ESTILIZADO CON BORDES MÁS SUAVES */}
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por patente o método de pago..."
        className="border-2 border-gray-100 focus:border-blue-400 p-3 rounded-2xl w-full shadow-sm outline-none transition-all text-lg font-medium"
      />
      

      {/* TABLA LIMPIA E HISTORIAL CON DISEÑO PROFESSIONAL */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="p-4 text-center">Patente</th>
              <th className="p-4 text-center">Monto</th>
              <th className="p-4 text-center">Método</th>
              <th className="p-4 text-center">Fecha</th>
              <th className="p-4 text-center">Estado</th> 
              <th className="p-4 text-center">Acción</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {pagos.map((p) => (
              <tr 
                key={p.id} 
                className={`hover:bg-gray-50/50 transition-colors ${
                  p.tipo === 'reverso' ? 'bg-red-50/40 opacity-75' : ''
                }`}
              >
                <td className="p-4 text-center">
                  <div className="font-bold text-gray-800">{p.patente}</div>
                  <div className="text-xs font-semibold text-gray-400">
                    {p.marca} {p.modelo}
                  </div>
                </td>

                <td className={`p-4 text-center font-bold text-base ${
                  p.tipo === 'reverso' ? 'text-red-400 line-through' : 'text-gray-800'
                }`}>
                  ${p.monto}
                </td>

                <td className="p-4 text-center text-gray-600 font-medium">
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-gray-600">
                    {p.metodo_pago}
                  </span>
                </td>

                <td className="p-4 text-center text-gray-500 font-medium">
                  {formatFecha(p.fecha_pago)}
                </td>
                
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                    p.es_reverso 
                      ? "bg-red-100 text-red-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {p.tipo.toUpperCase()}
                  </span>
                </td>

                <td className="p-4 text-center">
                  {!p.es_reverso && (
                    <>
                      {pagoAConfirmar === p.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-400">¿Seguro?</span>
                          <button
                            onClick={() => {
                              handleReverso(p.id);
                              setPagoAConfirmar(null);
                            }}
                            className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm transition"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setPagoAConfirmar(null)}
                            className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setPagoAConfirmar(p.id)}
                          className="text-red-500 hover:text-red-700 hover:underline text-xs font-bold transition-colors"
                          title="Anular este pago"
                        >
                          Reversar
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE REGISTRO DE PAGO */}
      {mostrarModal && (
        <ModalPago
          estadiaInicial={estadiaSeleccionada}
          onClose={() => setMostrarModal(false)}
          onPagoExitoso={(msg) => {
            setMostrarModal(false); 
            fetchPagos();
            fetchMetrics();
            mostrarAlerta(msg || "Pago registrado correctamente ✅");
          }}
        />
      )}

      {/* 🔔 CARTEL DE NOTIFICACIÓN EN EL MEDIO DE ACCIÓN RÁPIDA */}
      {notificacion.mostrar && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[9999]">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl text-white font-bold text-lg flex items-center gap-3 ${
            notificacion.tipo === "success" ? "bg-green-600" : "bg-red-600"
          }`}>
            {notificacion.tipo === "success" ? "✅" : "⚠️"}
            {notificacion.mensaje}
          </div>
        </div>
      )}

    </div>
  );
}

export default Pagos;