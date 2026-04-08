function Navbar({ setOpen }) {
  return (
    <div className="bg-white shadow p-4 flex justify-between items-center">

      <div className="flex items-center gap-4">

        {/* Botón menú (mobile) */}
        <button
          className="md:hidden text-xl"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>

        <h1 className="font-semibold">
          Sistema de Estacionamiento
        </h1>
      </div>

      <div>
        <span className="text-sm text-gray-600">
          Empleado
        </span>
      </div>

    </div>
  );
}

export default Navbar;