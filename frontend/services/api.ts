import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token = Cookies.get('fm_token');
    if (!token && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fm-auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          token = parsed?.state?.token;
        }
      } catch (e) {
        // ignore
      }
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('fm_token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────
// Auth endpoints
// ──────────────────────────────────────
export const authApi = {
  login: (credentials: { login?: string; emailOrUsername?: string; password: string }) =>
    api.post('/api/auth/login', {
      login: credentials.login || credentials.emailOrUsername,
      password: credentials.password,
    }),

  register: (data: {
    username: string;
    email: string;
    displayName: string;
    password: string;
  }) => api.post('/api/auth/register', data),

  me: () => api.get('/api/auth/me'),

  logout: () => api.post('/api/auth/logout'),

  updateProfile: (data: Partial<{ displayName: string; bio: string }>) =>
    api.patch('/api/auth/profile', data),

  uploadAvatar: (formData: FormData) =>
    api.post('/api/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/api/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
};

// ──────────────────────────────────────
// Friends endpoints
// ──────────────────────────────────────
export const friendsApi = {
  getAll: () => api.get('/api/friends'),
  list: () => api.get('/api/friends'),

  getRequests: () => api.get('/api/friends/requests'),
  pending: () => api.get('/api/friends/requests'),

  search: (query: string) =>
    api.get('/api/friends/search', { params: { q: query } }),

  sendRequest: (data: string | { receiverId: string; message?: string }) => {
    const payload = typeof data === 'string' ? { receiverId: data } : data;
    return api.post('/api/friends/request', payload);
  },

  acceptRequest: (requestId: string) =>
    api.patch(`/api/friends/request/${requestId}/accept`),
  accept: (requestId: string) =>
    api.patch(`/api/friends/request/${requestId}/accept`),

  rejectRequest: (requestId: string) =>
    api.patch(`/api/friends/request/${requestId}/reject`),
  reject: (requestId: string) =>
    api.patch(`/api/friends/request/${requestId}/reject`),

  cancelRequest: (requestId: string) =>
    api.delete(`/api/friends/request/${requestId}`),
  cancel: (requestId: string) =>
    api.delete(`/api/friends/request/${requestId}`),

  removeFriend: (friendId: string) => api.delete(`/api/friends/${friendId}`),
  remove: (friendId: string) => api.delete(`/api/friends/${friendId}`),

  blockUser: (userId: string, reason?: string) =>
    api.post(`/api/friends/${userId}/block`, { reason }),

  unblockUser: (userId: string) =>
    api.delete(`/api/friends/${userId}/block`),
};

// ──────────────────────────────────────
// Location endpoints
// ──────────────────────────────────────
export const locationApi = {
  update: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number | null;
    speed?: number | null;
  }) => api.post('/api/location/update', data),

  getMyLocation: () => api.get('/api/location/me'),

  getFriendsLocations: () => api.get('/api/location/friends'),

  getFriendLocation: (friendId: string) =>
    api.get(`/api/location/friend/${friendId}`),

  updateSharing: (data: {
    shareLocation?: boolean;
    shareMode?: string;
    friendId?: string;
    durationMinutes?: number;
  }) => api.post('/api/location/sharing', data),

  stopSharing: () => api.post('/api/location/sharing', { shareLocation: false }),

  revokeSharing: (friendId: string) =>
    api.delete(`/api/location/sharing/${friendId}`),

  getHistory: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/api/location/history', { params }),

  deleteHistory: (id?: string) =>
    id ? api.delete(`/api/location/history/${id}`) : api.delete('/api/location/history'),
};

// ──────────────────────────────────────
// Navigation endpoints
// ──────────────────────────────────────
export const navigationApi = {
  getRoute: (data: {
    targetUserId?: string;
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    mode?: string;
  }) => api.post('/api/navigation/route', data),

  start: (data: {
    targetUserId: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    transportMode?: string;
  }) => api.post('/api/navigation/start', data),

  update: (sessionId: string, data: any) =>
    api.post(`/api/navigation/update/${sessionId}`, data),

  end: (sessionId: string) =>
    api.post(`/api/navigation/end/${sessionId}`),

  getSession: (sessionId: string) =>
    api.get(`/api/navigation/session/${sessionId}`),
};

// ──────────────────────────────────────
// Chat endpoints
// ──────────────────────────────────────
export const chatApi = {
  getConversations: () => api.get('/api/chat/conversations'),
  conversations: () => api.get('/api/chat/conversations'),

  getOrCreateDirect: (friendId: string) =>
    api.post('/api/chat/direct', { friendId }),
  getOrCreateConversation: (friendId: string) =>
    api.post('/api/chat/direct', { friendId }),

  getMessages: (conversationId: string, limit = 50, before?: string) =>
    api.get(`/api/chat/${conversationId}/messages`, { params: { limit, before } }),
  messages: (conversationId: string, page = 1, limit = 30) =>
    api.get(`/api/chat/${conversationId}/messages`, { params: { limit } }),

  sendMessage: (conversationId: string, content: string, type = 'text') =>
    api.post(`/api/chat/${conversationId}/messages`, { content, type }),
};

// ──────────────────────────────────────
// Notifications endpoints
// ──────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/api/notifications', { params }),
  list: () => api.get('/api/notifications'),

  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
  delete: (id: string) => api.delete(`/api/notifications/${id}`),
};

// ──────────────────────────────────────
// Settings endpoints
// ──────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/api/settings'),
  update: (data: Record<string, any>) => api.patch('/api/settings', data),
};

// ──────────────────────────────────────
// Admin endpoints
// ──────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
  stats: () => api.get('/api/admin/stats'),

  getUsers: (params: { page?: number; limit?: number; search?: string; status?: string; role?: string }) =>
    api.get('/api/admin/users', { params }),
  users: (params: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/api/admin/users', { params }),

  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/api/admin/users/${userId}/status`, { status }),

  updateUserRole: (userId: string, role: string) =>
    api.patch(`/api/admin/users/${userId}/role`, { role }),

  updateUser: (userId: string, data: Record<string, any>) =>
    api.patch(`/api/admin/users/${userId}/status`, data),
};

export default api;
