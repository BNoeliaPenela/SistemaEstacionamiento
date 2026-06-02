import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  
});

// 🔒 INTERCEPTOR PARA DETECTAR BLOQUEO DE LICENCIA
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data.error === 'LICENCIA_VENCIDA') {
      // Despachamos un evento personalizado para que React se entere al instante
      window.dispatchEvent(new Event('licencia_vencida'));
    }
    return Promise.reject(error);
  }
);

export default api;