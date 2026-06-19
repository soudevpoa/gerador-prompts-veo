import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // A porta onde seu backend está rodando
});

export default api;