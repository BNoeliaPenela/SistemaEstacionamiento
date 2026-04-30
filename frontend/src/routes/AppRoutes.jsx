import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import MainLayout from "../layouts/mainLayout";
import Entrada from "../pages/entrada";
import Salida from "../pages/salida";
import Clientes from "../pages/clientes";
import Vehiculos from "../pages/vehiculos";
import Estadias from "../pages/estadias";
import Pagos from "../pages/pagos";
import Backup from "../pages/backup";

function AppRoutes() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entrada" element={<Entrada />} />
          <Route path="/salida" element={<Salida />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/vehiculos" element={<Vehiculos />} />
          <Route path="/estadias" element={<Estadias />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default AppRoutes;