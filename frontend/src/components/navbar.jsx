function Navbar({ setOpen }) {
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
      
      <div className="flex items-center gap-3">
        {/* Botón menú hamburguesa (mobile) mejorado */}
        <button
          className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-xl"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>

        <h1 className="text-lg font-black uppercase text-gray-900 tracking-wide">
          Sistema de Garage
        </h1>
      </div>

      {/* Perfil del operador alineado al estilo del dashboard */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
        <span className="text-base">👤</span>
        <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
          Empleado
        </span>
      </div>

    </div>
  );
}

export default Navbar;