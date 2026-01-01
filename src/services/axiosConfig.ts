import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
} from "axios";
import { getTenantFromURL } from "../utils/getTenantFromURL";

// API base URL
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1000 * 60 * 60 * 24, // 1 day
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (
    config: import("axios").InternalAxiosRequestConfig
  ): import("axios").InternalAxiosRequestConfig => {
    const token = localStorage.getItem("accessToken");
    console.log(
      "Request Interceptor: Adding Authorization header with token:",
      token
    );

    // Dynamically set x-tenant header on each request
    if (config.headers) {
      config.headers["x-tenant"] = getTenantFromURL();
      
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        config.headers["x-access-token"] = token;

        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          config.headers["x-refresh-token"] = refreshToken;
        }
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Handle 401 Unauthorized errors
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      // You can add redirect logic here if needed
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
