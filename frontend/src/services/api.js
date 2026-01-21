import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  // Avoid Sanctum stateful cookie/session for public API calls
  withCredentials: false,
  headers: { 'Accept': 'application/json' },
});

export default api;