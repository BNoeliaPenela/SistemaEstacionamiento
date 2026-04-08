import { useState } from "react";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";

function MainLayout({ children }) {

  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Contenido */}
      <div className="flex-1 flex flex-col">

        <Navbar setOpen={setOpen} />

        <main className="p-6 overflow-y-auto flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}

export default MainLayout;