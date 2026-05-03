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
  image_url?: string | null;
  imageUrl?: string | null;
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

export interface MessageDto {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ConversationDto {
  id: string;
  participantIds: string[];
  participants: string[];
  participantNames: string[];
  messages: MessageDto[];
}

export interface ProviderServiceDto {
  id: string;
  title: string;
  description: string | null;
  base_price: number | null;
  price_type: 'fixed' | 'hourly' | 'quote';
  duration_mins: number | null;
  service_area: string[] | null;
  images: string[] | null;
  status: 'draft' | 'active' | 'paused' | 'pending_review' | 'rejected';
  created_at: string;
  updated_at?: string;
  service_types: ServiceTypeDto[];
}

export interface ProviderServicePayload {
  title: string;
  description?: string;
  base_price?: number | null;
  price_type?: 'fixed' | 'hourly' | 'quote';
  duration_mins?: number | null;
  service_area?: string[];
  images?: string[];
  status?: 'draft' | 'active' | 'paused' | 'pending_review' | 'rejected';
  service_type_ids: string[];
}

export interface PublicServiceDto {
  id: string;
  title: string;
  description: string | null;
  basePrice: number | null;
  priceType: 'fixed' | 'hourly' | 'quote';
  durationMins: number | null;
  serviceArea: string[];
  location: string;
  images: string[];
  status: string;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    email: string;
    profileImage: string;
  };
  serviceTypes: ServiceTypeDto[];
  categories: string[];
}

export interface PublicProviderDto {
  id: string;
  userId: string;
  slug: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  description: string;
  category: string;
  location: string;
  status: string;
  profileImage: string;
  coverImage: string;
  services: PublicServiceDto[];
  serviceCategories: string[];
}

export interface PublicServiceFilters {
  category?: string;
  provinceId?: string;
  districtId?: string;
  cityId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export const messageApi = {
  listConversations: () =>
    api.get<ConversationDto[]>('/messages/conversations'),

  getMessages: (conversationId: string) =>
    api.get<MessageDto[]>(`/messages/conversations/${conversationId}`),

  send: (data: { toUserId?: string; toEmail?: string; text: string }) =>
    api.post<MessageDto>('/messages', data),

  update: (messageId: string, text: string) =>
    api.put<MessageDto>(`/messages/${messageId}`, { text }),

  delete: (messageId: string) =>
    api.delete<{ success: boolean }>(`/messages/${messageId}`),

  markRead: (conversationId: string) =>
    api.patch<{ success: boolean }>(`/messages/conversations/${conversationId}/read`),
};

export const providerApi = {
  listServices: () =>
    api.get<ProviderServiceDto[]>('/provider/services'),

  createService: (data: ProviderServicePayload) =>
    api.post<ProviderServiceDto>('/provider/services', data),
};

export const publicServiceApi = {
  list: (filters: PublicServiceFilters = {}) =>
    api.get<PaginatedResponse<PublicServiceDto>>('/v1/services', { params: filters }),

  getProvider: (slug: string) =>
    api.get<PublicProviderDto>(`/v1/services/providers/${slug}`),

  getService: (slug: string) =>
    api.get<PublicServiceDto>(`/v1/services/${slug}`),
};

export default api;
