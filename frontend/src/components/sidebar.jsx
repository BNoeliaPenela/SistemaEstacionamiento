import { Link } from "react-router-dom";

function Sidebar({ open, setOpen }) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={`
        fixed md:static top-0 left-0 h-full w-64 bg-white shadow-md
        transform ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 z-50
      `}>

        <div className="p-4 text-xl font-bold border-b">
          Parking
        </div>

        <nav className="p-4 space-y-2">

          <Link to="/" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Panel Principal
          </Link>

          <Link to="/entrada" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Registrar Entrada
          </Link>

          <Link to="/salida" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Registrar Salida
          </Link>

          <Link to="/clientes" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Clientes
          </Link>

          <Link to="/vehiculos" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Vehículos
          </Link>

          <Link to="/estadias" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Estadías
          </Link>

          <Link to="/pagos" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Pagos
          </Link>

          <Link to="/backups" onClick={() => setOpen(false)}
            className="block p-2 rounded hover:bg-gray-100">
            Backups
          </Link>

        </nav>
      </div>
    </>
  );
}

export default Sidebar;