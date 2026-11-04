import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * Configured Axios instance with auth interceptors and token refresh.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request Interceptor — Attach access token ───────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Handle 401 with token refresh ────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/me", data),
};

export const propertiesApi = {
  search: (params) => api.get("/properties", { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post("/properties", data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  toggleBookmark: (id) => api.post(`/properties/${id}/bookmark`),
  addReview: (id, data) => api.post(`/properties/${id}/reviews`, data),
  getFeatured: () => api.get("/properties/featured"),
  getTrending: () => api.get("/properties/trending"),
  getAmenities: () => api.get("/properties/amenities"),
};

export const postsApi = {
  getAll: (limit = 20) => api.get("/posts", { params: { limit } }),
  create: (data) => api.post("/posts", data),
  like: (postId) => api.post(`/posts/${postId}/like`),
  comment: (postId, content) => api.post(`/posts/${postId}/comments`, { content }),
};

export const chatApi = {
  getRooms: () => api.get("/chat/rooms"),
  createRoom: (room_name) => api.post("/chat/rooms", { room_name }),
  getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages`),
  sendMessage: (roomId, content) => api.post(`/chat/rooms/${roomId}/messages`, { content }),
};

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
};

export default api;
