import { Link, useLocation } from "react-router-dom";

function Sidebar({ open, setOpen }) {
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Panel Principal", icon: "▤" },
    { path: "/entrada", label: "Registrar Entrada", icon: "↳" },
    { path: "/salida", label: "Registrar Salida", icon: "↱" },
    { path: "/clientes", label: "Clientes", icon: "◆" },  
    { path: "/vehiculos", label: "Vehículos", icon: "⚉" },
    { path: "/estadias", label: "Estadías", icon: "☖" },
    { path: "/pagos", label: "Pagos", icon: "$" },
    { path: "/backup", label: "Backups", icon: "⛁" },
  ];

  return (
    <>
      {/* Overlay mobile con desenfoque sutil */}
      {open && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs md:hidden z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Contenedor del Sidebar */}
      <div className={`
        fixed md:static top-0 left-0 h-full w-64 bg-white border-r border-gray-100
        transform ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 z-50
        flex flex-col
      `}>

        {/* Header del Menú (Brand) */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-black text-lg text-gray-950 tracking-tight leading-none">
            GARAGE
          </h2>
          <p className="text-[12px] text-blue-600 font-black uppercase tracking-widest mt-1.5">
            Panel de Gestión
          </p>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 py-4 flex flex-col overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`
                  relative pl-6 pr-4 py-3 text-sm uppercase font-black transition-all duration-150 border-b border-gray-50/30
                  /* Agregamos Flexbox alineado al centro y separación uniforme */
                  flex items-center gap-4
                  /* Línea vertical azul a la izquierda (Detalle Activo/Hover) */
                  before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:transition-transform before:duration-200
                  ${isActive 
                    ? "text-blue-600 font-black bg-blue-50/30 before:scale-y-100" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 before:scale-y-0 hover:before:scale-y-100"
                  }
                `}
              >
                {/* Ícono monocromático que hereda el color del texto */}
                <span className={`text-base font-bold w-5 text-center transition-colors ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className="tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del Menú */}
        <div className="p-4 border-t border-gray-50 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Sistema de Garage v1.2.0
          </p>
        </div>

      </div>
    </>
  );
}

export default Sidebar;