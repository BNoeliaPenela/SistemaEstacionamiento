import { useState } from 'react';
import api from "../api/axios"; // O tu instancia de 'api'

export default function PantallaBloqueo() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleActivar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Le pegamos a la ruta que habilitamos en el middleware
      await api.post('http://localhost:8000/api/parking/licencia/activar/', { codigo });
      
      // Si sale bien, recargamos la página y el sistema vuelve a la vida solo
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col justify-center items-center z-50 p-4 select-none">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-100">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Sistema Suspendido</h2>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          El período de uso autorizado ha caducado. Para continuar gestionando las estadías del garage, ingresá el código de renovación.
        </p>

        <form onSubmit={handleActivar} className="mt-6">
          <input
            type="text"
            placeholder="Pegá el código de activación acá..."
            className="border-2 border-gray-200 p-3 rounded-xl w-full text-center font-mono text-sm focus:outline-hidden focus:border-slate-800 uppercase tracking-wider"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            disabled={cargando}
            required
          />

          {error && <p className="text-red-600 text-xs font-semibold mt-2">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="bg-slate-800 hover:bg-slate-900 text-white w-full py-3.5 rounded-xl font-bold transition-all shadow-md mt-4 disabled:opacity-50"
          >
            {cargando ? 'Verificando...' : 'Activar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}