import axios from "axios";

const apiUrl = 'http://localhost:3000';

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isSessionExpired = false;

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (!isSessionExpired) {
        isSessionExpired = true;

        // localStorage.removeItem("invUser");
        window.location.href = "/";

        setTimeout(() => {
          isSessionExpired = false;
        }, 1000);
      }
    }

    return Promise.reject(error.response?.data.error || error.response?.data.message || "An error occurred");
  }
);

export default api;