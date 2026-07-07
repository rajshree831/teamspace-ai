import axios from "axios";

// Single source of truth for the backend URL.
// Later, this will come from an environment variable
// (different URL for local dev vs. Render production).
const API_BASE_URL = "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: automatically attach the JWT token
// (if one exists) to every outgoing request's Authorization header.
// This means individual API calls never have to manually add it.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;