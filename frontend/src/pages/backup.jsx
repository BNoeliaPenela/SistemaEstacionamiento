import { useState } from "react";
import api from "../api/axios";

function Backup() {
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" }); // tipo: 'success' | 'error'

  // 1. Lógica para EXPORTAR (Descargar JSON)
  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get("/backup/export/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const fecha = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.setAttribute("download", `backup_parking_${fecha}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setMensaje({ texto: "Respaldo descargado con éxito.", tipo: "success" });
    } catch (error) {
      setMensaje({ texto: "Error al generar el respaldo.", tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 2. Lógica para IMPORTAR (Subir JSON)
  const handleImport = async (e) => {
    e.preventDefault();
    if (!archivo) return;

    const confirmar = window.confirm(
      "⚠️ ¡ATENCIÓN! Importar un backup borrará todos los datos actuales y los reemplazará por los del archivo. ¿Deseas continuar?"
    );

    if (!confirmar) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", archivo);

    try {
      const res = await api.post("/backup/import/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMensaje({ texto: res.data.mensaje, tipo: "success" });
      setArchivo(null);
    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.error || "Error al importar el archivo.", 
        tipo: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 space-y-8">
      <h1 className="text-2xl font-bold">Gestión de Copias de Seguridad (Backup)</h1>

      {mensaje.texto && (
        <div className={`p-4 rounded shadow ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECCIÓN EXPORTAR */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-600">
          <h2 className="text-xl font-semibold mb-2">Exportar Datos</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Descarga una copia completa de la base de datos (clientes, vehículos, pagos y estadías) en formato JSON.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Procesando..." : "📥 Descargar Backup Actual"}
          </button>
        </div>

        {/* SECCIÓN IMPORTAR */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-2">Importar Datos</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Selecciona un archivo JSON de backup para restaurar el sistema. 
            <span className="text-red-500 font-bold"> Se borrarán los datos actuales.</span>
          </p>
          
          <form onSubmit={handleImport} className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setArchivo(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            <button
              type="submit"
              disabled={!archivo || loading}
              className="w-full bg-orange-500 text-white py-3 rounded-md font-bold hover:bg-orange-600 disabled:bg-gray-300 transition"
            >
              {loading ? "Importando..." : "📤 Subir y Restaurar"}
            </button>
          </form>
        </div>

      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 mb-1">Nota de seguridad:</h3>
        <p className="text-xs text-gray-500">
          El sistema genera automáticamente una copia de seguridad en el servidor dentro de la carpeta <code>/backups</code> antes de realizar cualquier importación, por si necesitas revertir cambios manualmente.
        </p>
      </div>
    </div>
  );
}

export default Backup;