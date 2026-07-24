import { useState, useEffect } from 'react';
import api from '../api/axios';

function Navbar({ setOpen }) {

  const [isDueno, setIsDueno] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalCambiar, setShowModalCambiar] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const [pinActual, setPinActual] = useState('');
  const [pinNuevo, setPinNuevo] = useState('');
  const [errorCambio, setErrorCambio] = useState('');
  const [exitoCambio, setExitoCambio] = useState('');

  // Al arrancar, revisamos si ya estaba en modo dueño
  useEffect(() => {
      const modoGuardado = localStorage.getItem('modo_dueno') === 'true';
      setIsDueno(modoGuardado);
  }, []);

  const manejarAccionAdmin = () => {
      if (isDueno) {
          // Si ya es dueño, un clic lo saca (Cierre manual requerido)
          localStorage.setItem('modo_dueno', 'false');
          setIsDueno(false);
          window.location.reload(); // Recargamos para limpiar todas las pantallas instantáneamente
      } else {
          // Si es empleado, abrimos el modal para pedir PIN
          setShowModal(true);
      }
  };

  const verificarPin = async (e) => {
      e.preventDefault();
      try {
          const res = await api.post('/parking/configuracion/validar-pin/', { pin: pinInput }); // Ajusta '/parking/' según tu prefijo de URLs
          if (res.data.valido) {
              localStorage.setItem('modo_dueno', 'true');
              setIsDueno(true);
              setShowModal(false);
              setPinInput('');
              setError('');
              window.location.reload();
          }
      } catch (err) {
          setError(err.response?.data?.error || 'PIN incorrecto. Intentá de nuevo.');
          setPinInput('');
      }
  };

  //Cambiar PIN del dueño
  const handleCambiarPin = async (e) => {
      e.preventDefault();
      setErrorCambio('');
      setExitoCambio('');

      try {
          const res = await api.post('/parking/configuracion/cambiar-pin/', { // Ajusta '/parking/' según tu prefijo de URLs
              pin_actual: pinActual,
              pin_nuevo: pinNuevo
          });

          setExitoCambio(res.data.mensaje);
          setPinActual('');
          setPinNuevo('');

          setTimeout(() => {
              setShowModalCambiar(false);
              setExitoCambio('');
          }, 1500);

      } catch (err) {
          setErrorCambio(err.response?.data?.error || 'Error al cambiar PIN');
      }
  };

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
 

      <div className="flex items-center gap-2">
        {/* BOTÓN EXTRA: Cambiar PIN (Sólo visible en Modo Dueño) */}
        {isDueno && (
          <button
            onClick={() => setShowModalCambiar(true)}
            className="flex items-center gap-1.5 border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
            title="Cambiar PIN de seguridad"
          >
            ⚙️ Clave
          </button>
        )}

        {/* BOTÓN PERFIL / MODO DUEÑO */}
        <button 
            onClick={manejarAccionAdmin}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl transition-all ${
                isDueno 
                ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700' 
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
            }`}
        >
            
            <span className="text-xs font-black uppercase tracking-wider">
                {isDueno ? 'Dueño (Salir)' : 'Empleado'}
            </span>
        </button>
      </div>

        {/* MODAL PARA EL INGRESO DEL PIN */}
        {showModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-80 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-wide mb-2">
                        🔑 Acceso de Administración
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Ingresá el PIN de 4 dígitos para ver montos y habilitar acciones avanzadas.
                    </p>

                    <form onSubmit={verificarPin} className="space-y-4">
                        <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => {
                                setError(false);
                                setPinInput(e.target.value.replace(/\D/g, '')); // Solo números
                            }}
                            className="w-full text-center text-2xl tracking-widest font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:border-purple-500"
                            autoFocus
                        />

                        {error && (
                            <p className="text-xs text-red-500 font-semibold text-center">
                                ❌ PIN incorrecto. Intentá de nuevo.
                            </p>
                        )}

                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setPinInput('');
                                    setError(false);
                                }}
                                className="w-1/2 border border-gray-200 text-gray-500 rounded-xl py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                            >
                                Ingresar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ⚙️ MODAL PARA CAMBIAR PIN */}
        {showModalCambiar && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-80 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-wide mb-2">
                        ⚙️ Cambiar PIN
                    </h3>
                    <p className="text-md text-gray-500 mb-4">
                        Modificá tu clave de acceso al Modo Dueño.
                    </p>

                    <form onSubmit={handleCambiarPin} className="space-y-3">
                        <div>
                            <label className="text-[13px] font-bold text-gray-400 uppercase">PIN Actual</label>
                            <input 
                                type="password"
                                maxLength={6}
                                placeholder="••••"
                                value={pinActual}
                                onChange={(e) => setPinActual(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-center text-xl font-bold border border-gray-200 rounded-xl py-1.5 focus:outline-none focus:border-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[13px] font-bold text-gray-400 uppercase">Nuevo PIN</label>
                            <input 
                                type="password"
                                maxLength={6}
                                placeholder="••••"
                                value={pinNuevo}
                                onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-center text-xl font-bold border border-gray-200 rounded-xl py-1.5 focus:outline-none focus:border-purple-500"
                                required
                            />
                        </div>

                        {errorCambio && (
                            <p className="text-xs text-red-500 font-semibold text-center">
                                ❌ {errorCambio}
                            </p>
                        )}

                        {exitoCambio && (
                            <p className="text-xs text-emerald-600 font-bold text-center">
                                ✅ {exitoCambio}
                            </p>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button 
                                type="button"
                                onClick={() => {
                                    setShowModalCambiar(false);
                                    setPinActual('');
                                    setPinNuevo('');
                                    setErrorCambio('');
                                }}
                                className="w-1/2 border border-gray-200 text-gray-500 rounded-xl py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        </div>
    );
}

export default Navbar;