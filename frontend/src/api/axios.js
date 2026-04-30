import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  //"http://192.168.1.69:8000/api",
  //"https://copier-goofball-alike.ngrok-free.dev",
  
});

export default api;