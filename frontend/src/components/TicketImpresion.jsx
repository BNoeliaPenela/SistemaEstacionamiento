import { useEffect } from 'react';

function TicketImpresion({ estadia, alTerminarImprimir, tipoTicket = "COMPROBANTE" }) {
  if (!estadia) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const estadiaId = estadia.id || estadia.id_estadia || estadia.estadia_id;
  const formatId = (id) => {
    if (!id) return "#------";
    return `#${String(id).padStart(6, '0')}`;
  };

  // Disparador automático del cuadro de impresión nativo del navegador
  useEffect(() => {
    if (estadia) {
      const timer = setTimeout(() => {
        window.print();
        if (alTerminarImprimir) alTerminarImprimir();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [estadia]);

  // Lógica de deuda para el cartel
  const esPendiente = Number(estadia.deuda) === 1000 || estadia.deuda > 0;

  const tipoEstadiaNormalized = estadia.tipo_estadia || estadia.tipoEstadia || "Hora";
  const fechaEntradaNormalized = estadia.fecha_entrada || estadia.fechaInicio || estadia.fecha_inicio;
  const fechaSalidaNormalized = estadia.fecha_salida_estimada || estadia.fechaFinEst || estadia.fecha_fin_est;
  
  const PlantillaTicket = ({ tipoCopia }) => (
    <div className="w-[72mm] mx-auto bg-white text-black p-1 font-mono text-xs space-y-2.5 border-b border-dashed border-gray-400 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0 select-none text-left">
      
      {/* ADVERTENCIA FISCAL */}
      <div className="text-center font-bold text-[10px] tracking-tight border border-black p-0.5 uppercase">
        ESTE TICKET NO ES VÁLIDO COMO FACTURA
      </div>

      {/* HEADER: DATOS DEL COMERCIO */}
      <div className="text-center space-y-0.5">
        <h2 className="text-sm font-black uppercase tracking-wide">🚗</h2>
        <p className="text-[10px] font-bold text-gray-700">Av.Jara 1620, Mar del Plata</p>
        <p className="text-[10px] font-bold text-gray-700">Tel:  (223) 686 1515</p>
        <div className="pt-1">
          <p className="text-xs font-black uppercase tracking-wider bg-gray-200 py-0.5">
            {tipoTicket}
          </p>
          <p className="text-sm font-black tracking-widest border-b border-black py-0.5 mb-1">
            ESTADÍA {formatId(estadiaId)}
          </p>
        </div>
        
        <p className="text-[10px] font-bold uppercase mt-1.5 bg-black text-white py-0.5 px-1 inline-block">
          *** COPIA {tipoCopia} ***
        </p>
      </div>

      <div className="border-b border-black border-dotted"></div>

      {/* DATOS DE LA ESTADÍA */}
      <div className="space-y-1 text-[11px]">
        <p className="text-xs font-black bg-gray-100 p-0.5">
          PATENTE: <span className="float-right uppercase">{estadia.patente}</span>
        </p>
        <p>Vehículo: <span className="float-right uppercase font-bold">{estadia.tipo_vehiculo || "-"}</span></p>
        <p>Marca/Modelo: <span className="float-right uppercase font-semibold">{estadia.marca || "—"} {estadia.modelo || ""}</span></p>
        <p>Cobro por: <span className="float-right uppercase">{tipoEstadiaNormalized} (x{estadia.cantidad})</span></p>
      </div>

      <div className="border-b border-black border-dotted"></div>

      {/* FECHAS DE CONTROL */}
      <div className="space-y-0.5 text-[10px] text-gray-800">
        <p className="font-bold">Emisión: <span className="float-right font-normal">{formatFecha(new Date())}</span></p>
        <p className="font-bold">Fecha Inicio: <span className="float-right font-normal">{formatFecha(fechaEntradaNormalized)}</span></p>
        
        {estadia.fecha_salida_real ? (
          <p className="font-bold">Fecha Fin Real: <span className="float-right font-normal">{formatFecha(estadia.fecha_salida_real)}</span></p>
        ) : (
          <p className="font-bold">Fecha Fin Est.: <span className="float-right font-normal">{formatFecha(fechaSalidaNormalized)}</span></p>
        )}
      </div>

      <div className="border-b border-black border-dotted"></div>

      {/* ESTADO FINANCIERO */}
      <div className="pt-0.5">
        {esPendiente ? (
          <div className="border-2 border-black p-1 text-center font-black text-xs tracking-wider bg-white">
            ⚠️ ESTADO: PENDIENTE ⚠️
          </div>
        ) : (
          <div className="border-2 border-black p-1 text-center font-black text-sm bg-black text-white">
            ESTADO: ABONADO
          </div>
        )}
      </div>

      <div className="border-b border-black border-dotted"></div>

      {/* FOOTER: EXENCIÓN DE RESPONSABILIDAD */}
      <div className="text-center text-[9px] leading-tight space-y-1.5 pt-1 text-gray-700">
        <p className="font-bold italic">
          "La empresa no se hace cargo de faltantes o roturas mecánicas."
        </p>
        <p className="font-bold italic">
          Conservar este ticket para el retiro del vehiculo. 
        </p>
        <p className="font-black tracking-wide uppercase text-[10px] text-black">
          ¡Muchas gracias!
        </p>
      </div>
    </div>
  );

  return (
    <div id="seccion-ticket-impresion" className="hidden-screen-only">
      <PlantillaTicket tipoCopia="CLIENTE" />
      <div className="page-break"></div>
      <PlantillaTicket tipoCopia="CONTROL COMERCIO" />
    </div>
  );
}

export default TicketImpresion;