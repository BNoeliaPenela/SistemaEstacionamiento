import { useEffect, useState } from "react";
import api from "../api/axios";

function Dashboard() {
    const [data, setData] = useState(null); // State para almacenar los datos del dashboard
    
    useEffect(() => {  // Hook para cargar los datos del dashboard al montar el componente
        api.get("/parking/dashboard/")  // Realiza una solicitud GET a la API para obtener los datos del dashboard
        .then(res => {
            setData(res.data); // Almacena los datos recibidos en el estado
        })
        .catch(err => {
            console.error("Error:", err);
        });
    }, []);

    if (!data) return <p>Cargando...</p>;

    return (
        <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <p>Autos activos: {data.autos_activos}</p>
        <p>Espacios disponibles: {data.espacios_disponibles}</p>
        <p>Ingresos hoy: ${data.ingresos_hoy}</p>
        <p>Deudores: {data.deudores}</p>
        </div>
    );
}

export default Dashboard;