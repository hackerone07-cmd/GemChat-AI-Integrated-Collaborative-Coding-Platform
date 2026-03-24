import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Always attach the latest token from localStorage
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout ONLY when a protected route returns 401 and a token was already stored.
// Never redirect when the 401 came from /login or /register — those are expected
// "wrong credentials" errors that should show a toast, not cause a page reload.
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status          = err.response?.status;
    const url             = err.config?.url || "";
    const isAuthEndpoint  = url.includes("/users/login") || url.includes("/users/register");
    const hadToken        = !!localStorage.getItem("token");

    if (status === 401 && !isAuthEndpoint && hadToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;