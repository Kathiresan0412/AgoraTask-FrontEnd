import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('agoratask_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses globally — clear auth state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agoratask_token');
        localStorage.removeItem('agoratask_user');
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth API ---

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'provider';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string;
  };
}

export interface ServiceTypeDto {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface ServiceTypePayload {
  parent_id?: string | null;
  slug?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  active?: boolean;
  sort_order?: number;
}

export interface AdminProviderDto {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  location: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
  ownerName: string;
  email: string;
  phone: string;
  profileImage: string;
  isActive: boolean;
}

export interface AdminProviderFilters {
  search?: string;
  status?: string;
  category?: string;
  location?: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', data),

  getMe: () =>
    api.get<AuthResponse['user']>('/auth/me'),
};

export const serviceTypeApi = {
  list: () =>
    api.get<ServiceTypeDto[]>('/service-types'),

  create: (data: ServiceTypePayload) =>
    api.post<ServiceTypeDto>('/service-types', data),

  update: (id: string, data: Partial<ServiceTypePayload>) =>
    api.put<ServiceTypeDto>(`/service-types/${id}`, data),

  updateStatus: (id: string, active: boolean) =>
    api.patch<ServiceTypeDto>(`/service-types/${id}/status`, { active }),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/service-types/${id}`),
};

export const adminApi = {
  listProviders: (filters: AdminProviderFilters = {}) =>
    api.get<AdminProviderDto[]>('/admin/providers', { params: filters }),

  approveProvider: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/providers/${id}/approve`),

  rejectProvider: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/providers/${id}/reject`),
};

export default api;
