import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import AppRoutes from './routes/AppRoutes'
import './App.css'
import PantallaBloqueo from './components/pantallaBloqueo';

function App() {
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    // Escuchamos el evento que tira Axios si el backend rebota una petición
    const manejarBloqueo = () => setBloqueado(true);
    
    window.addEventListener('licencia_vencida', manejarBloqueo);
    
    return () => {
      window.removeEventListener('licencia_vencida', manejarBloqueo);
    };
  }, []);

  // 🚨 SI ESTÁ BLOQUEADO, RENDERIZA LA PANTALLA GRIS Y NADA MÁS
  if (bloqueado) {
    return <PantallaBloqueo />;
  }


  return <AppRoutes />;
}    

export default App
